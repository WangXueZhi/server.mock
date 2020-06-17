const {
    cleanEmptyInArray
} = require('../utils/array')
const path = require('path')
const fs = require('fs')
const Mock = require('mockjs')

// 解析配置文件里的参数
const parseParameInJson = function (parameters, isRequired) {
    const querys = []
    const bodys = []
    const headers = []
    const paths = []
    parameters.forEach(parame => {
        if (isRequired && !parame.required) {
            return
        }
        parame.in === "header" && headers.push(parame);
        (parame.in === "body" || parame.in === "formData") && bodys.push(parame);
        parame.in === "query" && querys.push(parame);
        parame.in === "path" && paths.push(parame);
    });
    return {
        querys,
        bodys,
        headers,
        paths
    }
}

// 检查参数
const checkParameters = function (ctx, parameters) {
    const checkInfo = {
        valid: false,
        msg: ''
    }

    // mock不需要检查header
    const {
        querys,
        bodys
    } = parseParameInJson(parameters, true)

    // 配置中没有参数直接返回成功
    if (!querys.length && !bodys.length) {
        checkInfo.valid = true
        return checkInfo
    }

    if (querys.length) {
        for (let i = 0; i < querys.length; i++) {
            if (!ctx.request.query[querys[i].name]) {
                checkInfo.msg = `缺少必须参数-${querys[i].name}`
                return checkInfo
            }
        }
    }

    if (bodys.length) {
        for (let i = 0; i < bodys.length; i++) {
            if (!ctx.request.body[bodys[i].name]) {
                checkInfo.msg = `缺少必须参数-${bodys[i].name}`
                return checkInfo
            }
        }
    }

    checkInfo.valid = true
    return checkInfo
}

// 检测请求体是否符合接口要求
const checkRequest = function (ctx, requestInfo) {
    const method = ctx.request.method.toLowerCase()

    const checkInfo = {
        valid: false,
        msg: '',
        data: null
    }

    const requestData = requestInfo[method]
    if (!requestData) {
        checkInfo.msg = '方法不匹配'
        return checkInfo
    }
    if (requestData.consumes[0] !== ctx.request.header['content-type']) {
        checkInfo.msg = 'content-type不匹配'
        return checkInfo
    }

    const checkResult = checkParameters(ctx, requestData.parameters)
    console.log(checkResult)
    if (!checkResult.valid) {
        return checkResult
    }

    checkInfo.valid = true
    checkInfo.data = requestData
    return checkInfo
}

/**
 * 根据swagger版本转换数据
 * @param { Object } data 
 * @returns { Object } 转换后的数据
 */
const transformDataBySwaggerVersion = function (data) {
    let apisArr = []
    if (data.swagger === '2.0') {
        // swagger2
        // 转换对象数据为数组数据
        for (const path in data.paths) {
            const item = data.paths[path]
            for (const method in item) {
                apisArr.push({
                    path,
                    method,
                    ...item[method]
                })
            }
        }
    } else {
        // swagger3
        data.forEach(item => {
            apisArr.push(...item.list)
        })
    }

    return apisArr
}

// 匹配restful接口
const matchRestfulUrl = function (path, jsonObject) {
    const pathArr = cleanEmptyInArray(path.split("/"))
    let paths = transformDataBySwaggerVersion(jsonObject)

    // 过滤出符合条件的接口
    paths = paths.filter(item => {
        return item.path.indexOf(`/${pathArr[0]}/`) == 0
    })

    let maxMatchArr = []
    let maxMatchNum = 0

    // 遍历出符合的url
    paths.forEach((item, index) => {
        const urlArr = cleanEmptyInArray(item.path.split("/"))
        let matchNum = 0
        const matchArr = []
        urlArr.forEach((item, index) => {
            if (item == pathArr[index]) {
                matchNum++
            }
            matchArr.push(item)
        })
        if (matchNum > maxMatchNum) {
            maxMatchArr = matchArr
            maxMatchNum = matchNum
        }
        if (matchNum == maxMatchNum && matchArr.length > maxMatchArr.length) {
            maxMatchArr = matchArr
            maxMatchNum = matchNum
        }
    })

    // 检测是否是符合restful风格
    const matchedUrl = maxMatchArr.join("/")
    if (matchedUrl.includes('{') && matchedUrl.includes('}')) {
        return `/${matchedUrl}`
    } else {
        return null
    }
}

// 创建mock数据
const creatMock = function (prop) {
    if (prop.type == 'object') {
        return {}
    }
    if (prop.type == 'string') {
        if (prop.format == 'date-time') {
            return Mock.Random.datetime('yyyy-MM-dd HH:mm:ss')
        }
        return Mock.Random.word()
    }
    if (prop.type == 'integer') {
        if (prop.format == 'int16') {
            return Mock.mock({
                'key|-32768-32767': 1
            })['key']
        }
        if (prop.format == 'int32') {
            return Mock.mock({
                'key|-2147483648-2147483647': 1
            })['key']
        }
        if (prop.format == 'int64') {
            return Mock.mock({
                'key|-9223372036854775808-9223372036854775807': 1
            })['key']
        }
    }
    if (prop.type == 'number') {
        if (prop.format == 'float' || prop.format == 'double') {
            return Mock.mock({
                'key|1-100.1-10': 1,
            })['key']
        }
        if (prop.format == 'double') {
            return Mock.mock({
                'key|1-100.1-10': 1,
            })['key']
        }
        return Mock.mock({
            'key|1-2147483647': 1
        })['key']
    }
    return "未匹配数据类型"
}

// 获取属性定义并解析prop
const getResDefinitions = function (originalRef, jsonObject) {
    const propertiesList = jsonObject.definitions[originalRef].properties
    let properties = {}
    for (let key in propertiesList) {
        properties[key] = parseProp(propertiesList[key], jsonObject)
    }
    return properties
}

// 解析prop
const parseProp = function (prop, jsonObject) {
    if (prop.originalRef) {
        return getResDefinitions(prop.originalRef, jsonObject)
    }
    if (prop.type == 'array') {
        return getResDefinitions(prop['items']['originalRef'], jsonObject)
    }
    return creatMock(prop)
}

// 创建返回数据
const creatResData = function (option) {
    return {
        code: option.success ? 200 : -999999,
        msg: option.success ? '' : option.msg,
        data: option.success && option.data ? option.data : null
    }
}

module.exports = async (ctx, next) => {
    const realRequestUrl = cleanEmptyInArray(ctx.request.url.split("?"))[0]
    const pathArr = cleanEmptyInArray(realRequestUrl.split("/"))
    const [modalName, projectName, ...projectApiPath] = pathArr

    if (modalName !== 'mock') {
        await next()
        return
    }

    const projectApiFilePath = path.resolve(__dirname, `../apiJson/${projectName}.json`);

    if (!fs.existsSync(projectApiFilePath)) {
        console.log('项目不存在')
        ctx.response.body = creatResData({
            success: false,
            msg: '项目不存在'
        })
        return
    }

    /**
     * 下面检测接口是否存在
     */
    let fileContent = fs.readFileSync(projectApiFilePath, 'utf-8');

    // 项目的全部接口
    const paths = JSON.parse(fileContent).paths

    // 传入的路由
    const routerPath = `/${projectApiPath.join("/")}`

    // 匹配接口是否存在
    let matchedPath = paths[routerPath] ? routerPath : ''
    // 如果没有直接匹配的接口，则检查restful接口
    if (!matchedPath) {
        matchedPath = matchRestfulUrl(routerPath, JSON.parse(fileContent)) || ''
    }
    // 接口真的不存在
    if (!matchedPath) {
        console.log('接口不存在')
        ctx.response.body = creatResData({
            success: false,
            msg: '接口不存在'
        })
        return
    }
    // 接口存在, 检查请求内容
    const checkData = checkRequest(ctx, paths[matchedPath])
    if (!checkData.valid) {
        console.log(checkData.msg)
        ctx.response.body = creatResData({
            success: false,
            msg: checkData.msg
        })
    } else {
        // 接口检查符合，开始处理返回的数据
        console.log('接口检查通过')
        const schema = checkData.data.responses['200'].schema
        const res = parseProp(schema, JSON.parse(fileContent))
        ctx.response.body = creatResData({
            success: true,
            data: res
        })
    }
}