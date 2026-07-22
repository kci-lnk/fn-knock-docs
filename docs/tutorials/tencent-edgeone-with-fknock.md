# 让腾讯云 EdgeOne 前置 fn-knock

EdgeOne 可以作为 fn-knock 前面的 DNS、TLS 和边缘入口。接入后，认证 Host 和业务 Host 仍应由 fn-knock 处理；边缘平台不能把动态登录页面缓存成静态内容，也不能丢失真实客户端 IP。

## 接入前确认

- fn-knock 的子域映射已经在本地或公网入口验证通过；
- 每个要公开的 Host 都有明确的上游目标和访问策略；
- EdgeOne 到源站的回源地址、端口和协议可达；
- 已准备可从移动网络访问的测试域名。

## 配置要点

1. 在 `子域映射 → 子域模式配置 → 边缘网络真实 IP 识别` 中选择 `腾讯 EdgeOne`。网关会读取 `EO-Connecting-IP`，把识别出的地址作为客户端 IP，并通过 `X-Forwarded-For` 传给认证服务。
2. 在 EdgeOne 添加域名并为认证 Host、业务 Host 配置回源到 fn-knock 网关入口。
3. 保持请求 Host、WebSocket 升级和 EdgeOne 真实客户端 IP 头能够传到源站。
4. 对认证、回调和动态业务路径设置绕过缓存；缓存策略应按应用逐项决定，不要一刀切缓存登录页面。
5. 在 EdgeOne 配置 HTTPS 后，从公网依次测试认证 Host、业务 Host 和 WebSocket / 长连接应用。

## 回源设置

认证 Host 与业务 Host 可以共用一个源站地址和端口，但回源请求必须保留访问者使用的 Host，fn-knock 才能命中对应映射。回源目标是网关入口，默认是 `7999`，不是管理入口 `7991`，也不是内部后端 `7998`。

根据 TLS 终止位置选择回源协议：

| 外部 TLS | EdgeOne 到 fn-knock | fn-knock 侧要求 |
| --- | --- | --- |
| EdgeOne 终止 HTTPS，HTTP 回源 | HTTP | 源站端口可达；前置层必须正确表达外部协议 |
| EdgeOne 终止 HTTPS，HTTPS 回源 | HTTPS | fn-knock 证书覆盖回源 Host，证书链受 EdgeOne 信任 |
| 全链路 HTTPS | HTTPS | 同时验证边缘证书和源站证书 |

认证页、认证 API、OIDC / QQ 回调、退出、会话状态和设置 Cookie 的响应都应绕过缓存。业务应用是否能缓存，应依据其自身响应头和登录机制决定；不能只按文件扩展名假设请求是静态内容。

## 保护真实 IP 头

选择 EdgeOne 提供商后，网关会信任 `EO-Connecting-IP` 的语义。如果源站端口仍允许任意公网客户端直连，攻击者可能绕过 EdgeOne 并自行构造该请求头。应使用防火墙、源站访问控制或不可公开路由的回源链路，让网关入口只接受 EdgeOne 回源和必要的运维探测。

切换前可暂时保留一个仅管理员可用的直连测试 Host，但不要让它与正式业务共用宽泛的公网放行规则。验证完成后移除回退 DNS 或限制其来源。

## 验证重点

使用移动网络和另一条外部网络分别访问，避免只测试同一个出口 IP：

1. 打开认证 Host，确认未登录时能看到认证页。
2. 登录后访问业务 Host，确认返回原目标且不循环跳转。
3. 打开 `请求日志`，确认 `客户端 IP` 是访问者地址，`连接来源 IP` 可以是 EdgeOne 节点地址，并能看到 `EO-Connecting-IP`。
4. 确认 Host、认证结果、上游 Target 和响应状态与当前请求一致。
5. 测试 WebSocket、文件上传下载和退出；退出后重新访问需要登录的 Host。
6. 从不经过 EdgeOne 的地址尝试直连源站，确认被网络层拒绝。

出现登录循环、页面资源异常或来源地判断错误时，依次检查缓存、Cookie 域、回源 Host、外部协议和真实 IP 头。若请求完全没有进入 fn-knock 日志，问题位于 DNS、EdgeOne 回源或源站网络层；日志已有请求但返回 `502`，再检查 fn-knock 到业务 Target 的链路。

## 回退

变更前记录原 DNS、源站地址、端口、协议和缓存规则。需要回退时，先恢复原 DNS 或停用加速域名，再把 fn-knock 的边缘真实 IP 提供商改回与实际入口一致的选项。DNS 尚未完全生效期间，两条链路可能同时收到请求，应避免一条链路提供过期认证内容。

EdgeOne 的产品界面、套餐和回源选项会变化，边缘侧操作以 [EdgeOne 官方文档](https://cloud.tencent.com/document/product/1552) 为准。

- [安全边界与基线](/guide/security)
- [请求日志](/guide/request-logs)
- [子域映射](/guide/subdomain-proxy)
