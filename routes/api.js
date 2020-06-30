const router = require('koa-router')()
const path = require('path')
const fs = require('fs')
const request = require('request');
const {
    SuccessModel,
    ErrorModel
} = require('../model/resModel')

// 获取项目列表
const getProjectList = function () {
    return JSON.parse(fs.readFileSync(path.resolve(__dirname, `../database/projectList.json`)));
}

// 获取项目名称列表
const getProjectNameList = function () {
    return getProjectList().map(item => item.name)
}

// 创建apiJson
const creatApiJson = function (name, dataSource) {
    fs.openSync(path.resolve(__dirname, `../apiJson/${name}.json`), 'w')
    fs.writeFileSync(path.resolve(__dirname, `../apiJson/${name}.json`), JSON.stringify(dataSource))
}

// 发送http
const _fetch = function (url) {
    return new Promise((resolve, reject) => {
        request(url, {
            json: true
        }, (err, res, body) => {
            if (err) {
                reject(err)
            } else {
                resolve(body)
            }
        })
    })

}

router.prefix('/api')

router.post('/project/add', async (ctx, next) => {
    const reqBody = ctx.request.body

    if (!reqBody['name']) {
        ctx.body = new ErrorModel(null, "缺少项目名");
        return;
    }
    if (!reqBody['desc']) {
        ctx.body = new ErrorModel(null, "缺少项目描述");
        return;
    }
    if (!reqBody['dataType']) {
        ctx.body = new ErrorModel(null, "缺少数据来源类型");
        return;
    }
    if ((reqBody['dataType'] === 'code' && !reqBody['dataSourcecode']) || (reqBody['dataType'] === 'link' && !reqBody['dataSourcelink'])) {
        ctx.body = new ErrorModel(null, "缺少数据来源");
        return;
    }
    if (reqBody['dataType'] === 'file' && !ctx.request.files.dataSourcefile.name) {
        ctx.body = new ErrorModel(null, "缺少数据来源, 没有选择上传文件");
        return;
    }

    const projectNamelist = getProjectNameList()
    if (projectNamelist.includes(reqBody['name'])) {
        ctx.body = new ErrorModel(null, "项目名已存在");
        return;
    }

    // 文件
    if (reqBody['dataType'] === 'file') {
        let data = ''
        // 创建可读流
        const readerStream = fs.createReadStream(ctx.request.files.dataSourcefile.path);

        // 设置编码为 utf8。
        readerStream.setEncoding('UTF8');

        // 处理流事件 --> data, end, and error
        readerStream.on('data', function (chunk) {
            data += chunk;
        });

        readerStream.on('end', function () {
            const jsonData = JSON.parse(data)
            if (!jsonData.swagger && (!jsonData[0] || !jsonData[0].list || !jsonData[0].list[0] || !jsonData[0].list[0].path)) {
                ctx.body = new ErrorModel(null, "数据格式不符合规范");
                return;
            } else {
                // 创建json
                creatApiJson(reqBody['name'], jsonData)
            }
        });

        readerStream.on('error', function (err) {
            console.log(err.stack);
            ctx.body = new ErrorModel(null, err.stack);
            return;
        });
    }

    // 代码
    if (reqBody['dataType'] === 'code') {
        const jsonData = JSON.parse(reqBody['dataSourcecode'])
        if (!jsonData.swagger && (!jsonData[0] || !jsonData[0].list || !jsonData[0].list[0] || !jsonData[0].list[0].path)) {
            ctx.body = new ErrorModel(null, "数据格式不符合规范");
            return;
        } else {
            // 创建json
            creatApiJson(reqBody['name'], jsonData)
        }
    }

    // 链接
    if (reqBody['dataType'] === 'link') {

        try {
            const jsonData = await _fetch(reqBody['dataSourcelink'])
            if (!jsonData.swagger && (!jsonData[0] || !jsonData[0].list || !jsonData[0].list[0] || !jsonData[0].list[0].path)) {
                ctx.body = new ErrorModel(null, "数据格式不符合规范");
                return;
            } else {
                // 创建json
                creatApiJson(reqBody['name'], jsonData)
            }
        } catch (err) {
            ctx.body = new ErrorModel(null, err.toString())
            return
        }
    }

    const projectlist = getProjectList()
    projectlist.push({
        name: reqBody['name'],
        desc: reqBody['desc'],
        dataSource: `/apiJson/${reqBody['name']}.json`
    })

    // 写入项目列表
    try {
        fs.writeFileSync(path.resolve(__dirname, `../database/projectList.json`), JSON.stringify(projectlist))
    } catch (err) {
        ctx.body = new ErrorModel(null, err)
        return
    }

    ctx.body = new SuccessModel(null, '创建成功')
})

router.get('/project/list', async (ctx, next) => {
    const projectlist = getProjectList()
    ctx.body = new SuccessModel(projectlist)
})

module.exports = router