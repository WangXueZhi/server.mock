const router = require('koa-router')()
const fs = require('fs')
const path = require('path')
router.prefix('/view')

router.get('/', async (ctx, next) => {
    const files = fs.readdirSync(path.resolve(__dirname, `../apiJson`))
    const projectList = []
    files.forEach(item=>{
        projectList.push({
            name: item.replace('.json',''),
            describe: item.replace('.json','')
        })
    })
    console.log(files)
    await ctx.render('index', {
        title: '项目列表',
        list: projectList
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