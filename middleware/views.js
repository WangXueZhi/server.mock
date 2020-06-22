const {
    cleanEmptyInArray
} = require('../utils/array')

module.exports = async (ctx, next) => {
    const realRequestUrl = cleanEmptyInArray(ctx.request.url.split("?"))[0]
    const pathArr = cleanEmptyInArray(realRequestUrl.split("/"))
    if (pathArr[0] !== 'views') {
        await next()
        return
    }
    console.log(ctx.render)
    await ctx.render('index', {
        title: '123'
    });
    await next()
}