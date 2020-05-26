const {computeCSS, addCSSRules} = require("./css-computed");
const {layout} = require('./layout');

const EOF = Symbol('EOF');

let currentToken = null;
let currentAttribute = null;
let currentTextNode = null;

let stack = [{type: 'document', children: []}];

function emit(token) {
    let top = stack.slice(-1)[0];

    if (token.type === 'startTag') {
        let element = {
            type: 'element',
            children: [],
            attributes: []
        }

        element.tagName = token.tagName;

        for (let p in token) {
            if (p !== 'tagName' && p !== 'type') {
                element.attributes.push({
                    name: p,
                    value: token[p],
                })
            }
        }

        // 在computeCSS中需要寻找父元素，先设置parent
        element.parent = top;

        computeCSS(element);

        top.children.push(element);

        if (!token.isSelfClosing) {
            stack.push(element);
        }

        currentTextNode = null;
    } else if (token.type === 'endTag') {

        if (top.tagName !== token.tagName) {
            throw new Error('Tag start and Tag end not match!');
        } else {

            // +++++++++++++++++++++++++++++++++++++++++++++
            if (top.tagName === 'style') {
                addCSSRules(top.children[0].content)
            }

            layout(top);

            stack.pop();
        }

        currentTextNode = null;

    } else if (token.type === 'EOF') {

    } else if (token.type === 'text') {
        if (currentTextNode === null) {
            currentTextNode = {
                type: 'text',
                content: ''
            }
            top.children.push(currentTextNode);
        }
        currentTextNode.content += token.content;
    }

}

function data(c) {
    if (c === '<') {
        return tagOpen;
    } else if (c === EOF) {
        emit({
            type: 'EOF'
        });
        return data;
    } else {
        emit({
            type: 'text',
            content: c,
        });
        return data;
    }
}

function tagOpen(c) {
    if (c === '/') {
        return endTagOpen;
    } else if (/^[A-Za-z]$/.test(c)) {
        currentToken = {
            type: 'startTag',
            tagName: '',
        };
        return tagName(c);
    }
}

function tagName(c) {
    if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '>') {
        emit(currentToken);
        return data;
    } else if (/^[A-Za-z]$/.test(c)) {
        currentToken.tagName += c;
        return tagName;
    } else if (/^[\t\n\f\s]$/.test(c)) {
        return beforeAttributeName;
    } else {
        currentToken.tagName += c;
        return tagName;
    }
}

function selfClosingStartTag(c) {
    if (c === '>') {
        currentToken.isSelfClosing = true;
        emit(currentToken);
        return data;
    } else if (c === EOF) {
        emit({
            type: 'EOF'
        })
    } else {
        return data;
    }
}

function beforeAttributeName(c) {
    if (/^[\t\n\f\s]$/.test(c)) {
        return beforeAttributeName;
    } else if (c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c);
    } else {
        currentAttribute = {
            name: '',
            value: '',
        }
        return attributeName(c);
    }
}

function attributeName(c) {
    if (/^[\t\n\f\s]$/.test(c) || c === '/' || c === '>' || c === EOF) {
        return afterAttributeName(c);
    } else if (c === '=') {
        return beforeAttributeValue;
    } else if (/^[A-Za-z]$/.test(c)) {
        currentAttribute.name += c;
        return attributeName;
    } else {
        return attributeName;
    }
}

function afterAttributeName(c) {
    if (/^[\t\n\f\s]$/.test(c)) {
        return afterAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '=') {
        return beforeAttributeValue;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else {
        currentAttribute = {
            name: '',
            value: '',
        }
        return attributeName(c);
    }

}

function beforeAttributeValue(c) {
    if (/^[\t\n\f\s]$/.test(c)) {
        return beforeAttributeValue;
    } else if (c === '"') {
        return doubleQuoteAttributeValue;
    } else if (c === '\'') {
        return singleQuoteAttributeValue;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else {
        return unquoteAttributeValue(c);
    }
}

function doubleQuoteAttributeValue(c) {
    if (c === '"') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuoteAttributeValue;
    } else {
        currentAttribute.value += c;
        return doubleQuoteAttributeValue;
    }
}

function singleQuoteAttributeValue(c) {
    if (c === '\'') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return afterQuoteAttributeValue;
    } else {
        currentAttribute.value += c;
        return doubleQuoteAttributeValue;
    }
}

function unquoteAttributeValue(c) {
    if (/^[\t\n\f\s]$/.test(c)) {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return beforeAttributeName;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else if (c === '/') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        return selfClosingStartTag;
    } else {
        currentAttribute.value += c;
        return unquoteAttributeValue;
    }

}

function afterQuoteAttributeValue(c) {
    if (/^[\t\n\f\s]$/.test(c)) {
        return beforeAttributeName;
    } else if (c === '/') {
        return selfClosingStartTag;
    } else if (c === '>') {
        currentToken[currentAttribute.name] = currentAttribute.value;
        emit(currentToken);
        return data;
    } else {
        return data;
    }
}

function endTagOpen(c) {
    if (/^[A-Za-z]$/.test(c)) {
        currentToken = {
            type: 'endTag',
            tagName: ''
        }
        return tagName(c);
    } else {
        return data;
    }
}

module.exports.parseHTML = function parseHTML(html) {
    let state = data;
    for (let c of html) {
        state = state(c);
    }
    state = state(EOF);

    return stack[0];
}
