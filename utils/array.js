/**
 * 清除一个数组中值为空的项
 * @param {Array} array 
 * @return 处理后的数组
 */
const cleanEmptyInArray = function (array) {
    let [...newArray] = array;
    const count = newArray.length;
    for (let i = count - 1; i >= 0; i--) {
        if (newArray[i] === "" || newArray[i] === null || newArray[i] === undefined) {
            newArray.splice(i, 1);
        }
    }
    return newArray;
}

module.exports = {
    cleanEmptyInArray
}