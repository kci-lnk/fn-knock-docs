---
lang: zh-TW
title: "外部帳號登入（OIDC / OAuth / LDAP）"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 445f88b52c1313d35d5a7333c4638395111f5270cad7b7d9e76c7dcd80ac0b78
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 外部帳號登入（OIDC / OAuth / LDAP）

外部帳號登入可將 QQ、Google、Microsoft、GitHub、相容 OIDC 的身分提供者，或 LDAP／Active Directory 目錄帳號綁定至一組 TOTP 憑據。此功能只可在 `TOTP 登入模式` 下使用；登入成功後，仍會套用 fn-knock 的工作階段、所連結 TOTP 的服務範圍與登入後 IP 授權原則。

OIDC／OAuth 會將瀏覽器重新導向第三方網站完成授權；LDAP 則由 fn-knock 伺服器透過 LDAPS 或 StartTLS 連線至目錄。兩者都必須先綁定既有 TOTP，不能自動建立 fn-knock 身分。

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

## LDAP / Active Directory

前往 `驗證設定 → OIDC 設定`，在 `LDAP / Active Directory 供應商` 中新增 OpenLDAP、Active Directory 或自訂 LDAP。目錄連線一律驗證 TLS 憑證，不支援明文 LDAP；使用私有 CA 時，請將簽發鏈的 PEM 憑證貼入 `私有 CA PEM`。

| 設定 | 行為 |
| --- | --- |
| 伺服器 URL | 每行一個；LDAPS 使用 `ldaps://ldap.example.com:636`，StartTLS 使用 `ldap://ldap.example.com:389`。無法使用的伺服器會依序嘗試 |
| `Base DN` | 使用者搜尋的根 DN，例如 `dc=example,dc=com` |
| `搜尋後綁定` | 先用服務帳號在 Base DN 下依 Filter 找到唯一使用者，再以該使用者 DN 與密碼驗證 |
| `直接綁定` | 先以 `{username}` 樣板產生 DN 或 UPN 並驗證密碼，再從 Base DN 讀取身分屬性 |
| 使用者 Filter | 必須包含 `{username}`；輸入值會依 LDAP Filter 規則跳脫 |
| 穩定 ID 屬性 | 持續識別同一目錄身分；OpenLDAP 預設為 `entryUUID`，Active Directory 預設為 `objectGUID` |

啟用前請先按一下 `測試`。搜尋後綁定會測試連線與服務帳號；直接綁定需要輸入一組目錄帳號完成一次性測試，測試憑據不會儲存。連線逾時、憑證名稱不符、缺少私有 CA、Base DN 錯誤，或 Filter 回傳零筆／多筆使用者，都會造成登入失敗。

### 綁定目錄帳號

1. 在 `驗證設定` 中開啟目標 TOTP 的 `快速登入`。
2. 在 `外部帳號綁定` 中產生邀請，並選擇已啟用的 LDAP 供應商。
3. 讓目錄帳號使用者在 30 分鐘內開啟邀請連結，完成人機驗證並輸入目錄使用者名稱與密碼。
4. 返回快速登入頁面，核對供應商、帳號、Subject 與最近使用時間，再以無痕視窗測試登入。

邀請連結會將驗證成功的目錄身分綁定至指定 TOTP，屬於敏感授權資料。同一目錄身分不能透過同一供應商同時綁定多組 TOTP。刪除綁定只會移除 fn-knock 中的關聯，不會修改目錄帳號；刪除供應商會一併刪除該供應商下的所有綁定。

## 存取範圍

OIDC 與 LDAP 都不是獨立的管理員身分。它們會繼承所綁定 TOTP 的子網域與協定映射範圍；撤銷綁定後，外部帳號將無法再登入，但不會刪除 TOTP 本身。刪除供應商會一併移除該供應商下的外部帳號綁定，執行前應確認所有使用者仍保有 TOTP 或其他復原方式。

綁定邀請固定有效 30 分鐘，並會將完成授權的外部身分連結至目前 TOTP。邀請連結屬於敏感授權資料，不應貼在群組聊天、Ticket 或公開頁面。完成綁定後，請在快速登入管理頁面核對供應商、帳號、Subject 與最近使用時間。

## 常見問題

| 現象 | 檢查項目 |
| --- | --- |
| 登入頁面沒有外部帳號入口 | 目前必須使用 TOTP 登入模式，且供應商已啟用並完成所有必填設定 |
| 供應商拒絕 Callback | 檢查 Callback URL、HTTPS、允許的 Redirect URI、網域與連接埠 |
| Callback 後顯示尚未綁定 | 先在 fn-knock 中完成外部帳號與 TOTP 綁定 |
| LDAP 顯示服務無法使用 | 從 fn-knock 執行環境檢查目錄 DNS、連接埠、TLS 憑證鏈與系統時間 |
| LDAP 憑據正確但仍登入失敗 | 檢查 Base DN、使用者 Filter、綁定模式、穩定 ID 與使用者名稱屬性；搜尋結果必須唯一 |
| 登入後仍遭拒絕 | 檢查關聯 TOTP 的服務範圍與目標 Host 原則 |

- [綁定 QQ 快速登入](/zh-tw/guide/qq-quick-login)
- [TOTP 與驗證器](/zh-tw/guide/totp)
- [Passkey](/zh-tw/guide/passkey)
- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
