const css = require('css');


let rules = [];


function match(element, selector) {
    if (!selector || !element.attributes) {
        return false;
    }

    if (selector.charAt(0) === '#') {

        const attr = element.attributes.filter(attr => attr.name === 'id')[0];
        if (attr && attr.value === selector.replace('#', '')) {
            return true;
        }

    } else if (selector.charAt(0) === '.') {
        // 可能有多个
        const attr = element.attributes.filter(attr => attr.name === 'class')[0];
        let classList = [];
        if (attr) {
            classList = attr.value.split(/\s+/).filter(item => item);
        }

        if (classList.includes(selector.replace('.', ''))) {
            return true;
        }

    } else {
        if (element.tagName === selector) {
            return true;
        }
    }

    return false;
}


function specificity(selector) {
    const sp = [0, 0, 0, 0];

    const selectorParts = selector.split(' ');
    for (const part of selectorParts) {
        if (part.charAt(0) === '#') {
            sp[0] += 1;
        } else if (part.charAt(0) === '.') {
            sp[1] += 1;
        } else {
            sp[3] += 1;
        }
    }

    return sp;
}


function compare(sp1, sp2) {
    if (sp1[0] - sp2[0]) {
        return sp1[0] - sp2[0];
    }
    if (sp1[1] - sp2[1]) {
        return sp1[1] - sp2[1];
    }
    if (sp1[2] - sp2[2]) {
        return sp1[2] - sp2[2];
    }
    return sp1[3] - sp2[3];
}


module.exports.addCSSRules = function (text) {
    const ast = css.parse(text);
    rules.push(...ast.stylesheet.rules);
}


module.exports.computeCSS = function (element) {
    const elements = [];
    let temp = element;
    while (temp.parent) {
        elements.push(temp.parent);
        temp = temp.parent;
    }

    if (!element.computedStyle) {
        element.computedStyle = {};
    }

    for (let rule of rules) {
        const selectorParts = rule.selectors[0].split(' ').reverse();

        if (!match(element, selectorParts[0])) {
            continue;
        }

        let j = 1;
        let matched = false;
        for (let i = 0; i < elements.length; i++) {
            if (match(elements[i], selectorParts[j])) {
                j++;
            }
        }

        if (j >= selectorParts.length) {
            matched = true;
        }

        if (matched) {
            // console.log('matched rule', element, rule.declarations);
            // console.log('------------------------');

            const sp = specificity(rule.selectors[0]);

            const computedStyle = element.computedStyle;
            for (let declaration of rule.declarations) {
                if (!computedStyle[declaration.property]) {
                    computedStyle[declaration.property] = {};
                }

                if (!computedStyle[declaration.property].specificity) {
                    computedStyle[declaration.property].specificity = sp;
                    computedStyle[declaration.property].value = declaration.value;
                } else if (compare(computedStyle[declaration.property].specificity, sp) <= 0) {
                    computedStyle[declaration.property].specificity = sp;
                    computedStyle[declaration.property].value = declaration.value;
                }

            }

        }
    }

}

