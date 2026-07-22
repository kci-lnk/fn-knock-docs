---
lang: ja-JP
title: "Docker Compose でデプロイ"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2b632872a143dace421c0e0a4ff8040e19c4dded02f605780371ba03bf26ae2a
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Docker Compose でデプロイ

このページでは、fn-knock の公式イメージミラーと、リポジトリにある `deploy/docker/compose.remote.yaml` を使用します。このファイルにはローカルビルド設定が含まれず、サーバーへのデプロイに適しています。ローカルにイメージがなければ、`docker compose up -d` の実行時に自動で取得されます。

fnOS ネイティブ FPK を使用する場合は、[fnOS ネイティブ FPK のインストールと初期設定](/ja/quick-start/install-and-first-login)を参照してください。

## 前提条件と制約

- Linux ホストに Docker Engine、Docker Compose v2、`curl` がインストールされていること。
- ホストで IPv6 が有効で、`/proc/net/if_inet6` に少なくとも 1 つのグローバル IPv6 インターフェイスがあること。この procfs 仮想ファイルの表示サイズは常に `0` なので、内容を読み取って判定します。
- ホストの `7991` と `7999` が空いているか、代わりのポートを用意していること。
- 管理画面へのアクセスは LAN、VPN、または信頼できるリバースプロキシ経由に限定し、インターネットへ直接ポートフォワーディングしないこと。

デプロイは分離された Docker bridge を使用し、`network_mode: host` は使用しません。Compose は bridge で IPv6 を有効にし、ホストの IPv6 インターフェイス表だけをマウントするため、DDNS の「インターフェイスから取得」で実際のホスト IPv6 インターフェイスを選択できます。

| ホスト側ポート | コンテナ内のサービス | 用途 |
| --- | --- | --- |
| `7991` | 管理画面 | 初回アクセス時に Docker 管理パネルのパスワードを設定 |
| `7999` | ゲートウェイ入口 | マッピング済みサービスへアクセスするための入口 |
| 非公開 | `7998`、`7997`、`7996` | 管理バックエンド、認証サービス、内部 gRPC |

Docker 管理パネルのパスワードと、利用者向けに設定する TOTP、ユーザー名とパスワード、Passkey は別の認証情報です。

## イメージソースを選択

| イメージソース | `FN_KNOCK_IMAGE` | 推奨ネットワーク |
| --- | --- | --- |
| 公式ミラー | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 中国本土のネットワーク。`latest` は 30 分ごとに同期 |
| Docker Hub | `kcilnk/fn-knock:latest` | Docker Hub に安定して接続できるネットワーク |

以下では公式ミラーを使用します。バージョンを固定する場合は、`latest` を公開済みの固定タグへ変更してください。

## 一括インストール

対象ホストの root ターミナルへ以下のスクリプト全体を貼り付けます。Docker と IPv6 を確認し、`/opt/fn-knock-docker` を作成して設定とイメージを準備し、サービスを起動します。`.env` または `docker-compose.yml` がすでにある場合は上書きせず停止します。

```bash
sh <<'FN_KNOCK_INSTALL'
set -eu

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this installer in a root terminal." >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "Docker is not installed." >&2; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose is not available." >&2; exit 1; }
if [ ! -r /proc/net/if_inet6 ] || ! awk '$4 == "00" { found=1 } END { exit !found }' /proc/net/if_inet6; then
  echo "No usable global IPv6 interface was found on this host." >&2
  exit 1
fi

install_dir=/opt/fn-knock-docker
mkdir -p "$install_dir"
cd "$install_dir"

if [ -e .env ] || [ -e docker-compose.yml ]; then
  echo "Existing .env or docker-compose.yml found; installation stopped." >&2
  exit 1
fi

cat > .env <<'FN_KNOCK_ENV'
FN_KNOCK_IMAGE=hub.fnknock.cn/kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
BACKEND_PORT=7998
AUTH_PORT=7997
GO_BACKEND_PORT=7996
GO_REPROXY_PORT=7999
FN_KNOCK_DOCKER_IPV4_SUBNET=172.30.0.0/16
FN_KNOCK_DOCKER_IPV6_SUBNET=fd42:fb33:7f7a:100::/64
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
DOCKER_DISCOVER_LAN_IP=
FN_KNOCK_ENV

curl -fsSLo docker-compose.yml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml

docker compose pull
docker compose up -d
docker compose ps
FN_KNOCK_INSTALL
```

インストール後は[起動と確認](#起動と確認)に従ってログ、ヘルス状態、初回アクセスを確認してください。設定を個別に変更する場合は、以下の手動手順を使用します。

## リリース用 Compose を取得

```bash
install -d -m 0750 /opt/fn-knock-docker
cd /opt/fn-knock-docker
curl -fsSLo docker-compose.yml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml
```

同じディレクトリに `.env` を作成します。

```dotenv
FN_KNOCK_IMAGE=hub.fnknock.cn/kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
BACKEND_PORT=7998
AUTH_PORT=7997
GO_BACKEND_PORT=7996
GO_REPROXY_PORT=7999
FN_KNOCK_DOCKER_IPV4_SUBNET=172.30.0.0/16
FN_KNOCK_DOCKER_IPV6_SUBNET=fd42:fb33:7f7a:100::/64
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
DOCKER_DISCOVER_LAN_IP=
```

通常はイメージ、公開ポート、タイムゾーンだけを変更します。内部ポートは既定値のままにしてください。IPv4 `172.30.0.0/16` または IPv6 `fd42:fb33:7f7a:100::/64` が既存ネットワークと重複する場合だけ、未使用のプライベート範囲へ変更します。現在のリリースは SQLite を使用するため、Redis は追加しません。

ダウンロードした Compose にある次の設定は削除しないでください。ホストネットワーク全体は共有せず、IPv6 インターフェイス表だけを読み取り専用で公開します。

```yaml
services:
  fn-knock:
    environment:
      DDNS_HOST_IF_INET6_PATH: /host/proc/net/if_inet6
    volumes:
      - type: bind
        source: /proc/net/if_inet6
        target: /host/proc/net/if_inet6
        read_only: true
    networks:
      - fn_knock_net

networks:
  fn_knock_net:
    enable_ipv6: true
```

IPv6 の確認に `test -s /proc/net/if_inet6` を使わないでください。procfs はアドレスがあってもサイズを `0` と報告します。一括インストーラーは内容を読み、scope `00` のグローバル IPv6 を自動判定します。手動では `awk '$4 == "00" { print; found=1 } END { exit !found }' /proc/net/if_inet6` を実行します。

管理画面を公開リバースプロキシの背後に置く場合は、そのプロキシの送信元 IP または CIDR だけを `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` に設定します。`0.0.0.0/0` は設定しないでください。`DOCKER_DISCOVER_LAN_IP` は、自動検出できない場合だけ使用します。

## 起動と確認

```bash
cd /opt/fn-knock-docker
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 fn-knock
```

ヘルスチェックを実行します。

```bash
set -a
. ./.env
set +a
curl -fsS "http://127.0.0.1:${ADMIN_VIEW_PORT}/api/admin/healthz"
```

LAN から `http://<ホストのLANアドレス>:<ADMIN_VIEW_PORT>/` を開き、Docker 管理パネルのパスワード、動作モード、認証、マッピングを設定します。外部トラフィックは `GO_REPROXY_PORT`（既定値 `7999`）へ送ります。設定後はモバイル回線など実際の外部ネットワークから確認してください。

## データ、バックアップ、復旧

Compose は `fn_knock_gateway`（ゲートウェイ設定と SQLite）と `fn_knock_data`（シークレット、バックアップ、FRP / Cloudflared リソース）の 2 つの永続ボリュームを作成します。コンテナを再作成しても保持されますが、ボリュームを削除するとデータも失われます。詳細は[バックアップ・復元・データ消去](/ja/guide/backup-and-restore)を参照してください。

Docker 管理パネルのパスワードを忘れた場合は、次を実行します。

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

このコマンドは管理パネルのパスワード、ログインセッション、ログイン失敗のバックオフ状態だけを消去します。アプリ設定、プロキシルール、証明書、許可リスト、ログ、データボリュームは削除しません。

### 旧 Redis から移行

旧 Compose の Redis データを維持する必要がある場合だけ、バックアップ後に次を実行します。

```bash
docker compose exec \
  -e FN_KNOCK_LEGACY_REDIS_URL=redis://redis:6379/ \
  fn-knock /opt/fn-knock/bin/server-admin-rs migrate-redis-to-sqlite
```

成功すると Redis の `fn_knock:*` キーが削除されるため、事前バックアップは必須です。既存 SQLite を意図的に上書きする場合だけ `--force` を追加します。

## Docker 版の機能制限

アプリ内 FPK 更新、ホストファイアウォール管理、Web ターミナル、SSH セキュリティは利用できません。自動 HTTPS が必要な場合は、前段のリバースプロキシと証明書を使用するか、必要なポートを手動で設計してください。

## リリースイメージを更新

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

更新後は管理画面、ゲートウェイ入口、証明書、トンネルを確認し、公開経路は実際の外部ネットワークからテストしてください。

次に読むページ：

- [ポート・入口・アクセス経路](/ja/quick-start/ports-and-entrypoints)
- [アクセス構成を選ぶ](/ja/quick-start/run-modes)
- [バックアップ・復元・データ消去](/ja/guide/backup-and-restore)
- [ダッシュボードとシステム更新](/ja/guide/dashboard-and-update)
