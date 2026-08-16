# 网关内置页面

内置页面不需要配置映射。任意已解析并转发到 fn-knock 网关的子域，都可以直接加上内置路径访问：

```text
https://nas.example.com/__select__
https://nas.example.com/__wol__
```

路径必须完全一致，`/__select__/` 和 `/__wol__/` 不是内置页面。这里的子域需要实际指向网关入口，且证书、CDN、反代或隧道能正常处理该域名和 `Host`。

## 应用选择页：`/__select__`

打开 `https://任意已接入网关的子域/__select__`，即可进入应用选择页。未登录时会先跳转登录；登录后只显示当前凭据可访问的服务。

![应用选择页](/images/gateway-built-in-pages/service-selection.webp)

使用自定义服务范围时，需要在 `认证配置 → 权限` 勾选“内置选择页”。打开此页不会获得未授权服务的访问权限。

## 网络唤醒页：`/__wol__`

打开 `https://任意已接入网关的子域/__wol__`，可查看已启用设备并发送唤醒请求。

![网络唤醒页](/images/gateway-built-in-pages/wake-on-lan-mobile.png)

需要同时满足以下条件：

1. 已在 `系统设置 → 功能 → 远程唤醒` 开启 WOL。
2. 已在 `系统设置 → 网关 → 传送门` 开启“显示远程唤醒快捷入口”。
3. 已登录；自定义服务范围还需勾选“内置远程唤醒页面”。

关闭 WOL 快捷入口后，`/__wol__` 会返回未找到页面，不会转发到上游服务。

## 登录回退：`/__auth__/…`

`/__auth__` 不是所有子域都会自动使用的登录入口。

| 情况 | 登录地址 |
| --- | --- |
| 业务子域位于已配置根域下，能共享 Cookie | 跳转到统一认证 Host，例如 `auth.example.com` |
| 业务子域不在根域 Cookie 范围内，无法共享登录态 | 跳转到该子域自己的 `/__auth__/login` |

例如根域为 `example.com`，认证 Host 为 `auth.example.com`：`nas.example.com` 使用统一登录；`nas.other-example.net` 会通过以下地址单独完成登录：

```text
https://nas.other-example.net/__auth__/login
```

这种登录会话只属于当前子域，不能与 `example.com` 下的服务共享。`/__auth__/…` 下还有退出登录、OIDC 回调等认证接口，不应作为公开 API 使用。

- [网关传送门](/guide/gateway-portal)
- [远程唤醒](/guide/wake-on-lan)
- [会话、IP 授权与 IP 漂移](/guide/session-management)
