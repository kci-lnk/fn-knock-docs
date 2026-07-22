# 让阿里云 ESA 前置 fn-knock

阿里云 ESA 可放在 fn-knock 前面承担 DNS、TLS 和边缘分发。源站仍然是 fn-knock 网关；认证、会话、Host 路由和访问策略不应在 ESA 配置中被绕过。

## 接入前确认

- 子域映射已在不经过 ESA 的链路中验证通过；
- 每个认证和业务 Host 的 DNS、证书与上游目标已明确；
- ESA 能回源到 fn-knock 暴露的地址、端口和协议；
- 已保留绕过 ESA 的管理或回退路径。

## 配置要点

1. 在 `子域映射 → 子域模式配置 → 边缘网络真实 IP 识别` 中选择 `阿里云 ESA`。网关会读取 `Ali-Real-Client-IP`，并把识别出的地址通过 `X-Forwarded-For` 传给认证服务；ESA 侧需要开启托管转换请求头。
2. 在 ESA 添加站点，将认证 Host 和业务 Host 回源到 fn-knock 网关。
3. 保持 Host、WebSocket 和真实客户端 IP 头透传到源站。
4. 为认证、回调、API 和其他动态路径配置绕过缓存；缓存静态资源前先确认不会破坏 Cookie 或鉴权。
5. 用真实外网依次测试登录、业务页面、文件下载与长连接。

## 回源设置

ESA 的源站应填写 fn-knock 网关可达的地址，端口使用实际网关端口，默认 `7999`。不要回源到管理入口 `7991` 或内部后端端口。认证 Host 与业务 Host 可以使用同一源站，但必须把原始 Host 传给 fn-knock。

如果 ESA 使用 HTTPS 回源，fn-knock 侧证书需要覆盖回源 Host，并且证书链能通过平台校验。若使用 HTTP 回源，公网到 ESA 的协议仍是 HTTPS 时，应确认前置层传入的协议信息没有导致应用生成 `http://` 回调或 Cookie。

以下内容应按动态请求处理：

- 认证页和认证 API；
- OIDC、QQ 等外部登录回调；
- 退出、会话状态、Passkey 与设置 Cookie 的响应；
- 业务应用自身的登录、上传、下载签名和 WebSocket 握手。

静态资源可以在确认响应不因 Cookie、用户或权限变化后再缓存。不要缓存 `Set-Cookie` 响应，也不要让不同用户共享包含私有数据的缓存对象。

## 真实 IP 的信任边界

选择 ESA 提供商后，`Ali-Real-Client-IP` 会参与客户端地址判定。若攻击者能绕过 ESA 直连源站，就可能自行构造同名头。应在防火墙、云安全组或源站访问控制中只允许 ESA 回源节点和必要的运维来源访问网关入口。

管理入口不应经过公开 ESA 站点。需要远程管理时，使用 VPN、受限反向代理或其他独立管理链路。

## 排查

从移动网络执行完整链路测试：

1. 未登录访问业务 Host，确认进入认证流程。
2. 完成登录并返回业务 Host。
3. 在请求日志中确认 `客户端 IP` 是访问者地址，`连接来源 IP` 可以是 ESA 节点，并能看到 `Ali-Real-Client-IP`。
4. 检查请求 Host、认证结果、上游 Target 和响应状态。
5. 测试退出、外部登录回调、WebSocket 和文件传输。
6. 尝试绕过 ESA 直连源站，确认网络层拒绝。

若出现登录循环、资源加载异常或地区规则误判，先检查 ESA 缓存规则、回源 Host、外部协议、Cookie 域和客户端 IP 头，再修改 fn-knock 映射。请求未出现在 fn-knock 日志中时，排查 DNS、ESA 回源健康和源站网络；日志显示 `502` 时，排查 fn-knock 到业务 Target。

## 回退

变更前保存原 DNS、回源协议、端口、证书和缓存策略。需要回退时，先恢复原入口或停用 ESA 代理，再把 fn-knock 的边缘真实 IP 提供商改成与当前链路一致的选项。DNS 传播期间避免让旧、新入口使用不同的 Cookie 域或缓存规则。

ESA 控制台与套餐能力会变动，边缘侧操作以 [ESA 官方文档](https://help.aliyun.com/zh/edge-security-acceleration/esa/) 为准。

- [安全边界与基线](/guide/security)
- [请求日志](/guide/request-logs)
- [子域映射](/guide/subdomain-proxy)
