const router = require('koa-router')()
const viewsMiddleware = require('../middleware/views')
const {
    cleanEmptyInArray
} = require('../utils/array')

router.prefix('/views')

router.get('*', async (ctx, next) => {
    await viewsMiddleware(ctx, next)
})

module.exports = router