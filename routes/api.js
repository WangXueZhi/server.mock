const router = require('koa-router')()

router.prefix('/api')

router.get('*', async (ctx, next) => {
    
})

module.exports = router