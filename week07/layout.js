function toCamelCase(prop) {
    return prop.replace(/-(\w)/, function(match, p1){
        return p1.toUpperCase()
    });
}

function getStyle(element) {
    if (!element.style) {
        element.style = {};
    }

    for (const prop in element.computedStyle) {
        const camelProp = toCamelCase(prop);
        element.style[camelProp] = element.computedStyle[prop].value;

        if (element.style[camelProp].toString().match(/px$/)) {
            element.style[camelProp] = parseFloat(element.style[prop]);
        }

        if (element.style[camelProp].toString().match(/^[0-9\.]+$/)) {
            element.style[camelProp] = parseFloat(element.style[camelProp]);
        }
    }

    return element.style;
}

module.exports.layout = function (element) {
    if (!element.computedStyle) {
        return;
    }

    const elementStyle = getStyle(element);

    if (elementStyle.display !== 'flex') {
        return;
    }

    const items = element.children.filter(child => child.type === 'element');

    const style = elementStyle;

    ['width', 'height'].forEach(size => {
        if (style[size] === 'auto' || style[size] === '') {
            style[size] = null;
        }
    });


    // 默认值
    if (!style.flexDirection || style.flexDirection === 'auto') {
        style.flexDirection = 'row';
    }
    if (!style.alignItems || style.alignItems === 'auto') {
        style.alignItems = 'stretch';
    }
    if (!style.justifyContent || style.justifyContent === 'auto') {
        style.justifyContent = 'flex-start';
    }
    if (!style.flexWrap || style.flexWrap === 'auto') {
        style.flexWrap = 'nowrap';
    }
    if (!style.alignContent || style.alignContent === 'auto') {
        style.alignContent = 'stretch';
    }


    let mainSize, mainStart, mainEnd, mainSign, mainBase,
        crossSize, crossStart, crossEnd, crossSign, crossBase;
    if (style.flexDirection === 'row') {
        mainSize = 'width';
        mainStart = 'left';
        mainEnd = 'right';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if (style.flexDirection === 'row-reverse') {
        mainSize = 'width';
        mainStart = 'right';
        mainEnd = 'left';
        mainSign = -1;
        mainBase = style.width;

        crossSize = 'height';
        crossStart = 'top';
        crossEnd = 'bottom';
    }

    if (style.flexDirection === 'column') {
        mainSize = 'height';
        mainStart = 'top';
        mainEnd = 'bottom';
        mainSign = +1;
        mainBase = 0;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    if (style.flexDirection === 'column-reverse') {
        mainSize = 'height';
        mainStart = 'bottom';
        mainEnd = 'top';
        mainSign = -1;
        mainBase = style.height;

        crossSize = 'width';
        crossStart = 'left';
        crossEnd = 'right';
    }

    if (style.flexWrap === 'wrap-reverse') {
        const tmp = crossStart;
        crossStart = crossEnd;
        crossEnd = tmp;
        crossSign = -1;
    } else {
        crossBase = 0;
        crossSign = +1;
    }


    let isAutoMainSize = false;
    if (!style[mainSize]) {
        isAutoMainSize = true;

        style[mainSize] = 0;
        items.forEach(item => {
            const itemStyle = item.style;
            if (itemStyle[mainSize] !== null && itemStyle[mainSize] !== undefined) {
                style.mainSize += itemStyle[mainSize];
            }
        });
    }


    let flexLine = [];
    const flexLines = [flexLine];

    let mainSpace = elementStyle[mainSize];
    let crossSpace = 0;

    items.forEach(item => {
        const itemStyle = item.style;

        if (itemStyle[mainSize] === null) {
            itemStyle[mainSize] = 0;
        }


        if (itemStyle.flex) {
            flexLine.push(item);
        } else if (style.flexWrap === 'nowrap' || isAutoMainSize) {
            mainSpace -= itemStyle[mainSize];
            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== undefined) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            flexLine.push(item);
        } else {

            // 单个子元素超过flex容器的宽度，设为容器宽度
            if (itemStyle[mainSize] > style[mainSize]) {
                itemStyle[mainSize] = style[mainSize];
            }

            if (mainSpace < itemStyle[mainSize]) {
                flexLine.mainSpace = mainSpace;
                flexLine.crossSpace = crossSpace;
                flexLine = [item];
                flexLines.push(flexLine);

                mainSpace = style[mainSize];
                crossSpace = 0;
            } else {
                flexLine.push(item);
            }

            if (itemStyle[crossSize] !== null && itemStyle[crossSize] !== undefined) {
                crossSpace = Math.max(crossSpace, itemStyle[crossSize]);
            }
            mainSpace -= itemStyle[mainSize];
        }
    });
    flexLine.mainSpace = mainSpace;

    if (style.flexWrap === 'nowrap' || isAutoMainSize) {
        flexLine.crossSpace = (style[crossSize] !== undefined) ? style[crossSize] : crossSpace;
    } else {
        flexLine.crossSpace = crossSpace;
    }


    if (mainSpace < 0) {
        // 单行，超出wrap宽度. 按比例缩放每个元素

        const scale = style[mainSize] / (style[mainSize] - mainSpace);
        let currentMain = mainBase;
        items.forEach(item => {
            const itemStyle = item.style;

            if (itemStyle.flex) {
                itemStyle[mainSize] = 0;
            }

            // scale item
            itemStyle[mainSize] *= scale;

            itemStyle[mainStart] = currentMain;
            itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
            currentMain = itemStyle[mainEnd];
        });

    } else {

        flexLines.forEach(items => {

            const mainSpace = items.mainSpace;
            let flexTotal = 0;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                const itemStyle = item.style;

                if (itemStyle.flex !== null && itemStyle.flex !== undefined) {
                    flexTotal += itemStyle.flex;
                    // continue;
                }
            }

            if (flexTotal > 0) {
                // 有flex的items

                let currentMain = mainBase;
                items.forEach(item => {
                    const itemStyle = item.style;

                    if (itemStyle.flex) {
                        itemStyle[mainSize] = (mainSpace / flexTotal) * itemStyle.flex;
                    }

                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd];
                });

            } else {
                // 没有flex，justifyContent属性生效

                let currentMain, step;

                if(style.justifyContent === 'flex-start') {
                    currentMain = mainSpace;
                    step = 0;
                }
                if(style.justifyContent === 'flex-end') {
                    currentMain = mainSpace * mainSign + mainBase;
                    step = 0;
                }
                if(style.justifyContent === 'center') {
                    currentMain = mainSpace / 2 * mainSign + mainBase;
                    step = 0;
                }
                if(style.justifyContent === 'space-between') {
                    step = mainSpace / (items.length - 1) * mainSign;
                    currentMain = mainBase;
                }
                if(style.justifyContent === 'space-around') {
                    step = mainSpace / items.length * mainSign;
                    currentMain = step / 2 + mainBase;
                }

                items.forEach(item=>{
                    const itemStyle = item.style;
                    itemStyle[mainStart] = currentMain;
                    itemStyle[mainEnd] = itemStyle[mainStart] + mainSign * itemStyle[mainSize];
                    currentMain = itemStyle[mainEnd] + step;
                });

            }

        })
    }


    // 计算cross
    if(!style[crossSize]) {
        crossSpace = 0;
        style[crossSize] = 0;
        flexLines.forEach(item=>{
            style[crossSize] += item.crossSpace;
        });
    }else{
        crossSpace = style[crossSize];
        flexLines.forEach(item=>{
            crossSpace -= item.crossSpace;
        });
    }


    if(style.flexWrap === 'wrap-reverse') {
        crossBase = style[crossSize];
    }else{
        crossBase = 0;
    }
    const lineSize = style[crossSize] / flexLines.length;

    let step;
    if(style.alignContent === 'flex-start') {
        crossBase += 0;
        step = 0;
    }
    if(style.alignContent === 'flex-end') {
        crossBase += crossSign * crossSpace;
        step = 0;
    }
    if(style.alignContent === 'center') {
        crossBase += crossSign * crossSpace / 2;
        step = 0;
    }
    if(style.alignContent === 'space-between') {
        crossBase += 0;
        step = crossSpace / (flexLines.length - 1);
    }
    if(style.alignContent === 'space-around') {
        step = crossSpace / (flexLines.length);
        crossBase += crossSign * step / 2;
    }
    if(style.alignContent === 'stretch') {
        crossBase += 0;
        step = 0;
    }

    flexLines.forEach(items=>{
        const lineCrossSize = style.alignContent === 'stretch' ? items.crossSpace + crossSpace / flexLines.length : items.crossSpace;


        items.forEach(item=>{
            const itemStyle = item.style;

            const align = itemStyle.alignSelf || style.alignItems;

            if(itemStyle[crossSize] === null) {
                itemStyle[crossSize] = align === 'stretch' ? lineCrossSize : 0;
            }

            if(align === 'flex-start') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];
            }
            if(align === 'flex-end') {
                itemStyle[crossEnd] = crossBase + crossSign * lineCrossSize;
                itemStyle[crossStart] = itemStyle[crossEnd] - crossSign * itemStyle[crossSize];
            }
            if(align === 'center') {
                itemStyle[crossStart] = crossBase + crossSign * (lineCrossSize - itemStyle[crossSize]) / 2;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * itemStyle[crossSize];

            }
            if(align === 'stretch') {
                itemStyle[crossStart] = crossBase;
                itemStyle[crossEnd] = itemStyle[crossStart] + crossSign * (itemStyle[crossSize] !== null && itemStyle[crossSize] !== undefined ? itemStyle[crossSize] : lineCrossSize);
                itemStyle[crossSize] = crossSign * (itemStyle[crossEnd] - itemStyle[crossStart]);
            }
        });

        crossBase += crossSign * (lineCrossSize + step);

    })


}
