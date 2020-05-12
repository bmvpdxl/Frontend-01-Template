const net = require("net");

class Request {
    // method. url = host + port + path
    // body: k/v
    // headers
    constructor(options) {
        this.method = options.method || 'GET';
        this.host = options.host;
        this.path = options.path || '/';
        this.port = options.port || 80;
        this.body = options.body || {};
        this.headers = options.headers || {};
        if (!this.headers['Content-Type']) {
            this.headers['Content-Type'] = "application/x-www-form-urlencoded";
        }

        if (this.headers['Content-Type'] === "application/json") {
            this.bodyText = JSON.stringify(this.body);
        } else if (this.headers['Content-Type'] === "application/x-www-form-urlencoded") {
            this.bodyText = Object.keys(this.body).map(key => `${key}=${encodeURIComponent(this.body[key])}`).join('&');
        }

        this.headers['Content-Length'] = this.bodyText.length;

    }

    toString() {
        return `
${this.method} ${this.path} HTTP/1.1\r
${Object.keys(this.headers).map(key => `${key}: ${this.headers[key]}`).join('\r\n')}\r
\r
${this.bodyText}`
    }

    open(method, url) {

    }

    send(connection) {

        return new Promise((resolve, reject) => {
            if (connection) {
                connection.write(this.toString());
            } else {
                connection = net.createConnection({
                    host: "127.0.0.1",
                    port: 8088,
                }, () => {
                    connection.write(this.toString());
                });

                const parser = new ResponseParser()

                connection.on("data", (data) => {
                    console.log(data.toString())
                    parser.receive(data.toString());
                    if(parser.isFinished) {
                        connection.end();
                        resolve(parser.response)
                    }
                });
                connection.on("error", (err) => {
                    reject(err);
                    connection.end();
                });
            }
        })


    }

}

class Response {
}

class ResponseParser {
    constructor() {
        let n = 0;
        this.WAITING_STATUS_LINE = n++;
        this.WAITING_STATUS_LINE_END = n++;
        this.WAITING_HEADER_NAME = n++;
        this.WAITING_HEADER_NAME_END = n++;
        this.WAITING_HEADER_VALUE = n++;
        this.WAITING_HEADER_VALUE_END = n++;
        this.WAITING_HEADER_BLOCK_END = n++;
        this.WAITING_BODY = n++;

        this.current = this.WAITING_STATUS_LINE;
        this.statusLine = '';
        this.headers = {};
        this.headerName = '';
        this.headerValue = '';
        this.bodyParser = null;
    }

    get isFinished() {
        return this.bodyParser && this.bodyParser.isFinished;
    }

    get response() {
        this.statusLine.match(/HTTP\/1.1 (\d+) ([\s\S]+)/)
        return {
            statusCode: RegExp.$1,
            statusText: RegExp.$2,
            response: this.bodyParser.content.join(''),
        }
    }

    /**
     *
     * @param{string} string
     */
    receive(string) {
        for (let i = 0; i < string.length; i++) {
            this.receiveChar(string.charAt(i));
        }
    }

    receiveChar(char) {

        if (this.current === this.WAITING_STATUS_LINE) {
            if (char === '\r') {
                this.current = this.WAITING_STATUS_LINE_END;
            } else {
                this.statusLine += char;
            }
        } else if (this.current === this.WAITING_STATUS_LINE_END) {
            if (char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if (this.current === this.WAITING_HEADER_NAME) {
            if (char === ':') {
                this.current = this.WAITING_HEADER_NAME_END;
            } else if(char === '\r'){
                this.current = this.WAITING_HEADER_BLOCK_END;
            } else {
                this.headerName += char;
            }
        } else if (this.current === this.WAITING_HEADER_NAME_END) {
            if (char === ' ') {
                this.current = this.WAITING_HEADER_VALUE;
            }
        } else if (this.current === this.WAITING_HEADER_VALUE) {
            if (char === '\r') {
                this.current = this.WAITING_HEADER_VALUE_END;

                this.headers[this.headerName] = this.headerValue;
                this.headerName = '';
                this.headerValue = '';

            } else {
                this.headerValue += char;
            }
        } else if(this.current === this.WAITING_HEADER_VALUE_END) {
            if(char === '\n') {
                this.current = this.WAITING_HEADER_NAME;
            }
        } else if(this.current === this.WAITING_HEADER_BLOCK_END) {
            if(char === '\n') {
                this.current = this.WAITING_BODY;

                if(this.headers['Transfer-Encoding'] === 'chunked') {
                    this.bodyParser = new TrunkedBodyParser();
                }
            }
        } else if(this.current === this.WAITING_BODY) {
            this.bodyParser.receiveChar(char);
        }
    }
}

class TrunkedBodyParser {
    constructor() {
        let n = 0;
        this.WAINTING_LENGTH = n++;
        this.WAINTING_LENGTH_LINE_END = n++;
        this.READING_CHUNCK = n++;
        this.READING_CHUNCK_END = n++;
        this.WAINTING_NEW_LINE = n++;
        this.WAINTING_NEW_LINE_END = n++;


        this.current = this.WAINTING_LENGTH;
        this.content = [];
        this.length = 0;
        this.isFinished = false;

    }

    receiveChar(char) {

        if(this.current === this.WAINTING_LENGTH) {
            if(char === '\r') {

                if(this.length === 0) {
                    this.isFinished = true;
                }

                this.current = this.WAINTING_LENGTH_LINE_END;
            }else{

                // 此处是16进制
                this.length *= 16;
                this.length += parseInt(char, 16);
            }
        }else if(this.current === this.WAINTING_LENGTH_LINE_END) {
            if(char === '\n') {
                this.current = this.READING_CHUNCK;
            }
        }else if(this.current === this.READING_CHUNCK) {
            if(char === '\r') {
                this.current = this.READING_CHUNCK_END;
            }else{
                this.content.push(char);
                this.length -= 1;
                if(this.length === 0) {
                    this.current = this.READING_CHUNCK_END;
                }
            }
        }else if(this.current === this.READING_CHUNCK_END) {
            if(char === '\n') {
                this.current = this.WAINTING_NEW_LINE;
            }
        }else if(this.current === this.WAINTING_NEW_LINE) {
            if(char === '\r') {
                this.current = this.WAINTING_NEW_LINE_END;
            }
        }else if(this.current === this.WAINTING_NEW_LINE_END) {
            if(char === '\n') {
                this.current = this.WAINTING_LENGTH;
            }
        }

    }
}


void async function () {
    let request = new Request({
        method: 'POST',
        host: '127.0.0.1',
        port: 8088,
        headers: {
            "X-Foo2": "customed"
        },
        body: {
            name: 'winter'
        }
    })
    const response = await request.send();
    console.log(response, '------')
}();
