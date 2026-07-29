---
lang: zh-TW
title: "OpenAPI：開放管理 API 與 AI Agent"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bbaa030928ee6b0fa8a075f19ec2564f978c2e91c2e29f5c88bc76ea6f1b5b50
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# OpenAPI：開放管理 API 與 AI Agent

fn-knock 的 Rust 管理後端提供 OpenAPI 3.0 文件，可用來查看管理介面、產生用戶端程式碼或串接自動化工具。本文假設管理後端監聽 `127.0.0.1:7998`，並以 fn-knock 本身的通訊協定映射，讓外部可透過 `knock.example.com:7999` 存取文件。

管理 API 可以修改映射、憑證、DDNS、WAF 與其他系統設定。請勿將它當成一般公開網頁直接暴露；應啟用通訊協定映射驗證，並搭配固定來源 IP、VPN 或其他網路存取限制。

## 文件入口

| 位址 | 內容 |
| --- | --- |
| `http://127.0.0.1:7998/docs` | Swagger UI 互動式文件 |
| `http://127.0.0.1:7998/docs/json` | OpenAPI 3.0 JSON |
| `http://knock.example.com:7999/docs` | 完成下文映射後的外部文件入口 |

此範例假設目前 Instance 的管理後端連接埠為 `7998`。OpenWrt 預設使用 `17998`；若曾自訂連接埠，請以實際部署設定為準。建立外部映射前，先在 fn-knock 所在裝置開啟本機 `/docs`，確認後端連接埠與文件可用。

## 透過通訊協定映射開放文件

通訊協定映射依 TCP／UDP 與連接埠轉送，不會依網域分流。`knock.example.com` 只需解析至 fn-knock 的公網入口 IP，真正識別此路由的是對外 TCP 連接埠 `7999`。

```text
瀏覽器
  -> http://knock.example.com:7999/docs
  -> 路由器或雲端防火牆允許 TCP 7999
  -> fn-knock 通訊協定映射 TCP :7999
  -> 127.0.0.1:7998
  -> Swagger UI
```

1. 進入 `系統設定 → 模式`，確認目前為 `子網域模式`。
2. 在 `系統設定 → 功能` 開啟 `通訊協定映射`。
3. 進入 `通訊協定映射`，新增以下規則：

   | 欄位 | 範例值 |
   | --- | --- |
   | 傳輸通訊協定 | `TCP` |
   | 對外連接埠 | `7999` |
   | 備註 | `fn-knock OpenAPI` |
   | Target | `127.0.0.1:7998` |
   | 要求驗證 | 開啟 |

4. 在路由器設定「公網 TCP `7999` → fn-knock 所在裝置 TCP `7999`」；雲端伺服器還需在 Security Group 放行相同連接埠。Docker 部署必須在 Container 啟動設定中明確 Publish 此連接埠。
5. 若已開啟 `要求驗證`，先從相同公網出口 IP 完成 fn-knock 網頁登入，並確認「登入後 IP 授權」未關閉；也可以針對固定來源手動新增 IP／CIDR 授權。
6. 開啟 `http://knock.example.com:7999/docs`。後端 `7998` 預設提供 HTTP；除非另行在前方設定 TLS Termination，否則不可直接將範例改成 `https://`。

![透過 fn-knock 通訊協定映射開啟的 Swagger UI，顯示 server-admin API 與介面清單](/openapi-swagger-ui.webp)

Swagger UI 的 Script 與 Style 會從 jsDelivr 載入。瀏覽器無法連線至該 CDN 時，頁面可能顯示空白，但仍可直接讀取 `/docs/json`。

### 回傳 403 或無法連線

- `403 Forbidden`：部分 Docker、Linux、OpenWrt 與 Windows 部署要求請求經過受保護的管理入口，直接存取內部後端會遭拒絕。請保留此保護，不要偽造內部 Proxy Header 或繞過管理面板。
- 連線立即中斷：檢查通訊協定映射驗證、目前來源 IP 授權與憑據的服務範圍。
- 連線逾時：依序檢查 DNS、路由器 Port Forwarding、雲端 Security Group、Docker Port Publishing 與 Host 防火牆。
- 本機可開啟但外部無法連線：確認路由器轉送至 fn-knock 的對外連接埠 `7999`，而不是內部 Target 連接埠 `7998`。

完整平台限制與疑難排解方式請參閱 [TCP／UDP 通訊協定映射](/zh-tw/guide/stream-mappings)。

## 取得 OpenAPI 檔案

可先將 OpenAPI JSON 儲存至本機，再交給程式碼產生器、API 用戶端或 AI Agent：

```bash
curl --fail \
  http://knock.example.com:7999/docs/json \
  -o fn-knock-openapi.json
```

目前文件主要提供路由、HTTP Method 與分組資訊。部分 Request Body、Response 結構與驗證細節可能沒有完整 Model，產生的程式碼仍需在測試 Instance 中驗證。請先從唯讀 `GET` 介面開始，確認 Response 結構後再封裝寫入操作。

## 讓 AI Agent 編寫整合程式

可讀取 URL 或本機檔案的 AI Agent，可以先讀取 `/docs/json`，再依實際任務產生 Python、TypeScript、Go 或 Shell 程式碼。例如：

```text
讀取 http://knock.example.com:7999/docs/json，
替我產生 TypeScript 用戶端：
1. 只實作查詢介面，不呼叫 POST、PATCH、PUT 或 DELETE；
2. 統一處理 fn-knock 的 Response Envelope 與非 2xx 錯誤；
3. 從 FN_KNOCK_API_BASE 環境變數讀取基礎位址；
4. 為每個函式產生型別、逾時與測試；
5. 不將 Cookie、密碼或 Token 寫入原始碼與 Log。
```

需要修改設定時，應在 Prompt 中寫明操作範圍、目標資源與確認流程。例如要求 Agent 先讀取目前狀態、輸出變更預覽，經人工確認後才呼叫寫入介面。若 OpenAPI 未描述某個 Request Body，可同時提供瀏覽器開發者工具中已去識別化的 Request 範例，讓 Agent 依實際欄位補齊型別。

使用產生的程式碼前，至少確認：

1. 基礎位址指向預期的 Instance；
2. Request 帶有該部署所需的管理工作階段或驗證資訊；
3. Request 已設定逾時並處理非成功 Response；
4. 寫入操作具有冪等、備份或人工確認機制；
5. Log 不會洩漏 Cookie、憑據、憑證私鑰與內部位址。

## 安全邊界

- 優先透過 VPN、固定出口 IP 或臨時連接埠映射存取，不建議長期向整個公網開放。
- 開啟通訊協定映射的 `要求驗證`；測試完成且不再需要時，請關閉功能或刪除該規則。
- `/docs` 只是介面說明頁，不會讓危險的寫入操作變得安全。Swagger UI 中的 `Try it out` 會對目前 Instance 發出真實 Request。
- `/docs/json` 會暴露管理介面清單，也應視為管理面的一部分。
- 修改前先匯出備份；憑證、WAF、DDNS、映射與維護類寫入介面應先在非正式環境驗證。

- [TCP／UDP 通訊協定映射](/zh-tw/guide/stream-mappings)
- [身分驗證、工作階段與服務範圍](/zh-tw/guide/auth)
- [IP 允許清單](/zh-tw/guide/whitelist)
- [備份、還原與資料清理](/zh-tw/guide/backup-and-restore)
