---
lang: zh-TW
title: "Passkey"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 3513530a35a853969bc9498a2f849156483d2a2a775317abdf5102064ce147b8
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Passkey

Passkey 可讓已綁定的裝置透過系統生物辨識或裝置解鎖完成登入。此功能只可在 `TOTP 登入模式` 下使用，並會綁定至既有的 TOTP 憑據；TOTP 仍應保留作為復原方式。

## 使用條件

- 使用 HTTPS 與最終實際存取的網域；瀏覽器需要 Secure Context。
- 已建立可用的 TOTP 憑據。
- 身分驗證 Host、Cookie Domain 與 Passkey RP 設定符合網域規劃。
- 瀏覽器或作業系統支援 WebAuthn。

子網域情境可選擇將 Passkey 綁定至身分驗證 Host，或依產品設定使用父網域。修改 RP 設定會影響既有 Passkey 的可用性，切換前應先保留可用的 TOTP。

## 綁定與登入

使用 TOTP 登入後，請依狀態頁面提示綁定 Passkey。裝置會要求透過指紋、臉部辨識或系統解鎖進行確認。`系統設定 → 功能 → 登入後提示綁定 Passkey` 只控制狀態頁面是否主動顯示提示；關閉此選項不會刪除既有 Passkey，也不會停用登入頁面的 Passkey。

登入後的狀態頁面會識別目前瀏覽器是否曾使用或記錄該帳號的 Passkey：

- 目前瀏覽器沒有已知 Passkey，且帳號也尚未綁定時，顯示 `開啟 Passkey 一鍵登入`。
- 帳號已有 Passkey，但目前瀏覽器沒有已知憑據時，顯示 `再新增一個 Passkey`，可替新裝置或尚未同步的密碼管理器補上憑據。
- 目前瀏覽器已有已知 Passkey 時，不會重複顯示綁定入口。

此處的「目前瀏覽器已知」只用來控制綁定提示：頁面會將憑據 ID 的 SHA-256 Digest 儲存在瀏覽器 Local Storage 中，不會儲存 Passkey 私密金鑰。清除該站台的瀏覽器資料、停用 Local Storage，或改用其他瀏覽器後，綁定提示可能再次出現；這不代表伺服器端憑據已遺失，可直接嘗試使用 Passkey 登入，或視需要再新增一個。

TOTP 清單中的 `管理快速登入` 可查看 Passkey ID、裝置名稱與綁定時間，也可刪除單一 Passkey；此處不提供新增 Passkey。該頁面也負責管理外部帳號綁定；若要綁定 QQ，請改看[綁定 QQ 快速登入](/zh-tw/guide/qq-quick-login)。

Passkey 會繼承關聯 TOTP 的服務範圍與工作階段原則。刪除單一 Passkey 只會撤銷該憑據，不會刪除 TOTP、其他 Passkey 或外部帳號綁定；刪除上層 TOTP 則會一併刪除關聯的快速登入方式。

## 網域與 RP

WebAuthn 會將 Passkey 綁定至 Relying Party（RP）Domain。身分驗證 Host、根網域與 Passkey RP 需要有穩定的規劃：

- 只使用單一身分驗證網域時，可讓 RP 與身分驗證 Host 對齊。
- 希望同一父網域下的多個 Host 共用時，請依後台支援的父網域方案設定 RP。
- 更換身分驗證網域、從 IP 改為網域，或變更父網域後，既有 Passkey 可能無法使用。

移轉前請保留可用的 TOTP，並先透過新網域綁定一個測試 Passkey。反向 Proxy 應保留最終的外部 Host 與 HTTPS 通訊協定資訊。

## 疑難排解

- 入口未顯示：確認仍在 TOTP 登入模式、頁面透過 HTTPS 存取，且瀏覽器支援 WebAuthn。
- 綁定後無法登入：檢查身分驗證網域與 RP 設定是否一致，改用 TOTP 完成復原。
- 更換瀏覽器或裝置：是否可用取決於系統有沒有同步該 Passkey；不要假設一定會自動移轉。
- 顯示建立已取消或逾時：重新發起綁定，並完成系統跳出的生物辨識或解鎖確認。
- 顯示系統無法建立：確認裝置已設定螢幕鎖定、瀏覽器允許使用 Passkey，且密碼管理器或系統憑據服務可用。
- 顯示目前裝置已有此 Passkey：不必重複綁定，直接在登入頁面使用 Passkey；若新裝置尚未同步，可從狀態頁面再新增一個。

- [TOTP 與驗證器](/zh-tw/guide/totp)
- [綁定 QQ 快速登入](/zh-tw/guide/qq-quick-login)
- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
