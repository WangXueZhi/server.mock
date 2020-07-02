const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const koaBody = require('koa-body')
const logger = require('koa-logger')
const mockMiddleware = require('./middleware/mock')
const viewsRoute = require('./routes/views')
const apiRoute = require('./routes/api')
const path = require('path')
const fs = require('fs')

// error handler
onerror(app)

// middlewares
app.use(koaBody({
  multipart: true
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))
app.use(require('koa-less')(__dirname + '/public'))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
})

// // 日志记录
// const ENV = process.env.NODE_ENV
// if (ENV !== 'production') {
//   // 开发环境 / 测试环境
//   app.use(morgan('dev'));
// } else {
//   // 线上环境
//   const logFileName = path.join(__dirname, 'logs', 'access.log')
//   const writeStream = fs.createWriteStream(logFileName, {
//     flags: 'a'
//   })
//   app.use(morgan('combined', {
//     stream: writeStream
//   }));
// }

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

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

app.use(mockMiddleware)
app.use(viewsRoute.routes(), viewsRoute.allowedMethods())
app.use(apiRoute.routes(), apiRoute.allowedMethods())

// 初始化永久存储目录
const os = require('os')
const initMockServer = function(){
    const homedir = os.homedir()
    const mockserverPath = path.resolve(homedir, `./.rayx-mockserver/`)
    if (!fs.existsSync(mockserverPath)) {
        fs.mkdirSync(mockserverPath)
    }
    const databasePath = path.resolve(homedir, `./.rayx-mockserver/database/`)
    if (!fs.existsSync(databasePath)) {
        fs.mkdirSync(databasePath)
        fs.openSync(path.resolve(databasePath, `./projectList.json`), 'w')
        fs.writeFileSync(path.resolve(databasePath, `./projectList.json`), JSON.stringify([]))
    }
    const apiJsonPath = path.resolve(homedir, `./.rayx-mockserver/apiJson/`)
    if (!fs.existsSync(apiJsonPath)) {
        fs.mkdirSync(apiJsonPath)
    }
    global.__mockserverPath = mockserverPath
}
initMockServer()

module.exports = app