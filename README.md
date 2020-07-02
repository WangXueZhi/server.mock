# rayx-mockserver
一键mock，帮助前端团队快速搭建mock服务，上传由swagger导出的json文件即可使用

## 能干什么
1. 在后端开发完成接口之前，前端可以使用假数据进行界面模拟
2. 支持多项目
3. 支持接口数据源覆盖
4. 支持接口检查包括：路径，入参，content-type，在开发阶段尽量减少前端业务的基本错误

## 安装
```
npm i rayx-mockserver -g
```

## 启动服务
```
rayx-mockserver --p=[port]
```
默认端口3000，port为自定义端口

## 路由说明
1. mock服务, 匹配路由 /mock/...
2. 用户界面开，匹配路由 /view/...
3. api接口，匹配路由 /api/...

## example
假设启动服务为`http://127.0.0.1:3000`, 某个接口为`user/info`,那么请求mock数据的url应该是`http://127.0.0.1:3000/mock/user/info`

## 使用

1. 添加项目





