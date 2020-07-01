const router = require('koa-router')()
const fs = require('fs')
const path = require('path')
router.prefix('/view')

router.get('/', async (ctx, next) => {
    console.log(ctx)
    await ctx.render('index', {
        title: '项目列表',
        serverPort: ctx.request.header.host.split(':')[1]
    });
})

router.get('/error', async (ctx, next) => {
    await ctx.render('error', {
        message: 'message',
        title: '123',
        error: {
            status: -1,
            stack: 'haha'
        }
    });
})

module.exports = router