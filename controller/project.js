const path = require('path')
const fs = require('fs')
const _fetch = require('../utils/fetch')
const {
    SuccessModel,
    ErrorModel
} = require('../model/resModel')

// 获取项目列表
const list = function () {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, `../database/projectList.json`)));
}

// 获取项目名称列表
const nameList = function () {
    return list().map(item => item.name)
}

// 创建apiJson
const creatApiJson = function (name, dataSource) {
    fs.openSync(path.resolve(__dirname, `../apiJson/${name}.json`), 'w')
    fs.writeFileSync(path.resolve(__dirname, `../apiJson/${name}.json`), JSON.stringify(dataSource))
}

// 处理文件来源数据
const dataFromFile = async function (ctx) {
    try {
        const jsonData = await getFileContent(ctx.request.files.dataSourcefile.path)
        if (!jsonData.swagger && (!jsonData[0] || !jsonData[0].list || !jsonData[0].list[0] || !jsonData[0].list[0].path)) {
            ctx.body = new ErrorModel(null, "数据格式不符合规范");
            return;
        } else {
            // 创建json
            creatApiJson(ctx.request.body['name'], jsonData)
            return true
        }
    } catch (err) {
        ctx.body = new ErrorModel(null, err.toString());
        return;
    }
}

// 处理代码来源数据
const dataFromCode = async function (ctx) {
    try {
        const jsonData = JSON.parse(ctx.request.body['dataSourcecode'])
        if (!jsonData.swagger && (!jsonData[0] || !jsonData[0].list || !jsonData[0].list[0] || !jsonData[0].list[0].path)) {
            ctx.body = new ErrorModel(null, "数据格式不符合规范");
            return;
        } else {
            // 创建json
            project.creatApiJson(ctx.request.body['name'], jsonData)
            return true
        }
    } catch (err) {
        ctx.body = new ErrorModel(null, err.toString());
        return;
    }
}

// 处理链接来源数据
const dataFromLink = async function (ctx) {
    try {
        const jsonData = await _fetch(ctx.request.body['dataSourcelink'])
        if (!jsonData.swagger && (!jsonData[0] || !jsonData[0].list || !jsonData[0].list[0] || !jsonData[0].list[0].path)) {
            ctx.body = new ErrorModel(null, "数据格式不符合规范");
            return;
        } else {
            // 创建json
            project.creatApiJson(ctx.request.body['name'], jsonData)
            return true
        }
    } catch (err) {
        ctx.body = new ErrorModel(null, err.toString())
        return
    }
}

const getFileContent = function (path) {
    return new Promise((resolve, reject) => {
        let data = ''
        // 创建可读流
        const readerStream = fs.createReadStream(path);

        // 设置编码为 utf8。
        readerStream.setEncoding('UTF8');

        // 处理流事件 --> data, end, and error
        readerStream.on('data', function (chunk) {
            data += chunk;
        });

        readerStream.on('end', function () {
            const jsonData = JSON.parse(data)
            if (!jsonData.swagger && (!jsonData[0] || !jsonData[0].list || !jsonData[0].list[0] || !jsonData[0].list[0].path)) {
                reject("数据格式不符合规范")
            } else {
                resolve(jsonData)
            }
        });

        readerStream.on('error', function (err) {
            console.log(err.stack);
            reject(err.stack)
        });
    })
}

// 项目是否已存在
const isExist = function (name) {
    const projectNamelist = nameList()
    if (projectNamelist.includes(name)) {
        return true;
    }
    return false
}

module.exports = {
    creatApiJson,
    nameList,
    list,
    getFileContent,
    dataFromFile,
    dataFromCode,
    dataFromLink,
    isExist
}