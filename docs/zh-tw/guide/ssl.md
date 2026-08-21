---
lang: zh-TW
title: "TLS 憑證與 HTTPS"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: cddb69852f11453dc5b08108ba213d554c21116f5bc38075becf1cb2b341bb86
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# TLS 憑證與 HTTPS

HTTPS 是 Passkey、OIDC Callback 與大多數公網服務的基礎。憑證必須涵蓋訪客實際使用的身分驗證 Host 與服務 Host；若憑證只簽給內部 IP 或舊網域，透過閘道存取時仍會出現瀏覽器警告或登入失敗。

## 頁面結構與憑證來源

`SSL / HTTPS` 分為三個分頁：

| 分頁 | 管理內容 |
| --- | --- |
| `憑證設定` | 目前 HTTPS 狀態、閘道部署方式、手動上傳與憑證庫 |
| `自簽憑證` | 本機根 CA，以及由該 CA 簽發的網域／IP Server Certificate |
| `ACME 憑證`／`DNS-01 憑證` | 多筆申請項目、簽發、續期、Log 與憑證庫關聯 |

| 來源 | 適用情境 | 注意事項 |
| --- | --- | --- |
| 上傳既有憑證 | 憑證已由 CDN、管理面板或其他工具簽發 | 同時儲存憑證鏈與私密金鑰，並記錄由哪一方負責續期 |
| 自簽憑證 | 區域網路測試或暫時驗證 | 用戶端必須手動信任，不適合一般公網存取 |
| ACME | 有可驗證的網域，且希望自動續期 | 目前申請流程使用 DNS-01，必須保護 DNS API 憑據 |

## 憑證庫與手動上傳

上傳區支援直接貼上 PEM 憑證與私密金鑰；具備分享資料夾功能的平台，也可從分享檔案讀取。憑證與私密金鑰必須成對，憑證鏈應包含 Server Certificate 與必要的 Intermediate Certificate。

儲存時有兩種動作：

| 動作 | 結果 |
| --- | --- |
| `只儲存至憑證庫` | 驗證並寫入憑證庫，不變更目前對外憑證 |
| `儲存並啟用` | 寫入憑證庫，設為目前的有效／預設 Fallback 憑證，並立即同步閘道 |

憑證庫會顯示來源、涵蓋網域、有效期限、更新時間與 Host 涵蓋狀態。刪除正在使用的憑證會同時停用 HTTPS；`清除憑證庫` 會刪除所有憑證、清除閘道已收到的憑證集合，並停用 HTTPS。若只想暫時停用 HTTPS，請使用狀態卡中的 `停用 HTTPS`，憑證仍會保留在憑證庫中。

## 單一有效憑證與多憑證 SNI

憑證庫可保留多張憑證，`部署方式與閘道下發` 會決定閘道實際收到多少張：

| 部署方式 | 閘道行為 | 適用情境 |
| --- | --- | --- |
| `單一有效憑證` | 只下發目前的有效憑證，所有網域都回傳同一張 | 一張 Wildcard 或 SAN 憑證涵蓋所有 Host |
| `多憑證 SNI` | 下發整個憑證集合，依 TLS SNI 替網域選擇憑證 | 不同父網域或不同憑證來源共用同一個閘道 |

多憑證 SNI 仍需要一張預設／Fallback 憑證。用戶端未傳送 SNI、存取未知 Host，或找不到相符憑證時，閘道會回傳預設憑證。切換憑證部署方式後，請檢查頁面顯示的「閘道目前已接收的憑證集合」；若已儲存模式與 Runtime 模式不一致，或出現同步錯誤，不要只依憑證庫內容判斷是否已生效。

子網域情境應涵蓋身分驗證 Host 與所有對外服務 Host。Wildcard `*.example.com` 只涵蓋一層子網域，不涵蓋根網域 `example.com`，也不涵蓋 `a.b.example.com`。頁面的 Host 涵蓋分析會搭配目前映射列出缺少的項目。

## 接收外部工具推送的憑證

`憑證設定 → 接收外部憑證` 可將憑證申請與續期交給 Certd、acme.sh、lego 或 Certbot，再由這些工具把完整憑證鏈與私密金鑰推送到 fn-knock。fn-knock 不會透過此入口向 CA 申請憑證；它負責驗證權限、校驗憑證、寫入憑證庫，並在需要時更新閘道。

此方式適合以下情境：

- 已使用 Certd 集中管理多個網域、VPS、NAS 或 CDN 的憑證；
- 希望保留既有 acme.sh、lego 或 Certbot 續期工作，不在 fn-knock 重複儲存 DNS API 憑據；
- 一張憑證簽發後必須分發至多台 fn-knock 執行個體；
- fn-knock 所在主機無法直接完成 DNS-01，但可以接收內部網路的憑證推送。

### 運作模型

一次完整部署依下列順序執行：

1. 外部工具向 CA 申請或續期憑證。
2. 簽發成功後，Webhook 或 deploy hook 將 `fullchain` 與私密金鑰送至綁定專用位址。
3. fn-knock 使用該綁定的 Bearer Token 驗證權限，並檢查請求大小、PEM、完整憑證鏈、有效期限，以及憑證與私密金鑰是否相符。
4. 憑證寫入綁定對應的固定槽位 `external_<binding_id>`。之後續期始終取代同一筆記錄，不會每次新增一張憑證。
5. 若該憑證目前正在使用，fn-knock 會保留其有效／預設角色並立即更新閘道；若不是目前憑證，則不會取代既有預設憑證。多憑證 SNI 模式會重新同步整個憑證集合。
6. 閘道下發成功後，入口會顯示最近接收時間、憑證網域與有效期限。下發失敗時，請求回傳非 2xx，fn-knock 會嘗試還原舊設定，外部工具應將本次部署標記為失敗並依其策略重試。

若 fn-knock 尚無任何目前憑證，第一張透過外部入口成功推送的憑證會自動設為目前憑證並下發閘道。若已有目前憑證，新入口第一次收到的憑證預設只加入憑證庫；需要取代對外預設憑證時，再從憑證庫手動啟用。

| 工具 | fn-knock 產生的設定 | 呼叫時機 |
| --- | --- | --- |
| Certd | `PUT` Webhook 位址、Header、JSON 範本與成功標誌 | 在 Certd 憑證 Pipeline 中加入「Webhook 方式部署憑證」步驟 |
| acme.sh | 包含位址與 Token 的 deploy hook Script | 簽發後執行 `--deploy-hook fnknock` |
| lego | 相容 lego v5 deploy hook 與 v4 renew hook 的 Script | 由續期命令或 `.lego.yaml` 呼叫 |
| Certbot | 讀取 `RENEWED_LINEAGE` 的 deploy hook Script | 放入 renewal hook 目錄，或由 `certbot renew --deploy-hook` 呼叫 |

### 建立憑證接收入口

1. 開啟 `SSL 憑證 → 憑證設定`，展開 `接收外部憑證`。
2. 在「憑證工具」選擇 Certd、acme.sh、lego 或 Certbot。
3. 輸入可區分憑證或目標節點的入口名稱，例如 `Certd example.com` 或 `Certbot gateway-01`。
4. 按下 `建立接收入口`。
5. 立即複製頁面產生的全部設定。Token 只會在建立入口或重新產生 Token 後顯示一次；關閉設定區後無法再次讀取原 Token。

一個入口對應一個固定憑證槽位與一個獨立 Token。不要讓多張不相關憑證共用同一入口，否則後一次推送會取代前一次憑證。多台 fn-knock 執行個體也不應共用 Token；請在每台執行個體分別建立入口。

### 選擇公網、區域網路或本機入口

推送入口提供：經 HTTPS 驗證 Host 的公網位址、經明確允許 RFC1918 位址和閘道連接埠的區域網路 HTTPS，以及同機工具使用的回環相容位址。異機或雲端優先使用 `/__certificates__/<BINDING_ID>` 公網入口，不必公開管理連接埠。LAN 入口需要非回環監聽與默認憑證，最多允許 16 個 IPv4；IP 與默認憑證名稱不符時，只能對所選 LAN 設定使用 `-k`，不能套用到公網。

所有入口共用綁定 Token 與驗證。Token 可推送任意 SAN 並接管相同 SAN 的既有憑證，應視為憑證管理員憑證，外洩後立即輪換。

### 本機相容入口與 `BACKEND_PORT`

頁面產生的預設推送位址如下：

```text
http://127.0.0.1:7998/api/integrations/certificates/<BINDING_ID>
```

連接埠來自 fn-knock Runtime 的 `BACKEND_PORT`，`7998` 只是預設值。管理後端預設只監聽 `127.0.0.1` 與 `::1`，因此此位址只適用於憑證工具與 fn-knock 位於同一台主機或同一 Network Namespace 的情況。

此相容位址只供同一主機或 Network Namespace 使用；宿主機 Loopback 不會指向隔離 Container。其他裝置請使用公網驗證 Host 或明確啟用的 LAN 入口，不要公開 `BACKEND_PORT`。Token 不得寫入 URL、Query String、Access Log 或 Script Debug 輸出。

### 在 Certd 中設定 Webhook

建立 Certd 類型的入口後，將 fn-knock 顯示的欄位複製到 Certd 對應的憑證 Pipeline：

1. 確認 Pipeline 已有成功輸出網域憑證的申請工作。
2. 在申請工作後加入 `Webhook 方式部署憑證` 步驟。
3. 「網域憑證」選擇前置申請工作輸出的憑證，不要選到另一張無關憑證。
4. 依下表填寫部署參數，再儲存 Pipeline。

| Certd 欄位 | 填寫值 | 說明 |
| --- | --- | --- |
| 工作名稱 | `推送憑證到 fn-knock` | 可加入目標節點名稱 |
| Webhook 位址 | fn-knock 顯示的推送位址 | 依工具位置選擇公網 HTTPS、LAN HTTPS 或本機回環入口 |
| 請求方式 | `PUT` | 不要改成 POST |
| ContentType | `application/json` | 確保 Certd 以 JSON 傳送 |
| Headers | `Authorization=Bearer fnk_cert_<YOUR_TOKEN>` | Certd 此欄位使用 `key=value` 格式；完整 Token 只能從 fn-knock 頁面複製 |
| 訊息 Body 範本 | `{"cert":"${crt}","key":"${key}"}` | `${crt}` 是完整憑證內容，`${key}` 是私密金鑰 |
| 忽略憑證校驗 | 通常關閉 | 使用 HTTP 時沒有 TLS 憑證需要校驗；使用 HTTPS 反代時應優先修復反代憑證鏈 |
| 成功判定 | `"success":true` | Response 同時必須是 2xx；非 2xx 應視為失敗 |

![Certd Webhook 部署憑證到 fn-knock 的欄位設定](/images/ssl/certd-webhook-deployment.png)

圖中的 `<BINDING_ID>` 與 `fnk_cert_<YOUR_TOKEN>` 是文件 Placeholder，不能原樣使用。實際值必須從剛建立或剛輪替的入口複製。Header 是 `Authorization=Bearer ...`，不是 HTTP 文件常見的冒號寫法 `Authorization: Bearer ...`，因為 Certd 此輸入框要求每行使用 `key=value`。

儲存後手動執行一次 Certd Pipeline。只執行 Webhook 步驟前，請確認它能讀取前置工作的憑證輸出。部署成功時 Certd 會顯示步驟成功，fn-knock 回傳包含 `"success":true` 的 JSON，並更新入口的最近接收狀態。

### 使用 acme.sh、lego 或 Certbot

這三種工具不需要手動組合 JSON。選擇對應工具並建立入口後，fn-knock 會產生已內嵌推送位址與 Token 的 Script；Script 使用 `jq` 安全組合含 PEM 換行的 JSON，並用 `curl` 傳送請求。Script 檔案必須限制權限，也不應把內容印到 CI Log。

#### acme.sh

1. 將產生的 Script 儲存為 `~/.acme.sh/deploy/fnknock.sh`。
2. 執行 `chmod 700 ~/.acme.sh/deploy/fnknock.sh`。
3. 憑證簽發成功後執行：

```bash
~/.acme.sh/acme.sh --deploy -d example.com --deploy-hook fnknock
```

Script 使用 acme.sh deploy hook 傳入的私密金鑰與 fullchain 參數。Wildcard 憑證應使用該憑證在 acme.sh 中的主網域執行部署；`--deploy` 是部署既有簽發結果，不是重新簽發命令。

#### lego

1. 將產生的 Script 儲存至固定路徑，並執行 `chmod 700 /path/to/fn-knock-lego-hook.sh`。
2. lego v5 使用：

```bash
lego --deploy-hook=/path/to/fn-knock-lego-hook.sh renew
```

也可在 `.lego.yaml` 的 `hooks.deploy.command` 設定。仍使用 lego v4 時，改用 `--renew-hook=/path/to/fn-knock-lego-hook.sh`。fn-knock 產生的 Script 同時辨識 v5 的 `LEGO_HOOK_*` 與 v4 相容環境變數。

#### Certbot

1. 將產生的 Script 儲存為 `/etc/letsencrypt/renewal-hooks/deploy/fn-knock`。
2. 執行 `chmod 700 /etc/letsencrypt/renewal-hooks/deploy/fn-knock`。
3. 執行一次演練或指定 Hook：

```bash
certbot renew --deploy-hook /etc/letsencrypt/renewal-hooks/deploy/fn-knock
```

Script 從 Certbot 的 `RENEWED_LINEAGE` 讀取 `fullchain.pem` 與 `privkey.pem`。deploy hook 只會在成功續期後執行；若只是驗證 Script，請使用 Certbot 提供的測試方式，並確認測試不會將 Staging 憑證當成正式憑證推送。

### 第一次推送、續期與部署角色

| 推送前狀態 | fn-knock 行為 |
| --- | --- |
| 沒有目前憑證 | 建立固定外部憑證記錄，自動設為目前憑證並同步閘道 |
| 已有其他目前憑證，處於單一有效憑證模式 | 新憑證加入憑證庫，但不變更目前對外憑證 |
| 此入口的憑證已是目前憑證 | 原地取代並保留目前憑證角色，接著更新閘道 |
| 多憑證 SNI 模式 | 原地取代該入口憑證並重新同步整個憑證集合；原預設項目保持不變 |
| 重複推送完全相同的憑證與私密金鑰 | Idempotent 成功，不重複寫入憑證庫，也不觸發無意義的閘道重新載入 |
| 推送憑證的到期時間早於槽位中的既有憑證 | 回傳 `409 Conflict`，避免舊憑證意外回復目前憑證 |

系統會校驗憑證鏈順序、簽章關係、中間憑證的 CA／Key Usage、鏈中每張憑證的生效與到期時間，以及 Leaf Certificate 與私密金鑰是否相符。只上傳 Leaf Certificate 而缺少必要 Intermediate Certificate、憑證鏈順序錯誤、憑證尚未生效、已過期或金鑰不相符都會遭拒絕。Request Body 上限為 1 MiB。

憑證來源記錄為「外部推送」，並保留 `source_provider` 以區分 Certd、acme.sh、lego 與 Certbot。狀態與 Log 只記錄綁定、結果、憑證 Fingerprint、網域及有效期限，不應記錄 PEM 私密金鑰或明文 Token。

### 驗證是否成功

推送後依下列順序檢查：

1. 外部工具的部署工作成功，而不只是憑證申請完成。
2. fn-knock 入口顯示 `接收中` 與 `最近接收成功`，並顯示正確網域、最近接收時間及憑證到期時間。
3. 憑證庫只有一筆與該入口關聯的外部憑證記錄；再次續期後記錄數量不增加。
4. 若該憑證應對外生效，確認它是目前／預設憑證，或已進入多憑證 SNI 的閘道憑證集合。
5. 從實際存取鏈路檢查閘道回傳的憑證：

```bash
openssl s_client \
  -connect auth.example.com:443 \
  -servername auth.example.com </dev/null 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

![fn-knock 外部憑證接收入口的成功狀態](/images/ssl/external-certificate-binding-status.png)

「最近接收成功」表示 fn-knock 已接受本次內容；是否已成為公網憑證，仍取決於有效憑證角色、部署模式，以及公網流量是否確實到達此閘道。

### 管理入口與 Token

- `暫停接收`：保留入口與既有憑證，但新的推送會回傳不可用；適合暫時停止自動更新。
- `重新產生 Token`：舊 Token 立即失效，新 Token 只顯示一次。必須同步更新 Certd 或 deploy hook Script；使用舊 Token 的工作會收到 `401`。
- `儲存名稱`：只變更入口顯示名稱，不影響憑證槽位、URL、Token 或已儲存憑證。
- `刪除入口`：撤銷部署位址與 Token，但預設保留已匯入的憑證，避免刪除入口時中斷正在使用的 HTTPS。需要清理憑證時再至憑證庫操作。

Token 只授權向單一綁定憑證槽位部署憑證，不能呼叫 `/api/admin/ssl/*` 管理 API，也不能操作其他綁定。不要把管理 Session Cookie 用於自動部署。

### 多台 fn-knock 執行個體

Certd 集中向多台 VPS 或 NAS 分發時，應在每台 fn-knock 分別建立入口，並在 Certd Pipeline 中為每個執行個體加入獨立部署步驟：

```text
申請／續期憑證
├── 推送至 fn-knock gateway-01（獨立 URL + Token）
├── 推送至 fn-knock gateway-02（獨立 URL + Token）
└── 推送至 CDN 或其他服務
```

這樣單一 Token 外洩、某台節點無法連線或某次閘道同步失敗，不會擴大為所有節點共用憑據。Certd 應分別保留每個部署步驟的結果，不要用單一 Wrapper Script 隱藏部分節點的失敗狀態。

### 外部推送疑難排解

| HTTP 狀態 | 常見原因 | 處理方式 |
| --- | --- | --- |
| `400 Bad Request` | JSON 格式錯誤、PEM 損壞、憑證鏈不完整／順序錯誤、金鑰不相符、憑證尚未生效或已過期 | 確認外部工具傳入 fullchain 與對應私密金鑰；Certd 保持 `${crt}`／`${key}` JSON 範本 |
| `401 Unauthorized` | Token 缺失、複製錯誤、已輪替，或 Certd Header 格式錯誤 | 從 fn-knock 重新產生 Token，並完整更新 `Authorization=Bearer ...` |
| `404 Not Found` | 綁定已刪除、已暫停，或 URL 中的綁定 ID 不存在 | 檢查入口狀態與完整推送路徑；不要重複使用另一執行個體的 URL |
| `409 Conflict` | 新憑證比既有憑證更早到期，或高並行修改導致無法安全提交 | 確認 Pipeline 未推送舊產物；稍後重試，並避免多個工作同時寫入同一入口 |
| `413 Payload Too Large` | JSON Request 超過 1 MiB | 檢查是否誤將 Log、PKCS#12、重複憑證或無關內容加入 PEM |
| `500 Internal Server Error` | 儲存設定或部署狀態失敗 | 查看 fn-knock Runtime Log 與磁碟／設定儲存狀態，外部工具應保留失敗並重試 |
| `502 Bad Gateway` | 憑證校驗成功，但同步閘道失敗；Response 會說明是否已確認還原舊設定 | 先確認目前公網憑證是否仍為舊憑證，再檢查閘道狀態與 fn-knock Log 後重試 |

若 Certd 顯示申請成功，但 fn-knock 持續顯示「等待第一次推送」，代表 Pipeline 未執行部署步驟、Webhook 無法連線，或部署步驟選到錯誤的前置憑證輸出。先從 Certd 工作 Log 確認請求確實送出，再檢查同機 `127.0.0.1:${BACKEND_PORT}` 或異機反向代理鏈路。

## 自簽根 CA

`自簽憑證` 的使用順序：

1. 初始化根憑證並下載根 CA。
2. 在所有需要存取的用戶端或受管裝置中，將根 CA 安裝為受信任的根憑證。
3. 在網域與 IP 清單中加入實際使用的存取名稱。
4. 按下 `一鍵部署`，簽發並安裝 Server Certificate；也可以下載 Server Certificate 自行使用。

Server Certificate 有效期限為 20 年。長期有效不代表可以忽略私密金鑰保護或撤銷計畫。重新產生或清除根 CA，會讓原根 CA 簽發的 Server Certificate 失去信任，因此介面會要求兩次確認；執行前應先準備新根憑證的散布與回復方案。

自簽憑證適合受控的區域網路、測試裝置，或能統一下發根憑證的環境。公網訪客、第三方 OIDC 與不受控的用戶端，通常應使用公開信任的 CA。

## ACME 申請項目

非 Windows 平台第一次使用時，請先在 `系統設定 → ACME` 初始化 `acme.sh`，並視需求選擇預設 CA。切換 CA 只會影響後續申請與自動續期，不會立即取代已簽發或部署的憑證。

每個 ACME 申請項目都會獨立儲存：

- 名稱與一個或多個網域；
- DNS 供應商，以及該項目使用的 API 憑據；
- 自動續期開關；
- 目前憑證、憑證庫關聯與最近工作狀態。

`儲存` 只會修改申請項目；`儲存並申請` 會立即提交簽發工作。簽發成功後，憑證會自動同步至憑證庫，但不一定會成為目前憑證：單一有效憑證模式下可再執行 `設為目前憑證`；多憑證 SNI 模式則應確認它已進入閘道憑證集合。

同一申請項目續期或重新簽發時，系統會原地取代已關聯的憑證庫記錄，並保留原有標籤與有效／預設部署角色，避免重複新增憑證。修改網域後，若簽發工作失敗或遭停止，系統會保留先前可用的簽發結果；新憑證下發至閘道失敗時，系統會嘗試還原並重新下發上一份 SSL 設定。若期間已有更新的並行設定，則會保留並下發較新的設定。工作仍會以失敗結束，必須從 Log 確認系統是已還原上一份設定、保留較新的設定，或連安全設定都未能恢復。

申請項目選單也可查看工作 Log、下載憑證、手動更新至憑證庫、部署、刪除憑證，或刪除申請項目。兩種刪除操作的範圍不同：

| 操作 | 保留內容 |
| --- | --- |
| 刪除憑證 | 保留申請項目設定，移除目前儲存的簽發結果與憑證庫關聯 |
| 刪除申請項目 | 刪除申請設定；既有憑證與關聯也會隨該項目一併清除 |

工作執行中或自動續期時，仍可編輯並儲存申請項目的 DNS 設定；再次申請、部署、刪除等會與目前工作衝突的操作仍會鎖定。工作 Log 會提示 DNS 憑據、DNS API Rate Limit 或 ACME Rate Limit 等排查方向。停止工作會先要求取消並終止由該工作擁有的 Process Group，等 Executor 與 Runtime Lock 都結束後才回報成功。若頁面仍顯示 PID 或停止錯誤，不要立即啟動第二個工作；應先確認舊 Process 已退出。

### 自動續期排程與復原

啟用自動續期的申請項目會在服務啟動後立即檢查，之後預設每 6 小時掃描一次。憑證距離到期不超過 30 天時會進入續期佇列；多個申請項目會依到期時間由近到遠循序處理，避免同時呼叫 DNS API 與 ACME Client。

- 自動掃描與單項簽發工作分別使用具備所有權與心跳的 Runtime Lock，服務內不會同時執行重複續期；已有手動工作執行時，本輪掃描會安全略過。
- 服務重新啟動後，會將在新 Process 中沒有 Executor 的 `queued`／`running` 工作恢復為已停止，清除其殘留 Runtime Lock，再重新掃描；Process 內正在取消的工作仍會保留 Lock，直到原 Executor 完成收尾，避免新舊工作重疊。
- 系統同時辨識 RFC 3339 與既有憑證常見的 OpenSSL UTC 到期時間；無法解析的到期時間會寫入警告並略過，不會誤判為尚未需要續期。
- 每輪完成後會再次核對憑證庫與閘道部署。單一續期失敗不會阻止後續排程掃描，先前可用的憑證與 SSL 設定會依上一節的復原規則保留。
- 自動續期失敗或遭停止後，預設進入 6 小時重試退避，避免每次掃描立即再次呼叫 DNS API 與 CA；編輯該申請項目後，下一輪即可重新嘗試。

頁面沒有獨立的「下次掃描時間」開關；應從申請項目的最近工作狀態、憑證到期時間與 Log 判斷是否成功，而不是反覆點擊手動申請。

## Windows 原生版：DNS-01 憑證

Windows x86_64 版請在 `SSL / HTTPS → DNS-01 憑證` 中申請憑證。安裝套件已內建憑證 Client，不需要初始化或下載 ACME.sh；此流程固定使用 Let's Encrypt，只接受 DNS-01 驗證，不提供 HTTP-01，也無法切換至其他 Certificate Authority。

請在頁面中選擇支援的 DNS 供應商，並以最低必要權限儲存其 API 憑據。目前支援阿里雲 DNS、Baidu Cloud DNS、Cloudflare、DNSPod、騰訊雲 DNSPod、DuckDNS、Dynu、dynv6、GoDaddy、華為雲 DNS 與 Porkbun。Cloudflare 支援 API Token 與 Global API Key 兩種憑據，應優先使用限制於指定 Zone 的 Token。

新申請項目預設啟用自動續期；簽發成功後會進入憑證庫。單一有效憑證模式下，第一次簽發後仍需手動設為目前憑證。Windows 頁面不要求初始化 `acme.sh`，也不提供 CA 切換。

## 飛牛 SSL 憑證庫同步（僅原生 FPK）

飛牛原生 FPK 可在 `系統設定 → 飛牛 → 飛牛 SSL 憑證庫同步` 中，將 fn-knock 憑證庫內容同步至飛牛系統既有的憑證記錄。

同步只會更新網域與 SAN 集合完全相符的既有飛牛憑證；不會新增或刪除飛牛系統中的憑證記錄。因此，請先確認兩邊涵蓋的網域集合一致，再執行單筆或全部同步。若沒有相符項目，請先調整憑證記錄，而不是期待同步功能代為建立。

可視需求手動同步，也可啟用自動同步。自動模式會在本機憑證庫變更後短暫等待並合併作業，再集中同步相符項目，並重新整理一次飛牛服務。若目標憑證同時啟用了飛牛本身的自動續期，後續續期可能覆寫同步結果，應明確指定由哪一側負責續期。

## 建議設定順序

1. 確認最終對外網域與連接埠，不要先用內網 IP 申請憑證。
2. 在 DNS 中確認身分驗證 Host 與服務 Host 的解析已生效。
3. 在 `SSL / HTTPS` 上傳、申請或選擇憑證。
4. 依憑證數量選擇單一有效憑證或多憑證 SNI，並確認閘道已收到預期的憑證集合。
5. 查看憑證涵蓋提示，修正尚未涵蓋的 Host。
6. 從行動網路存取身分驗證 Host 與一個服務 Host，檢查瀏覽器憑證鏈、網域、有效期限與登入流程。

## 自動 HTTPS 的限制

系統中的自動 HTTPS 只處理閘道端的 HTTP 至 HTTPS Redirect，以及啟用已設定的憑證；它不會替你申請網域、開放路由器連接埠或設定 CDN Origin。Docker 與 OpenWrt 環境不提供這個與 Host 相關的開關；若 TLS 終止於外層反向 Proxy，應由外層負責強制 HTTPS。即使 Windows 上顯示此開關，也必須先具備真實 Inbound 路徑與可用的 `80` 連接埠；`7999` 預設 Listen 在所有介面，不代表 Windows 防火牆、路由器／NAT 或電信業者已允許公網存取。

## 疑難排解

- 瀏覽器顯示網域不相符：憑證的 DNS Name 未涵蓋目前 Host，或上游 CDN 連回錯誤的 Origin。
- 憑證已存在於憑證庫，但外網仍回傳舊憑證：檢查它是否已設為目前／預設憑證、部署方式是否正確，以及閘道收到的憑證集合是否已更新。
- 多個網域回傳同一張錯誤憑證：檢查目前是否仍為單一有效憑證模式，或多憑證 SNI 中沒有相符項目而使用 Fallback 憑證。
- 上傳失敗：確認 PEM 內容、私密金鑰配對與憑證鏈順序；不要將 PKCS#12 檔案內容上傳至 PEM 文字欄位。
- ACME 失敗：檢查 DNS Provider 憑據、DNS API Rate Limit 與 TXT Record Propagation。目前申請流程只使用 DNS-01，不要朝 HTTP-01 方向排查。
- ACME 簽發成功但未生效：檢查憑證庫關聯，以及單一有效憑證模式下是否已執行 `設為目前憑證`。
- Cloudflared 使用 `https://localhost:7999` 失敗：該上游 TLS Name 必須與憑證相符；無法相符時，請先改用已驗證的 HTTP Origin 方案，或調整 Tunnel TLS 設定。
- 服務頁面正常，但 Passkey 無法使用：檢查身分驗證 Host 是否透過有效 HTTPS 與正確 RP Domain 存取。

- [DDNS 管理](/zh-tw/guide/ddns)
- [子網域映射](/zh-tw/guide/subdomain-proxy)
- [Cloudflare Tunnel](/zh-tw/guide/cloudflared-tunnel)
- [系統設定與維護](/zh-tw/guide/system)
