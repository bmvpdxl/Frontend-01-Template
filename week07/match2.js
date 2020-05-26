
// match abababx
function match(string) {
    let state = start;

    for(let c of string) {
        state = state(c);
    }

    return state === end;
}

function end(c) {
    return end;
}

function start(c) {
    if(c === 'a') {
        return foundA;
    }else{
        return start;
    }
}

function foundA(c) {
    if(c === 'b') {
        return foundB;
    }else{
        return start;
    }
}

function foundB(c) {
    if(c === 'a') {
        return foundA2;
    }else{
        return start;
    }
}

function foundA2(c) {
    if(c === 'b') {
        return foundB2;
    }else{
        return start;
    }
}

function foundB2(c) {
    if(c === 'a') {
        return foundA3;
    }else{
        return start;
    }
}

function foundA3(c) {
    if(c === 'b') {
        return foundB3;
    }else{
        return start;
    }
}

function foundB3(c) {
    if(c === 'x') {
        return end;
    }else{
        return foundB2(c);
    }
}

console.log(match('abababx'));
console.log(match('ababababx'));
