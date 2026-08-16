---
lang: zh-TW
title: "閘道內建頁面"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2a965da8ae338020a10c85ef93b02e978cf6541fa3e850aeb7cfb0458bdf315f
---

# 閘道內建頁面

內建頁面不需設定映射。任何已解析並轉送到 fn-knock 閘道的子網域，都可直接加上內建路徑存取：

```text
https://nas.example.com/__select__
https://nas.example.com/__wol__
```

路徑必須完全一致；`/__select__/` 與 `/__wol__/` 不是內建頁面。子網域必須實際指向閘道入口，且憑證、CDN、反向 Proxy 或通道能正確處理該網域與 `Host`。

## 應用程式選擇頁：`/__select__`

開啟 `https://任意已接入閘道的子網域/__select__` 即可進入應用程式選擇頁。未登入時會先跳轉登入；登入後只顯示目前憑證可存取的服務。

![應用程式選擇頁](/images/gateway-built-in-pages/service-selection.webp)

自訂服務範圍時，請在 `驗證設定 → 權限` 勾選「內建選擇頁」。開啟此頁不會取得未授權服務的權限。

## 網路喚醒頁：`/__wol__`

開啟 `https://任意已接入閘道的子網域/__wol__` 可查看已啟用裝置並發送喚醒請求。

![網路喚醒頁](/images/gateway-built-in-pages/wake-on-lan-mobile.png)

需同時滿足以下條件：

1. 已在 `系統設定 → 功能 → 遠端喚醒` 開啟 WOL。
2. 已在 `系統設定 → 閘道 → 傳送門` 開啟「顯示遠端喚醒快速入口」。
3. 已登入；自訂服務範圍還需勾選「內建遠端喚醒頁面」。

關閉 WOL 快速入口後，`/__wol__` 會回傳找不到頁面，不會轉送到上游服務。

## 登入回退：`/__auth__/…`

`/__auth__` 並非所有子網域都會自動使用的登入入口。

| 情況 | 登入位址 |
| --- | --- |
| 業務子網域位於已設定根網域下，可共用 Cookie | 跳轉到統一驗證 Host，例如 `auth.example.com` |
| 業務子網域不在根網域 Cookie 範圍內，無法共用登入狀態 | 跳轉到該子網域自己的 `/__auth__/login` |

例如根網域為 `example.com`、驗證 Host 為 `auth.example.com`：`nas.example.com` 使用統一登入；`nas.other-example.net` 會透過下列位址個別完成登入：

```text
https://nas.other-example.net/__auth__/login
```

這個工作階段只屬於目前子網域，不能和 `example.com` 下的服務共用。`/__auth__/…` 還包含登出、OIDC 回呼等驗證介面，不應作為公開 API 使用。

- [閘道入口頁](/zh-tw/guide/gateway-portal)
- [遠端喚醒](/zh-tw/guide/wake-on-lan)
- [工作階段、IP 授權與 IP 變更](/zh-tw/guide/session-management)
