const router = require('koa-router')();
const { SuccessModel, ErrorModel } = require('../model/resModel')

const {
  newProject,
  updateProject,
  getList,
  getDetail,
  delProject
} = require('../controller/project')

router.prefix('/projects')

router.post('/new', async (ctx, next) => {
  // 校验项目名称
  if (!ctx.request.body["pName"]) {
    ctx.body = new ErrorModel(null, "项目名不能为空");
    return;
  }
  ctx.body = await newProject(ctx.request.body);
})

router.post('/update', async (ctx, next) => {
  if (!ctx.request.body["id"]) {
    ctx.body = new ErrorModel(null, "项目id不能为空");
    return;
  }
  ctx.body = await updateProject(ctx.request.body);
})

router.get('/list', async (ctx, next) => {
  const keywords = ctx.query.keywords;
  ctx.body = await getList(keywords);
})

router.get('/detail', async (ctx, next) => {
  const id = ctx.query.id;
  if (!id) {
    ctx.body = new ErrorModel(null, "项目id不能为空");
    return;
  }
  ctx.body = await getDetail(id);
})

router.post('/delete', async (ctx, next) => {
  if (!ctx.request.body["id"]) {
    ctx.body = new ErrorModel(null, "项目id不能为空");
    return;
  }
  ctx.body = await delProject(ctx.request.body["id"]);
})

module.exports = router
