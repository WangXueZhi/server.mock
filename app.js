const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const koaBody = require('koa-body')
const logger = require('koa-logger')
const morgan = require('koa-morgan')
const session = require('koa-generic-session')
const redisStore = require('koa-redis')
const path = require('path')
const fs = require('fs')

// const { REDIS_CONF } = require('./conf/db')

// error handler
onerror(app)

// middlewares
app.use(koaBody({
  multipart: true
}))
app.use(json())
app.use(logger())
// app.use(require('koa-static')(__dirname + '/public'))

// app.use(views(__dirname + '/views', {
//   extension: 'pug'
// }))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// 日志记录
const ENV = process.env.NODE_ENV
if (ENV !== 'production') {
  // 开发环境 / 测试环境
  app.use(morgan('dev'));
} else {
  // 线上环境
  const logFileName = path.join(__dirname, 'logs', 'access.log')
  const writeStream = fs.createWriteStream(logFileName, {
    flags: 'a'
  })
  app.use(morgan('combined', {
    stream: writeStream
  }));
}

// session 配置
// app.keys = ['WJiol#23123_']
// app.use(session({
//   // 配置 cookie
//   cookie: {
//     path: '/',
//     httpOnly: true,
//     maxAge: 24 * 60 * 60 * 1000
//   },
//   // 配置 redis
//   store: redisStore({
//     // all: '127.0.0.1:6379'   // 写死本地的 redis
//     all: `${REDIS_CONF.host}:${REDIS_CONF.port}`
//   })
// }))

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

const checkRequest = function (ctx, requestInfo) {
  

  const method = ctx.request.method.toLowerCase()

  const checkInfo = {
    valid: false,
    msg: ''
  }

  const requestData = requestInfo[method]

  if (!requestData) {
    checkInfo.msg = '方法不匹配'
    return checkInfo
  }
  console.log(ctx.request.body)
  if (requestData.consumes[0]!==ctx.request.header['content-type']) {
    checkInfo.msg = 'content-type不匹配'
    return checkInfo
  }  

  checkInfo.valid = true
  return checkInfo
}

app.use(async (ctx, next) => {
  const {
    cleanEmptyInArray
  } = require('./utils/array')

  const pathArr = cleanEmptyInArray(ctx.request.url.split("/"))
  const [projectName, ...projectApiPath] = pathArr
  const projectApiFilePath = path.resolve(__dirname, `./apiJson/${projectName}.json`);

  // 项目和接口是否存在
  if (fs.existsSync(projectApiFilePath)) {
    console.log('项目存在')
    let fileContent = fs.readFileSync(projectApiFilePath, 'utf-8');

    // 项目的全部接口
    const paths = JSON.parse(fileContent).paths

    // 传入的路由
    const path = `/${projectApiPath.join("/")}`
    if (paths[path]) {
      console.log('接口存在')
      const checkData = checkRequest(ctx, paths[path])
      if(!checkData.valid){
        console.log(checkData.msg)
      }
    } else {
      console.log('接口不存在')
    }
  } else {
    console.log('不存在')
  }
  console.log(ctx.request.method)
  await next()
})

module.exports = app