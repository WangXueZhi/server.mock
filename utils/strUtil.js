// 下划线转换驼峰
function toHump(name) {
    return name.replace(/\_(\w)/g, function (all, letter) {
        return letter.toUpperCase();
    });
}
// 驼峰转换下划线
function toLine(name) {
    return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// 转换字段名到下划线
function columnsTransformToLine(data) {
    const newData = {};
    for (let key in data) {
        newData[toLine(key)] = data[key];
    }
    return newData
}

// 转换字段名到驼峰
function columnsTransformToHump(data) {
    const newData = {};
    for (let key in data) {
        newData[toHump(key)] = data[key];
    }
    return newData
}

module.exports = {
    toLine,
    toHump,
    columnsTransformToLine,
    columnsTransformToHump
};