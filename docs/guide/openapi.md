# OpenAPI：开放管理 API 与 AI Agent

fn-knock 的 Rust 管理后端提供 OpenAPI 3.1 文档，可用于查看管理接口、生成客户端代码或接入自动化工具。本文以管理后端监听 `127.0.0.1:7998`、对外使用 `knock.example.com:7999` 为例，通过 fn-knock 自身的协议映射访问文档。

管理 API 可以修改映射、证书、DDNS、WAF 和其他系统配置。不要把它当作普通公开网页直接暴露；应启用协议映射鉴权，并配合固定来源 IP、VPN 或其他网络访问限制。

## 文档入口

| 地址 | 内容 |
| --- | --- |
| `http://127.0.0.1:7998/docs` | Swagger UI 交互式文档 |
| `http://127.0.0.1:7998/docs/json` | OpenAPI 3.1 JSON |
| `http://knock.example.com:7999/docs` | 完成下文映射后的外部文档入口 |

示例假定当前实例的管理后端端口是 `7998`。OpenWrt 默认使用 `17998`；自定义过端口时，以实际部署配置为准。先在 fn-knock 所在设备上打开本地 `/docs`，确认后端端口和文档可用，再建立对外映射。

## 用协议映射开放文档

协议映射按 TCP / UDP 和端口转发，不按域名分流。`knock.example.com` 只需解析到 fn-knock 的入口公网 IP，真正决定这条链路的是对外 TCP 端口 `7999`。

```text
浏览器
  -> http://knock.example.com:7999/docs
  -> 路由器或云防火墙放行 TCP 7999
  -> fn-knock 协议映射 TCP :7999
  -> 127.0.0.1:7998
  -> Swagger UI
```

1. 进入 `系统设置 → 模式`，确认当前为 `子域模式`。
2. 在 `系统设置 → 功能` 开启 `协议映射`。
3. 进入 `协议映射`，新增以下规则：

   | 字段 | 示例值 |
   | --- | --- |
   | 传输协议 | `TCP` |
   | 对外端口 | `7999` |
   | 备注 | `fn-knock OpenAPI` |
   | 目标地址 | `127.0.0.1:7998` |
   | 要求鉴权 | 开启 |

4. 在路由器配置“公网 TCP `7999` → fn-knock 所在设备 TCP `7999`”；云服务器还需在安全组中放行同一端口。Docker 部署必须在容器启动配置中显式发布该端口。
5. 若开启了 `要求鉴权`，先从同一公网出口 IP 完成 fn-knock 网页登录，并确保“登录后 IP 授权方式”未关闭；也可以为固定来源手动添加 IP / CIDR 授权。
6. 打开 `http://knock.example.com:7999/docs`。后端 `7998` 默认提供 HTTP，不能把示例直接改成 `https://`，除非已在它前面另行配置 TLS 终止。

![通过 fn-knock 协议映射打开的 Swagger UI，显示 server-admin API 与接口列表](/openapi-swagger-ui.webp)

Swagger UI 的脚本、样式和图标已经打包进 fn-knock，并从 `/docs/assets/` 本地加载，不依赖 jsDelivr、unpkg 或其他公共 CDN。只要管理后端和 `/docs/json` 可访问，离线或无法连接前端 CDN 的环境也能完整打开文档；某个未知资源路径会直接返回 `404`。

### 返回 403 或无法连接

- `403 Forbidden`：部分 Docker、Linux、OpenWrt 和 Windows 部署会要求请求经受保护的管理入口进入，直接访问内部后端会被拒绝。应保留该保护，不要伪造内部代理头或绕过管理面板。
- 连接被立即断开：检查协议映射鉴权、当前来源 IP 授权和凭据服务范围。
- 连接超时：依次检查 DNS、路由器端口转发、云安全组、Docker 端口发布和宿主机防火墙。
- 本机可以打开、外部打不开：确认路由器转发到的是 fn-knock 的对外端口 `7999`，不是内部目标端口 `7998`。

协议映射的完整平台边界与排错方法见[协议映射](/guide/stream-mappings)。

## 获取 OpenAPI 文件

可以把 OpenAPI JSON 保存到本地，再交给代码生成器、API 客户端或 AI Agent：

```bash
curl --fail \
  http://knock.example.com:7999/docs/json \
  -o fn-knock-openapi.json
```

当前契约由实际注册的管理路由生成，并为请求体、响应、路径参数和主要错误结构提供 Schema；构建与测试会检查文档中的 path / method 是否确实存在。契约版本会随 fn-knock 更新，因此生成客户端时应保存所依据实例的 `/docs/json` 和版本号，不要把旧版 Schema 直接用于更高或更低版本。即使类型完整，生成的代码仍需在测试实例中验证；优先从只读 `GET` 接口开始，再封装写操作。

## 让 AI Agent 编写集成代码

支持读取 URL 或本地文件的 AI Agent 可以先读取 `/docs/json`，再根据实际任务生成 Python、TypeScript、Go 或 Shell 代码。例如：

```text
读取 http://knock.example.com:7999/docs/json，
为我生成一个 TypeScript 客户端：
1. 只实现查询接口，不调用 POST、PATCH、PUT 或 DELETE；
2. 统一处理 fn-knock 的响应包和非 2xx 错误；
3. 地址从 FN_KNOCK_API_BASE 环境变量读取；
4. 为每个函数生成类型、超时和测试；
5. 不把 Cookie、密码或 Token 写进源码和日志。
```

需要修改配置时，应把操作范围、目标资源和确认步骤写进提示词。例如要求 Agent 先读取现状、输出变更预览，经人工确认后才调用写接口。若 OpenAPI 没有描述某个请求体，可同时提供浏览器开发者工具中的脱敏请求示例，让 Agent 按真实字段补全类型。

生成代码后至少检查：

1. 基础地址是否指向预期实例；
2. 是否携带了该部署要求的管理会话或认证信息；
3. 是否为请求设置超时并处理非成功响应；
4. 写操作是否具有幂等、备份或人工确认机制；
5. 日志是否会泄露 Cookie、凭据、证书私钥和内部地址。

## 安全边界

- 优先通过 VPN、固定出口 IP 或临时端口映射访问，不建议长期向整个公网开放。
- 开启协议映射的 `要求鉴权`；测试结束后不再需要时，关闭功能或删除该规则。
- `/docs` 只是接口说明页，不会把危险写操作变成安全操作。Swagger UI 中的 `Try it out` 会真实调用当前实例。
- `/docs/json` 本身会暴露管理接口清单，也应按管理面处理。
- 调用前先导出备份；证书、WAF、DDNS、映射和维护类写接口应在测试环境验证。

- [协议映射](/guide/stream-mappings)
- [认证、会话与服务范围](/guide/auth)
- [IP 白名单](/guide/whitelist)
- [备份、恢复与数据清理](/guide/backup-and-restore)
