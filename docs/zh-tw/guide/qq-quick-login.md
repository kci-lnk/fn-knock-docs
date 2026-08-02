---
lang: zh-TW
title: "綁定 QQ 快速登入"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 167424ec4854ec1e6971e78a291d7ae399d91d9d759bbc490b8f8b98881797e8
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# 綁定 QQ 快速登入

QQ 快速登入可將一個 QQ 帳號綁定至指定的 TOTP 憑據。綁定後，訪客可在登入頁面選擇 QQ 完成驗證；它會繼承該 TOTP 的服務範圍與工作階段原則，並不是獨立的使用者或管理員身分。

fn-knock 已內建 QQ 整合，不必前往 QQ 開放平台註冊應用程式，也不需要填寫 Client ID、Client Secret、Issuer 或 Callback URL。

![完成綁定後的登入頁面，顯示「使用 QQ 登入」按鈕](/screen-qqlogin.webp)

綁定成功後，登入頁面會顯示「使用 QQ 登入」。訪客完成人機驗證後，即可透過已綁定的 QQ 帳號登入。

## 使用前確認

- 目前使用 `TOTP 登入模式`。帳號密碼登入模式不會顯示，也不接受 QQ 登入。
- 已建立目標 TOTP 憑據，並保留另一組可用的 TOTP 或復原方式。QQ 不應成為唯一的復原手段。
- 身分驗證 Host 是最終可從外部存取的 HTTPS URL，例如 `https://auth.example.com`；不可使用 `localhost`、Container Name、內網 IP 或錯誤的連接埠。
- fn-knock 所在裝置可連線至 `https://api.fnknock.cn`。新增 QQ 時會讀取該服務的 OIDC Discovery。

身分驗證 Host 也會替 QQ 流程動態提供 Callback 與 Client Metadata。請勿在 CDN 或反向 Proxy 中快取 `/api/auth/oidc/` 下的動態回應，也不要在這些 Callback Path 外再加一層登入保護。前置 Proxy 應保留訪客實際使用的 `Host` 與公開通訊協定。

## 1. 新增 QQ 供應商

請在管理後台依序前往：

```text
驗證設定 → 頂端操作選單中的 OIDC 設定 → 新增供應商 → QQ → 新增
```

QQ 沒有需要手動填寫的連線欄位。儲存時，系統會先讓供應商維持停用狀態並測試 Discovery；測試成功後才會自動啟用。若測試失敗，請先處理裝置連線至 `api.fnknock.cn` 時的 DNS、網路或 TLS 問題，再重新新增。

測試成功只代表可探索到內建服務，不能取代下方的公網 Callback 驗證。

## 2. 將 QQ 綁定至 TOTP 憑據

1. 回到 `驗證設定` 中的 `TOTP 管理`。
2. 在要授予權限的 TOTP 憑據所在列，按下 `管理快速登入`。
3. 在 `外部帳號綁定` 中按下 `產生綁定邀請`，選擇 `QQ`，再按下 `產生`。
4. 在已登入目標 QQ 帳號的瀏覽器中開啟產生的連結，選擇「使用 QQ 綁定」並完成授權。
5. 回到管理頁面，確認「外部帳號綁定」清單中已出現 QQ 記錄。

邀請連結固定有效 30 分鐘，成功使用後立即失效。它等同於將一個 QQ 帳號連結至該 TOTP 的授權憑據：請勿傳送至群組聊天、Ticket 或任何無關人員；過期或誤傳後，直接重新產生即可。

同一個 QQ 身分無法同時綁定至另一個 TOTP。若需要調整歸屬，請先在原 TOTP 的「外部帳號綁定」中刪除舊綁定，再替新的 TOTP 產生邀請。

## 3. 驗證登入

使用無痕視窗或尚未登入的瀏覽器開啟身分驗證 Host，也可以直接開啟一個受保護的服務 Host。登入頁面出現 `使用 QQ 登入` 後，完成 QQ 授權，並確認能回到原本的服務 URL。

最後請檢查該 TOTP 的服務範圍：QQ 登入只能進入此 TOTP 獲准存取的 Host。區域網路與 Loopback 來源可能觸發 `local_exempt`，請使用行動網路等真實外部連線進行最終驗證。

## 為何不需要手動登錄 Callback URL

內建 QQ 供應商會依目前的身分驗證 Host，自動產生類似下列 URL：

```text
https://auth.example.com/api/auth/oidc/callback/<provider-id>
```

同時，系統會向 QQ 服務提供目前執行個體的 Client Metadata，因此不需要在第三方 Console 複製 Callback URL 或登錄自建 QQ 應用程式。移轉網域、連接埠或前置 Proxy 後，應重新檢查身分驗證 Host 的 HTTPS、Host 傳遞與公網連線能力，再重新測試 QQ 登入。

## 撤銷與疑難排解

刪除 QQ 綁定後，該 QQ 帳號會立即無法再登入，但不會刪除 TOTP 本身；刪除 QQ 供應商或關聯的 TOTP，也會移除對應綁定。保留 TOTP 可在 QQ 授權失敗、更換帳號或遺失裝置時復原存取。

| 現象 | 優先檢查 |
| --- | --- |
| 登入頁面沒有 QQ 按鈕 | 目前是否為 TOTP 登入模式，QQ 供應商是否已通過測試並啟用 |
| 新增 QQ 時測試失敗 | fn-knock 至 `api.fnknock.cn` 的 DNS、網路連線能力與 TLS |
| QQ 授權後 Callback 失敗 | 身分驗證 Host 是否為最終公網 HTTPS URL、反向 Proxy 是否保留 Host、動態 OIDC Path 是否遭快取或攔截 |
| 顯示 QQ 已綁定其他憑據 | 前往原 TOTP 的「管理快速登入」刪除舊綁定，再重新綁定 |
| 登入成功後仍無法進入服務 | 檢查關聯 TOTP 的服務範圍與目標 Host 存取原則 |

- [外部帳號登入（OIDC / OAuth / LDAP）](/zh-tw/guide/oidc)
- [TOTP 與驗證器](/zh-tw/guide/totp)
- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
