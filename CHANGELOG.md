# 0.0.6
1. swagger3支持，因为找不到swagger3详细的配置文档，所以mock数据会直接返回json文件中的res_body

# 0.0.5
1. 修复和优化：解析res数据时的bug和逻辑

# 0.0.4
1. 解决永久存储问题，数据会保存在用户目录下的`.rayx-mockserver`目录内
2. 修复没有consumes导致检查报错，现在没有consumes会忽略检查`Content-Type`


