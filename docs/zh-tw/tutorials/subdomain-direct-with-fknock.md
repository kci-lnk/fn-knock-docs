---
lang: zh-TW
title: "公網直連：以子網域發布服務"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: f2efa5b87964cd7b5c57c139140d7f1675c3f305e51f6b3c4e7b19de8a4f0bc6
---

# 公網直連：以子網域發布服務

本方案適合具備可從外部直連的公網 IPv4 或 IPv6、擁有網域名稱，且希望每項 Web 服務使用獨立子網域的環境。最終存取形式例如：

```text
auth.example.com     登入入口
nas.example.com      fnOS 或 NAS 服務
files.example.com    檔案服務
```

此方案使用 `子網域模式`（公網直連 + Host 路由），不是「內網穿透／子網域映射」。沒有公網入口時，請改看[無公網 IP：透過 Tunnel 發布子網域](/zh-tw/tutorials/reverse-proxy-with-fknock)。

## 前置需求

- fn-knock 閘道連接埠可從公網連線；fnOS FPK、Docker、OpenWrt、Linux、Synology DSM 7 SPK 與 Windows 都可採用此方案。Docker 需要發布閘道連接埠；Synology 與 Windows 還需要分別確認 DSM／Windows 防火牆、路由器或前置 Proxy 已將公網流量送入閘道；
- 路由器、Cloud Security Group 與主機未另外將業務服務的原始連接埠暴露至公網；
- 已備妥 `example.com`，且可修改 DNS；
- 至少有一部可使用 TOTP 或帳號密碼的救援裝置；
- 有行動網路等真正的外部網路可供驗證。

## 設定步驟

1. 在 `系統設定 → 模式` 選擇 `子網域模式` 並儲存。
2. 開啟 `子網域映射`，填入根網域與身分驗證服務實際使用的公網連接埠。例如根網域為 `example.com`、身分驗證 Host 為 `auth.example.com`，而公網 `443` 轉送至內部閘道 `7999` 時，公開連接埠請填入 `443`。
3. 新增身分驗證服務映射。身分驗證服務必須保持公開可達，不能對自身啟用「要求登入」、舊版嚴格允許清單，或注入上游 Basic Auth。
4. 新增第一個業務 Host，例如 `files.example.com`，Target 填入業務服務的內部 HTTP 位址，並開啟「要求登入」。
5. 在 DNS 中，讓身分驗證 Host 與業務 Host 指向同一個公網入口。服務較多時可使用 Wildcard Record；同時確認路由器已將閘道連接埠轉送至 fn-knock。
6. 在 `SSL 憑證` 中設定涵蓋身分驗證 Host 與業務 Host 的憑證。
7. 公網位址會變動時，請設定 DDNS；使用固定公網位址則可略過。

## DNS 與連接埠範例

```text
auth.example.com  A/AAAA -> 公網入口
files.example.com A/AAAA -> 公網入口
公網 443/TCP -> fn-knock 7999/TCP
```

此時瀏覽器會存取 `https://files.example.com`，根網域設定中的身分驗證服務連接埠應填入 `443`。如果對外使用 `https://files.example.com:8443`，則應將公網 `8443` 轉送至實際閘道連接埠，並在相關公開連接埠設定中填入 `8443`。

同時發布 A 與 AAAA Record 前，請分別確認 IPv4 與 IPv6 都能連線至閘道。如果 AAAA 指向無法連線的位址，支援 IPv6 的 Client 可能會優先採用失敗鏈路；沒有穩定 IPv6 入站能力時，只發布 A Record。

## 業務映射欄位

| 欄位 | 建議 |
| --- | --- |
| Host | 填入完整網域名稱，或依頁面由根網域組合；不得包含路徑 |
| Target | 使用 fn-knock 執行環境可連線的 `http://` 或 `https://` 位址 |
| 要求登入 | 私有服務開啟；身分驗證服務必須關閉 |
| Host 回應 | 預設保留訪客 Host；只有上游僅接受自身 Host 時才關閉 |
| 略過 Basic Auth | 僅用於注入上游本身的 Basic Auth，不能取代 fn-knock 登入 |
| WAF | 依應用程式相容性，針對各 Host 個別啟用或略過 |

Docker 中的 `127.0.0.1` 只代表 Container 本身；位於主機或其他 Container 的服務，必須使用 Container 可連線的位址。多個 Host 共用同一個 Target 時，也會共用 Host 回應設定；若需要不同原則，請使用不同 Target。

## 驗證

中斷家用 Wi-Fi，改用行動網路依序測試：

1. 開啟身分驗證 Host 並完成登入；
2. 開啟業務 Host，確認進入正確的上游；
3. 在請求記錄中確認 Host、Client IP、身分驗證狀態與上游 Target；
4. 嘗試存取業務服務的原始公網連接埠，確認無法繞過閘道。

在區域網路內不需要登入，並不代表公網規則正確。fn-knock 會將私有網路與本機來源視為本機例外。

接著執行以下異常測試：

- 存取未設定的 Host，應取得閘道預設回應，而不是誤入其他服務；
- 使用不含對應權限的憑證存取受服務範圍限制的 Host，應遭到拒絕；
- 登出後重新開啟業務 Host，應再次進入身分驗證流程，除非目前來源仍有有效的 IP 授權；
- WebSocket、上傳、下載與應用程式 Callback 應保持正常。

## 回復原設定

批次遷移前，請先只接入一個業務 Host。需要回復時，先還原原 DNS 與 Port Forwarding，再刪除或停用新映射；確認憑證與 DDNS Job 不再被其他 Host 使用後才清除。請勿先刪除唯一的身分驗證 Host，否則所有要求登入的業務 Host 都會失去正常入口。

## 常見問題

| 現象 | 檢查項目 |
| --- | --- |
| 身分驗證 Host 無法開啟 | DNS、閘道連接埠、路由器轉送、憑證與身分驗證服務映射 |
| 登入後業務 Host 仍遭拒絕 | 映射存取原則、憑證服務範圍、Cookie Domain 與真實 Client IP |
| 開啟錯誤的應用程式 | Host 名稱、DNS Record 與上游 Target |
| 頁面顯示憑證錯誤 | 憑證未涵蓋該 Host，或 CDN／回源使用錯誤的 TLS Name |

- [子網域映射](/zh-tw/guide/subdomain-proxy)
- [憑證與 HTTPS](/zh-tw/guide/ssl)
- [DDNS 管理](/zh-tw/guide/ddns)
