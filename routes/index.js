const router = require('koa-router')();
const {
    SuccessModel,
    ErrorModel
} = require('../model/resModel')

router.get('/', async (ctx, next) => {
    ctx.body = "123"
})

module.exports = router