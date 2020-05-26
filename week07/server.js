const http = require("http");


const server = http.createServer((req, res) => {
    console.log('request received');
    console.log(req.headers)
    res.setHeader("Content-Type", "text/html");
    res.setHeader("X-Foo", "bar");
    res.writeHead(200, { "Content-Type": "text/plain" });

    res.end(`
<html maaa=a >
<head>
    <style>
    #container {
        width: 500px;
        height: 300px;
        display: flex;
        justify-content: space-around;
        background-color: rgb(255,255,255);
    }
    
    #container #myid {
        width: 200px;
        background-color: rgb(255, 0, 0);
        height: 100px;
    }
    #container .c1 {
        width: 50px;
        background-color: rgb(0, 255, 0);
        height: 200px;
    }
    #container .c2 {
        width: 50px;
        background-color: rgb(0, 0, 255);
        height: 100px;
        align-self: flex-end;
    }
    </style>
</head>
<body>
    <div id="container">
        <div id="myid"></div>
        <div class="c2"></div>
        <div class="c1"></div>
    </div>
</body>
</html>
`);
});

server.listen("8088");
