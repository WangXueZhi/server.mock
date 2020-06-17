const {
    cleanEmptyInArray
} = require('../utils/array')

module.exports = async (ctx, next) => {
    const realRequestUrl = cleanEmptyInArray(ctx.request.url.split("?"))[0]
    const pathArr = cleanEmptyInArray(realRequestUrl.split("/"))
    const [modalName, projectName, ...projectApiPath] = pathArr

    if (modalName !== 'views') {
        await next()
        return
    }

    await ctx.render('index', {
        title: '123'
    });
    await next()
}