

const numberLiteralPattern = /(?<![\u0000-\u{10ffff}])(((((0|([1-9]\d*))\.\d*)|(\.\d+)|(0|([1-9]\d*)))([eE][+-]?\d+)?)|(0[bB][01]+|0[oO][0-7]+)|(0[xX][0-9a-fA-F]+))(?![\u0000-\u{10ffff}])/u

const encodeStr = function(str='') {
    let bitStr = str.codePointAt(0).toString(2);

    // todo: 多字节编码

    while(bitStr.length < 8) {
        bitStr = '0' + bitStr;
    }
    return bitStr;
}

const utf8Encoding = function(str) {
    if(typeof str !== 'string') {
        throw new TypeError('expected string got ' + typeof str);
    }

    let result = '';
    for(const s of str) {
        result += encodeStr(s);
    }

    return result;
}

const stringLiteralPattern = /("([^"\\\u000a\u000d]|(\\((['"\\bfnrtv]|[^'"\\bfnrtvxu\d\u000a\u000d\u2028\u2029])|(0(?!\d))|(x[0-9a-fA-F]{2})|(u[0-9a-fA-F]{4})|(u\{[\u0000-\u{10ffff}]\})))|(\\(\u000a|\u2028|\u2029|\u000d\u000a?)]))*")|('([^'\\\u000a\u000d]|(\\((["'\\bfnrtv]|[^"'\\bfnrtvxu\d\u000a\u000d\u2028\u2029])|(0(?!\d))|(x[0-9a-fA-F]{2})|(u[0-9a-fA-F]{4})|(u\{[\u0000-\u{10ffff}]\})))|(\\(\u000a|\u2028|\u2029|\u000d\u000a?)]))*')/









// 以下为写正则的过程，请忽略 = =


// const hexescapeseq = /x[0-9a-fA-F]{2}/
// const unicodeseq = /(u[0-9a-fA-F]{4})|(u\{[\u0000-\u{10ffff}]\})/u
// const con2 = /0(?!\d)/
// const charactorescap = /['"\\bfnrtv]/
//
// const singleescape = /['"\\bfnrtv]/;
// const nonescape = /[^'"\\bfnrtvxu\d\u000a\u000d\u2028\u2029]/;
//
// const escapecharactor = /['"\\bfnrtvxu\d]/;
// const lineterminator = /[\u000a\u000d\u2028\u2029]/
//
//
// const escapeseq = /(0(?!\d))|(x[0-9a-fA-F]{2})|(u[0-9a-fA-F]{4})|(u\{[\u0000-\u{10ffff}]\})/
//
// const db_con1_2 = /[^"\\\u000a\u000d]*/
// const db_con3 = /(\\((['"\\bfnrtv]|[^'"\\bfnrtvxu\d\u000a\u000d\u2028\u2029])|(0(?!\d))|(x[0-9a-fA-F]{2})|(u[0-9a-fA-F]{4})|(u\{[\u0000-\u{10ffff}]\})))*/
// const db_con4 = /(\\(\u000a|\u2028|\u2029|\u000d\u000a?)])*/



// const doubleStr = /"([^"\\\u000a\u000d]|(\\((['"\\bfnrtv]|[^'"\\bfnrtvxu\d\u000a\u000d\u2028\u2029])|(0(?!\d))|(x[0-9a-fA-F]{2})|(u[0-9a-fA-F]{4})|(u\{[\u0000-\u{10ffff}]\})))|(\\(\u000a|\u2028|\u2029|\u000d\u000a?)]))*"/
// const singleStr = /'([^'\\\u000a\u000d]|(\\((["'\\bfnrtv]|[^"'\\bfnrtvxu\d\u000a\u000d\u2028\u2029])|(0(?!\d))|(x[0-9a-fA-F]{2})|(u[0-9a-fA-F]{4})|(u\{[\u0000-\u{10ffff}]\})))|(\\(\u000a|\u2028|\u2029|\u000d\u000a?)]))*'/



