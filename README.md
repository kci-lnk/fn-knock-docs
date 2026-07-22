# fn-knock 文档

[![Documentation](https://img.shields.io/badge/docs-fn--knock-3157c8?style=flat-square)](https://docs.fnknock.cn/)
[![VitePress](https://img.shields.io/badge/built%20with-VitePress-646cff?style=flat-square&logo=vitepress&logoColor=white)](https://vitepress.dev/)
[![License](https://img.shields.io/badge/license-MIT-111827?style=flat-square)](./LICENSE)

`fn-knock` 的官方多语言文档站，面向 NAS、HomeLab 和自托管服务的统一入口、身份认证与访问控制。文档覆盖安装、部署方案、网关代理、证书、DDNS、隧道、安全策略和日常运维。

> 产品源码、安装包与发布流程位于 [kci-lnk/fn-knock-turborepo](https://github.com/kci-lnk/fn-knock-turborepo)。

## 链接

- [在线文档](https://docs.fnknock.cn/)
- [fn-knock 官网](https://www.fnknock.cn/)
- [产品主仓库](https://github.com/kci-lnk/fn-knock-turborepo)
- [Docker Hub](https://hub.docker.com/r/kcilnk/fn-knock)

## 支持的语言

简体中文位于根路径；繁體中文（台灣）、English、日本語与 한국어使用各自的语言前缀。所有语言页面保持相同的路由与文档结构。

| 语言 | 路径 |
| --- | --- |
| 简体中文 | `/` |
| 繁體中文（台灣） | `/zh-tw/` |
| English | `/en/` |
| 日本語 | `/ja/` |
| 한국어 | `/ko/` |

## 内容范围

- 安装与首次登录：fnOS、Docker、OpenWrt、Linux、Synology DSM 和 Windows
- 公网子域访问、反向代理模式、直连授权与端口规划
- 密码、TOTP、Passkey、OIDC、会话与访问策略
- HTTPS 证书、DDNS、Cloudflared、FRP、WAF、白名单与请求日志
- 备份恢复、更新、系统监控、通知和常见问题排查

## 本地开发

要求：Node.js `^20.19.0` 或 `>=22.12.0`，以及 npm。

```bash
npm install
npm run dev
```

开发服务器默认监听 <http://localhost:3500>。文档源文件在 `docs/`，VitePress 配置位于 `docs/.vitepress/config.ts`。

## 校验与构建

```bash
# 检查站内链接、文案规则和各语言的路由对应关系
npm run check:docs

# 构建 VitePress 站点
npm run build

# 准备站点部署产物
npm run build:sites

# 生成可分发的部署压缩包
npm run build:zip
```

构建产物位于 `docs/.vitepress/dist/`；`build:sites` 会生成用于部署的 `dist/` 目录。两者均为生成文件，不应提交到 Git。

## 发布与部署

在 GitHub 仓库的 Actions secrets 中配置 `TENCENT_EO_DEPLOY_HOOK_URL`，值为腾讯云 EdgeOne 项目生成的部署 Hook。发布时从已同步的 `main` 分支执行：

```bash
npm run release -- v1.2.3
```

命令会创建并推送带注释的 Git tag；GitHub Actions 收到 `v*` tag 后，会向 EdgeOne Hook 发送 `POST` 请求并触发 `main` 分支部署。Hook URL 是部署凭证，不应写入代码、日志或提交历史。

## 国际化贡献

新增或调整简体中文页面时，请同步维护其他语言的对应页面和链接，并运行：

```bash
npm run i18n:sync
npm run check:docs
```

写作规范与国际化实现说明分别见 [STYLE_GUIDE.md](./STYLE_GUIDE.md) 和 [I18N.md](./I18N.md)。涉及产品行为、端口、部署能力或运行模式时，请以 [产品主仓库](https://github.com/kci-lnk/fn-knock-turborepo) 的已发布实现为准。

## 贡献

欢迎通过 Issue 或 Pull Request 改进文档。提交前请确保：

1. 新增页面具备正确的多语言路径与导航入口。
2. 站内链接可以解析，示例命令可复现。
3. `npm run check:docs` 与 `npm run build` 均通过。
4. 不提交 `node_modules`、构建产物或本机生成的 `.DS_Store` 文件。

## 许可证

本仓库采用 [MIT License](./LICENSE)。
