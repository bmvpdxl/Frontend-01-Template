const images = require('images');

function render(viewport, element){
    if(element.style) {
        const img = images(element.style.width, element.style.height);

        if(element.style['backgroundColor']) {
            const color = element.style['backgroundColor'] || 'rgba(0,0,0,1)';
            color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            img.fill(Number(RegExp.$1), Number(RegExp.$2), Number(RegExp.$3), 1);
            viewport.draw(img, element.style.left || 0, element.style.top || 0);
        }
    }

    if(element.children) {
        for(const child of element.children) {
            render(viewport, child);
        }
    }
}

module.exports.render = render;
