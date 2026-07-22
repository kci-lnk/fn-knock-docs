# fn-knock 文档

这是 [fn-knock](https://github.com/kci-lnk/fn-knock-turborepo) 的多语言用户文档，使用 VitePress 构建。简体中文位于根路径，并提供繁體中文（台灣）、English、日本語和 한국어。

## 本地预览

```bash
npm install
npm run dev
```

开发服务器默认监听 `http://localhost:3500`。

## 构建

```bash
npm run build
```

页面位于 `docs/`，站点配置位于 `docs/.vitepress/config.ts`。新增或修改内容前，请先阅读 [文档写作规范](./STYLE_GUIDE.md) 和 [国际化架构说明](./I18N.md)。

新增简体中文页面后，补齐其他语言的对应路径并完成检查：

```bash
npm run i18n:sync
npm run check:docs
```

产品行为以 `fn-knock-turborepo` 的已发布实现为准。涉及端口、部署能力和运行模式时，不要只参考旧页面或界面截图。
