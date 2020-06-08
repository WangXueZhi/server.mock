const router = require('koa-router')()
const { SuccessModel, ErrorModel } = require('../model/resModel')

const {
  newPublish,
  getBranchList,
  stopPublish,
  publishList,
  publishDetail,
  rePublish
} = require('../controller/publish')

router.prefix('/publish')

// 新建发布
router.post('/new', async (ctx, next) => {
  if (!ctx.request.body["pid"]) {
    ctx.body = new ErrorModel(null, "项目id不能为空");
    return;
  }

  ctx.body = await newPublish(ctx.request.body);
})

// 重新发布
router.post('/rePublish', async (ctx, next) => {
  if (!ctx.request.body["publishId"]) {
    ctx.body = new ErrorModel(null, "发布id不能为空");
    return;
  }

  ctx.body = await rePublish(ctx.request.body["publishId"]);
})

// 停止发布
router.post('/stop', async (ctx, next) => {
  if (!ctx.request.body["id"]) {
    ctx.body = new ErrorModel(null, "发布id不能为空");
    return;
  }

  ctx.body = await stopPublish(ctx.request.body["id"]);
})

// 某条发布详情
router.post('/detail', async (ctx, next) => {
  if (!ctx.request.body["id"]) {
    ctx.body = new ErrorModel(null, "发布id不能为空");
    return;
  }

  ctx.body = await publishDetail(ctx.request.body["id"]);
})

// 发布记录
router.get('/list', async (ctx, next) => {
  ctx.body = await publishList();
})

// 分支列表
router.get('/branch/list', async (ctx, next) => {
  const id = ctx.query.id;
  if (!id) {
    ctx.body = new ErrorModel(null, "项目id不能为空");
    return;
  }
  ctx.body = await getBranchList(id)
})

module.exports = router
