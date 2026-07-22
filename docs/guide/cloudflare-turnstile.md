# Cloudflare Turnstile

Turnstile 是 fn-knock 登录页可选的人机验证方式。它只验证登录前的浏览器请求，不是反向代理、CDN 或 WAF 的替代品。

## 配置步骤

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，创建一个 Turnstile widget。
2. Widget 类型可保持普通可见模式。在 hostname 列表中加入访问登录页的域名；不要填协议、路径或端口。
3. 复制 widget 的 `Site key` 和 `Secret key`。
4. 打开 fn-knock 的 `系统设置 → Challenge`，选择 `Turnstile`，填入两项 key 并保存。
5. 使用真实公网网络打开认证 Host，完成一次登录测试。

认证 Host 例如为 `auth.example.com` 时，Cloudflare 中应登记 `auth.example.com`。如果访问入口经过 CDN 或隧道，填写最终用户在浏览器中看到的域名，而不是 `localhost`、容器名或网关内网地址。

`Site key` 会发送给浏览器；`Secret key` 只在服务端调用 Cloudflare Siteverify 接口时使用。不要把 Secret key 写入前端代码、公开 issue 或排障截图。

fn-knock 会把识别到的客户端 IP 一并交给 Turnstile 校验。前面存在 CDN 或反向代理时，应先确认请求日志中的客户端 IP 正确。

## 常见失败

| 现象 | 优先检查 |
| --- | --- |
| 控件不显示 | widget hostname、浏览器能否访问 Cloudflare、登录页是否加载了新配置 |
| 提示配置未完成 | 两项 key 是否都已保存，登录页是否仍使用旧配置 |
| 控件通过后仍失败 | `Secret key` 是否对应同一 widget、Cloudflare Siteverify 连通性、服务器时间、域名和代理链路 |
| 提示 token 为空或响应无效 | 浏览器是否提交了控件结果，反向代理是否改写请求体 |
| 局域网看起来未生效 | 私网来源可能触发本地豁免；用移动网络验证 |
| 只用 IP 地址访问 | hostname 校验和 HTTPS 上下文通常不适合 Turnstile；改用域名 |

Cloudflare 校验服务不可达时，fn-knock 会拒绝本次认证而不是跳过人机验证。对 Cloudflare 连通性不稳定的网络，可切回不依赖第三方的 PoW。

Cloudflare 的 widget 类型和后台界面会变化，具体选项以 [Turnstile 官方文档](https://developers.cloudflare.com/turnstile/get-started/) 为准。

- [登录前的人机验证](/guide/captcha)
- [认证、会话与服务范围](/guide/auth)
