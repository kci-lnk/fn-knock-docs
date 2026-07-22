---
lang: zh-TW
title: "TOTP 與驗證器 App"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 0abfe75a5862233be3e6af3aeea4c4c59466cee80b2b67cb50157480a99cd0f7
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# TOTP 與驗證器 App

TOTP 是隨時間輪替的一次性驗證碼。在 fn-knock 中，它既能作為主要登入方式，也能作為 Passkey、QQ 及其他外部帳號登入的身分錨點。

## 綁定一組憑據

1. 開啟 `驗證設定`，新增 TOTP 憑據。
2. 使用可信任的身份驗證器 App 掃描 QR Code；無法掃描時，請開啟手動設定並複製 TOTP 密鑰。
3. 輸入目前的驗證碼完成驗證，並為憑據填寫容易辨識的名稱。
4. 再綁定第二台獨立裝置，或準備離線備援方案。

不要只在一支手機上保留唯一一組 TOTP。裝置遺失、系統重灌或時間異常，都可能讓你無法登入。

## 服務範圍

TOTP 清單中的 `權限` 可以選擇所有範圍或自訂範圍。自訂清單會分組顯示要求登入的服務 Host、內建選擇頁，以及已啟用驗證的 TCP／UDP 協定映射；已刪除但仍留在權限內的入口會標示為失效。自訂範圍為空時，該憑據無法進入任何受保護的入口。

這項限制會同時套用至關聯的 Passkey、QQ 及其他 OIDC 外部帳號。服務範圍受限的 TOTP 不會建立通用的登入後自動 IP 授權；若範圍中選取了特定協定映射且登入後 IP 授權未停用，系統只會依對應通訊協定與對外連接埠授權目前來源 IP。建議將個人、家人、自動化及管理用途拆成不同憑據，方便個別撤銷與稽核。

`管理快捷登入` 可用來檢視或刪除關聯的 Passkey、檢視外部帳號綁定，以及產生有效時間 30 分鐘的綁定邀請。Passkey 必須由訪客在完成 TOTP 登入後，從狀態頁建立，無法直接在管理表格中建立。

## 時間不同步

驗證碼連續出錯時，請先確認手機與 Server 的日期、時區及自動校時是否正常。不要反覆重試到觸發登入退避。Server 時間異常應在 Host 上修正；Docker 不支援由 fn-knock 直接校時，OpenWrt 則應先確認 Router 本身的 NTP 與目前權限。

## 匯入與匯出

TOTP 匯出檔包含可產生驗證碼的 secret、名稱及權限。匯入時會略過相同 ID、相同 secret 及檔案內的重複項目；管理頁只接受不超過 512 KB 的 JSON 檔，且不會還原 Passkey 或外部帳號綁定。

匯出檔、QR Code 及手動密鑰都等同於登入憑據，應以加密方式保存，並避免截圖、公開分享或上傳至雲端筆記。刪除 TOTP 時，關聯的 Passkey 與外部帳號綁定也會一併刪除，對應登入方式將無法再使用。

- [Passkey](/zh-tw/guide/passkey)
- [綁定 QQ 快捷登入](/zh-tw/guide/qq-quick-login)
- [外部帳號登入](/zh-tw/guide/oidc)
- [驗證、工作階段與服務範圍](/zh-tw/guide/auth)
