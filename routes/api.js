const router = require('koa-router')()
const path = require('path')
const fs = require('fs')
const request = require('request');
const project = require('../controller/project')
const _fetch = require('../utils/fetch')
const {
    SuccessModel,
    ErrorModel
} = require('../model/resModel')

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

    if (project.isExist(reqBody['name'])) {
        ctx.body = new ErrorModel(null, "项目名已存在");
        return;
    }

    // 文件
    if (reqBody['dataType'] === 'file' && !await project.dataFromFile(ctx)) {
        return
    }

    // 代码
    if (reqBody['dataType'] === 'code' && !await project.dataFromCode(ctx)) {
        return
    }

    // 链接
    if (reqBody['dataType'] === 'link' && !await project.dataFromLink(ctx)) {
        return
    }

    const projectlist = project.list()
    projectlist.push({
        name: reqBody['name'],
        desc: reqBody['desc'],
        dataSource: `/apiJson/${reqBody['name']}.json`
    })

    // 写入项目列表
    try {
        fs.writeFileSync(path.resolve(__dirname, `../database/projectList.json`), JSON.stringify(projectlist))
        ctx.body = new SuccessModel(null, '创建成功')
    } catch (err) {
        ctx.body = new ErrorModel(null, err)
    }
})

router.get('/project/list', async (ctx, next) => {
    ctx.body = new SuccessModel(project.list())
})

router.post('/project/edit', async (ctx, next) => {
    const reqBody = ctx.request.body

    if (!reqBody['name']) {
        ctx.body = new ErrorModel(null, "缺少项目名");
        return;
    }

    if (!project.isExist(reqBody['name'])) {
        ctx.body = new ErrorModel(null, "项目不存在");
        return;
    }

    if (!reqBody['desc']) {
        ctx.body = new ErrorModel(null, "缺少项目描述");
        return;
    }
    
    if (reqBody['dataType']) {
        if (reqBody['dataType'] === 'code' && reqBody['dataSourcecode'] && !await project.dataFromCode(ctx)) {
            return;
        } else if (reqBody['dataType'] === 'link' && reqBody['dataSourcelink'] && !await project.dataFromLink(ctx)) {
            return;
        } else if (reqBody['dataType'] === 'file' && ctx.request.files.dataSourcefile.name && !await project.dataFromFile(ctx)) {
            return;
        }
    }

    const projectlist = project.list()
    projectlist.forEach(item => {
        if(item.name===reqBody['name']){
            item.desc=reqBody['desc']
        }
    })

    // 写入项目列表
    try {
        fs.writeFileSync(path.resolve(__dirname, `../database/projectList.json`), JSON.stringify(projectlist))
        ctx.body = new SuccessModel(null, '更新成功')
    } catch (err) {
        ctx.body = new ErrorModel(null, err)
    }
})

router.post('/project/delete', async (ctx, next) => {
    const reqBody = ctx.request.body

    if (!project.isExist(reqBody['name'])) {
        ctx.body = new ErrorModel(null, "项目不存在");
        return;
    }

    const projectlist = project.list().filter(item => {
        return item.name!=reqBody['name']
    })

    // 写入项目列表
    try {
        fs.unlinkSync(path.resolve(__dirname, `../apiJson/${reqBody['name']}.json`)) // 删除json文件
        fs.writeFileSync(path.resolve(__dirname, `../database/projectList.json`), JSON.stringify(projectlist)) // 列表中删除
        ctx.body = new SuccessModel(null, '删除成功')
    } catch (err) {
        ctx.body = new ErrorModel(null, err)
        return
    }
})

module.exports = router