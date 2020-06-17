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
const mockMiddleware = require('./middleware/mock')
const viewsMiddleware = require('./middleware/views')

// error handler
onerror(app)

// middlewares
app.use(koaBody({
  multipart: true
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

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

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
});

app.use(mockMiddleware)

app.use(viewsMiddleware)

module.exports = app