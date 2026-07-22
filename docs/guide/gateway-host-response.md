# 向上游保留 Host

反向代理默认把访问者请求中的 `Host` 保留给上游。例如访问 `https://nas.example.com` 时，上游仍看到 `Host: nas.example.com`。应用可据此生成外部链接、设置 Cookie 域、选择虚拟站点或校验回调地址。

`系统设置 → 网关 → Host 响应` 只在 Host 路由的子域模式中可编辑，包括公网直达的子域模式和 `内网穿透 → 子域映射`。路径模式与直连模式不提供此项，认证服务 Host 也不会列入编辑对象。

## 什么时候关闭

保持默认开启，除非上游明确要求自身地址作为 Host。常见例子是：

- 上游 Web 服务器只配置了内部虚拟主机名；
- 应用校验 Host 白名单，但暂时无法加入外部域名；
- 旧应用收到外部 Host 后返回 `400`、错误跳转或错误站点。

关闭后，网关不再强制保留外部 Host，上游会按反代目标地址处理 Host。这样可能修复上游的 Host 校验，也可能让应用生成 `127.0.0.1`、容器服务名或内网域名链接。修改后必须检查登录跳转、绝对链接、Cookie 和 WebSocket。

## 按 Target 生效

页面按 Host 显示开关，网关运行态按上游 Target 编译。以下两个 Host 共用同一 Target：

```text
photos.example.com -> http://127.0.0.1:8080
files.example.com  -> http://127.0.0.1:8080
```

关闭其中一个 Host 的保留行为会影响这个共享 Target。需要不同策略时，为两个 Host 配置不同的 Target 地址；即使它们最终到达同一应用，也可通过不同监听地址、端口或反代层区分。

路径响应中的反代动作按它自己的实际 Target 使用同一套运行时规则。固定响应没有上游，不涉及 Host 保留。

## 验证与排错

1. 修改后等待页面提示已保存并同步。
2. 从真实业务域名访问，检查状态码、重定向地址和登录流程。
3. 在请求日志确认命中的 Host、路由类型与上游 Target。
4. 在上游访问日志记录收到的 Host，确认符合应用预期。
5. 若多个 Host 同时变化，检查它们是否复用了相同 Target。

Host 保留不决定 fn-knock 如何识别客户端 IP，也不会修改 TLS 证书或 DNS。客户端来源使用代理头传递，见[向上游传递代理头](/guide/gateway-proxy-headers)。

- [子域映射](/guide/subdomain-proxy)
- [路径响应](/guide/gateway-path-response)
- [请求日志](/guide/request-logs)
