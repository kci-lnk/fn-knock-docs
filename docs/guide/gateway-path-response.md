# 路径响应

`系统设置 → 网关 → 路径响应` 为某个业务 Host 增加少量路径级规则。它仅在 Host 路由的子域模式中可编辑，包括公网直达 `子域模式` 与 `内网穿透 → 子域映射`；路径模式和直连模式不提供此项。Host 仍是主路由；未命中路径规则时，请求回到该 Host 映射的默认 Target。

它适合健康检查、固定状态响应，或把同一 Host 下的一小段 API 转到另一个上游。若要用大量路径组织不同应用，应使用兼容用的 [路径映射](/guide/reverse-proxy)，不要在 Host 路由上重建一套路径网关。

## 匹配顺序

```text
api.example.com/healthz -> 固定响应 200 ok
api.example.com/v2/*    -> http://127.0.0.1:8080
api.example.com/其他路径 -> Host 默认 Target
```

先选择已有的业务 Host。鉴权服务 Host 不会出现在可选列表中。

路径必须以 `/` 开头，但不能是根路径 `/`。以下路径由认证、分享或内部能力保留，不能配置：

- 以 `/__` 开头的路径
- `/s`
- `/s/`

每个 Host 下，同一匹配方式与同一路径只能存在一条规则。

## 规则字段

| 字段 | 取值 | 行为 |
| --- | --- | --- |
| `匹配方式` | 精确 / 前缀 | 只匹配完整路径，或匹配该前缀及子路径 |
| `动作` | 反代 / 固定响应 | 转给另一个上游，或由网关直接响应 |
| `目标地址` | HTTP / HTTPS URL | 仅反代动作使用 |
| `剥离匹配路径` | 开 / 关 | `/api/users` 发送为 `/users`，或保留原路径 |
| `改写 HTML 路径` | 开 / 关 | 为页面资源补路径前缀；纯 API 通常不需要 |

固定响应可设置 `100` 到 `599` 的状态码、`Content-Type`、正文和自定义响应头。`Connection`、`Content-Length`、`Content-Type`、`Transfer-Encoding`、`Upgrade` 等传输级头不能在自定义头中覆盖；内容类型使用专门字段设置。

## 继承 Host 的访问策略

路径响应继承当前 Host 的 `要求登录` 和已有严格白名单规则，不是绕过访问控制的入口。

反代动作会把 Host 的 `Basic Auth 跳过` 凭据注入发往其实际 Target 的请求，用来通过目标服务自己的 Basic Auth；它不是 fn-knock 访客登录凭据。代理头与 Host 保留则按这个实际 Target 的共享运行时规则决定，可能与 Host 默认 Target 的设置不同。固定响应没有上游，因此不发送 Basic Auth、代理头或 Host 保留相关请求头。

来源为回环、私网或链路本地地址时，认证服务会返回 `local_exempt`。因此局域网访问可能不触发登录或严格白名单拒绝，公网策略必须从真实外部网络验证。

## 示例

健康检查：

```text
路径       /healthz
匹配       精确
动作       固定响应
状态码     200
Content-Type text/plain; charset=utf-8
正文       ok
```

API 单独回源：

```text
路径       /api
匹配       前缀
动作       反代
目标       http://127.0.0.1:8080
剥离路径   开
```

## 平台边界

路径响应可在飞牛 FPK、Docker、OpenWrt、Linux、群晖 DSM 7 SPK 和 Windows 的 Host 路由子域模式中使用，包括 `内网穿透 → 子域映射`。它不会开放防火墙端口、创建 DNS 记录或发布 Docker 端口，也不会让不可达的 Target 变得可达。

## 排错

1. 确认当前使用 Host 路由，并选中了正确业务 Host。
2. 检查路径格式、保留路径和精确 / 前缀匹配方式。
3. 先判断请求是否被 Host 的登录或白名单策略拦截。
4. 从 fn-knock 运行环境访问反代 Target。
5. 在 [请求日志](/guide/request-logs) 中核对 Host、路径、路由类型、状态码和上游目标。

Host 主路由见 [子域映射](/guide/subdomain-proxy)，相关全局选项见 [系统设置](/guide/system)。
