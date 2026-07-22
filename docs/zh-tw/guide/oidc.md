---
lang: zh-TW
title: "外部帳號登入（OIDC / OAuth）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: c3fe4e8953c57b8ed772c285d3f380b3958e969947b9c2c92ba260120c396148
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 外部帳號登入（OIDC / OAuth）

外部帳號登入可將 QQ、Google、Microsoft、GitHub 或相容 OIDC 的身分提供者綁定至一組 TOTP 憑據。此功能只可在 `TOTP 登入模式` 下使用；第三方登入成功後，仍會沿用 fn-knock 的工作階段與服務範圍。

## QQ 使用內建整合

QQ 是 fn-knock 內建的公用供應商，不需要註冊 QQ 應用程式，也不需要填寫 Client ID、Client Secret、Issuer 或手動登錄 Callback URL。新增後，仍要替每位使用者將 QQ 帳號綁定至目標 TOTP 憑據。

完整的使用條件、綁定邀請、Callback 要求與撤銷方式，請參閱[綁定 QQ 快速登入](/zh-tw/guide/qq-quick-login)。

## Google、Microsoft、GitHub 與自訂 OIDC

1. 確認身分驗證 Host 已設定為可從公網存取的 HTTPS URL。
2. 從驗證設定頂端的操作選單進入 `OIDC 設定`，並新增供應商。
3. 將 fn-knock 顯示的 Callback URL 原樣填入第三方供應商的 Redirect URI 清單。
4. 填入供應商要求的 Client ID 與 Client Secret；Microsoft 可指定 `common`、`organizations` 或 Tenant ID，自訂 OIDC 還需要填寫 Issuer。
5. 檢查 Scopes。輸入內容支援以空格或逗號分隔，至少保留供應商完成身分識別所需的 `openid`，以及必要的使用者資訊 Scope。
6. 在目標 TOTP 憑據的 `管理快速登入 → 外部帳號綁定` 中產生邀請，完成授權綁定。
7. 使用無痕視窗從登入頁面驗證，再檢查該 TOTP 的服務範圍。

Callback URL 必須使用訪客實際可見的身分驗證 Host。`localhost`、Container Name、內網 IP 或錯誤的連接埠，都會造成第三方供應商拒絕 Callback。QQ 的動態 Callback 由系統處理，不適用本節的手動登錄步驟。

一般供應商在必填連線參數完整時，會以啟用狀態建立；缺少參數時則儲存為 `待設定` 草稿。編輯時將 Client Secret 留空，代表保留目前值。停用供應商會隱藏或拒絕該登入入口，但設定仍會保留，方便日後重新啟用。

## 存取範圍

OIDC 不是獨立的管理員身分。它會繼承所綁定 TOTP 的子網域範圍；撤銷綁定後，第三方帳號將無法再登入，但不會刪除 TOTP 本身。刪除供應商會一併移除該供應商下的外部帳號綁定，執行前應確認所有使用者仍保有 TOTP 或其他復原方式。

綁定邀請固定有效 30 分鐘，並會將完成授權的外部身分連結至目前 TOTP。邀請連結屬於敏感授權資料，不應貼在群組聊天、Ticket 或公開頁面。完成綁定後，請在快速登入管理頁面核對供應商、帳號、Subject 與最近使用時間。

## 常見問題

| 現象 | 檢查項目 |
| --- | --- |
| 登入頁面沒有外部帳號按鈕 | 目前必須使用 TOTP 登入模式，且供應商已啟用 |
| 供應商拒絕 Callback | 檢查 Callback URL、HTTPS、允許的 Redirect URI、網域與連接埠 |
| Callback 後顯示尚未綁定 | 先在 fn-knock 中完成外部帳號與 TOTP 綁定 |
| 登入後仍遭拒絕 | 檢查關聯 TOTP 的服務範圍與目標 Host 原則 |

- [綁定 QQ 快速登入](/zh-tw/guide/qq-quick-login)
- [TOTP 與驗證器](/zh-tw/guide/totp)
- [Passkey](/zh-tw/guide/passkey)
- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
