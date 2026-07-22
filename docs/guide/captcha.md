# 登录前的人机验证

人机验证位于登录流程最前面，用于减少自动化请求直接进入认证接口。它不代替登录凭据、IP 白名单或 WAF。

在 `系统设置 → Challenge` 选择验证方式并保存。新的登录页会使用新设置；已有会话不会因此失效。

## 可选方式

| 方式 | 特点 | 适合场景 |
| --- | --- | --- |
| `PoW` | 浏览器完成一次工作量证明，不依赖第三方站点 | 希望减少外部依赖，且可接受少量客户端计算 |
| Cloudflare Turnstile | 由 Cloudflare 执行验证 | 已使用 Cloudflare，且希望使用其托管的人机验证 |

PoW 是默认内置方案。浏览器取得 SHA-256 挑战后在本地计算 proof；挑战有效期为 5 分钟，只能成功使用一次。页面没有难度调节项，服务端当前给出的最大搜索范围为 100000。

选择 Turnstile 前必须先在 Cloudflare 创建 widget，并把 `site key` 与 `secret key` 填回 fn-knock。详细步骤见 [Cloudflare Turnstile](/guide/cloudflare-turnstile)。

## 切换和保存

在 `系统设置 → Challenge` 选择 PoW 或 Cloudflare Turnstile。选择 Turnstile 时，站点密钥和密钥必须同时填写，否则前端和后端都会拒绝保存。

站点密钥会下发到公开登录页用于渲染控件；密钥只保存在服务端并用于向 Cloudflare 校验 token。切换回 PoW 后，已有 Turnstile 参数仍保留在配置中，之后重新选择时可继续使用。

修改供应商不会销毁已登录会话，只影响之后进入认证流程的新请求。已经打开的登录页可能仍持有旧挑战，应刷新页面后再测试。

## 验证方式的边界

- 验证只保护会经过 fn-knock 登录页的流量。
- 私网和本地来源默认有本地豁免，不能用局域网结果判断公网验证是否正常。
- Turnstile 需要浏览器能够访问 Cloudflare 的验证资源；受限网络或拦截规则可能导致控件不显示或验证失败。
- 修改验证方式后，请用无痕窗口和移动网络完成一次完整登录。

## 排查

1. 确认已保存设置，并重新打开登录页。
2. PoW 提示过期或已使用时，刷新页面取得新挑战；系统时间错误也会导致有效期判断异常。
3. Turnstile 场景检查 `site key`、`secret key`、widget 的 hostname 与真实登录域名是否一致。
4. 检查登录域名是否已正确解析并使用 HTTPS。
5. 查看浏览器控制台、请求日志和事件中心中的错误信息。

- [认证、会话与服务范围](/guide/auth)
- [Cloudflare Turnstile](/guide/cloudflare-turnstile)
