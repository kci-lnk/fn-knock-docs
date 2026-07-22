# Cloudflare DDNS

Cloudflare DDNS 使用 API Token 更新指定 Zone 中的 DNS 记录。Token 可以修改记录，应只授予目标 Zone 的最小 DNS 权限，并像密码一样保存。

## 创建 Token

1. 在 Cloudflare 的 API Tokens 页面创建 Token，选择或基于“Edit zone DNS”模板创建。
2. 将权限范围限制为目标 Zone；不要使用全局 API Key。
3. 需要时使用 Cloudflare 提供的 token 验证命令确认 Token 状态。
4. 将 Token 仅填入 fn-knock 的 DDNS 凭据，不要写进截图、日志或公开配置文件。

Cloudflare 的 Token 页面与权限名称会调整，以 [官方 Token 文档](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) 为准。

## 在 fn-knock 中填写

在 `动态域名` 选择 Cloudflare，填写：

| 字段 | 说明 |
| --- | --- |
| `API Token` | 具有目标 Zone DNS 编辑权限的 Token |
| `Zone ID` | Cloudflare Zone 概览中显示的 ID，不是 Zone 名称 |
| `域名` | 要维护的完整 DNS 名称；支持单个名称，或根域与通配域配对 |
| `Proxied` | `DNS only` 或 `Orange cloud` |

域名填写 `auth.example.com` 这样的 DNS 名称，不带 `https://`、路径或端口。配置根域与通配域配对时，例如 `example.com` 和 `*.example.com`，fn-knock 会分别更新两条记录，并先通过 Cloudflare API 确认根域属于所填 Zone ID。

按实际网络选择 IPv4、IPv6 或双栈。保存后先在页面执行测试，再到 Cloudflare DNS 列表确认记录类型、名称和地址。

更新时，fn-knock 会按域名和记录类型查找现有记录：

- IPv4 对应 `A`；
- IPv6 对应 `AAAA`；
- 找到记录时更新，找不到时创建；
- TTL 使用 Cloudflare 自动值；
- 双栈的 A 与 AAAA 分别执行，任一失败都会出现在日志中。

Zone ID、Token 或域名不匹配时，测试会在实际改写记录前报错。不要用同一个 Zone ID 更新另一个根域。

## 代理状态

Cloudflare 的“已代理”状态会改变访问链路。网关使用非标准端口或需要直接回源时，通常应先使用仅 DNS 解析；是否可代理取决于 Cloudflare 支持的端口、SSL 模式和当前服务类型。不要把“橙云”当作 DDNS 的必需配置。

选择橙云后，外部 DNS 查询返回 Cloudflare 边缘地址，而不是家庭公网 IP；这是正常行为。此时真实客户端 IP、Cloudflare SSL 模式、回源端口和缓存规则都需单独配置。只想用 Cloudflare 托管动态 DNS 时选择 `DNS only` 更容易排障。

## 测试失败

| 错误方向 | 检查项 |
| --- | --- |
| Zone 查询失败 | Token 是否有效、Zone ID 是否正确、服务器能否访问 Cloudflare API |
| Zone 不匹配 | 域名根是否确实属于该 Zone，是否误填了另一个账户或 Zone 的 ID |
| 查找记录失败 | Token 是否具备 Zone DNS Read/Edit，Cloudflare API 是否限流 |
| 创建或更新失败 | 记录类型冲突、同名 CNAME、代理状态限制和 API 返回详情 |

DDNS 更新成功后仍需验证：域名能解析、外网能到达入口、TLS 证书匹配、请求最终由 fn-knock 处理。Cloudflare 提供了 [动态 DNS 参考](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/)。

- [DDNS 管理](/guide/ddns)
- [证书与 HTTPS](/guide/ssl)
