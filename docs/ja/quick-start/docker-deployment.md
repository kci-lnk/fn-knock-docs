---
lang: ja-JP
title: "Docker Compose でデプロイ"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: efd17576c9922af7b163e51a729df52d857eb01e58e179275383dbb565311a9e
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Docker Compose でデプロイ

このページでは、公開済みの `kcilnk/fn-knock` イメージと、リポジトリにある `deploy/docker/compose.remote.yaml` を使用します。このファイルにはローカルビルド用の設定が含まれておらず、サーバーへのデプロイに適しています。ローカルにイメージがなければ、`docker compose up -d` の実行時に自動で取得されます。

fnOS ネイティブ FPK をインストールする場合は、[fnOS ネイティブ FPK のインストールと初期設定](/ja/quick-start/install-and-first-login)を参照してください。

## 前提条件と制約

- Docker Engine と Docker Compose v2 がインストール済みであること。
- ホストの `7991` と `7999` が他のサービスに使われていないか、代わりのポートを用意していること。
- 管理画面へのアクセスは LAN、VPN、または信頼できるリバースプロキシ経由に限定すること。管理ポートをインターネットへ直接ポートフォワーディングしないでください。

標準の Compose 設定でホストへ公開するのは、管理画面とゲートウェイ入口だけです。コンテナ内の管理バックエンド、認証サービス、ゲートウェイ内部の gRPC ポートはホストへ公開しません。

| ホスト側ポート | コンテナ内のサービス | 用途 |
| --- | --- | --- |
| `7991` | 管理画面 | 初回アクセス時に Docker 管理パネルのパスワードを設定 |
| `7999` | ゲートウェイ入口 | ユーザーがマッピング済みサービスへアクセスするときに通る入口 |
| 非公開 | `7998`、`7997`、`7996` | 管理バックエンド、認証サービス、内部 gRPC |

Docker 管理パネルのパスワードと、`fn-knock` で利用者向けに設定する TOTP、ユーザー名とパスワード、パスキーは、別々の認証情報です。

## リリース用 Compose ファイルを取得する

root で（または各コマンドの先頭に `sudo` を付けて）専用の実行ディレクトリを作成し、リリース用 Compose ファイルをデフォルトのファイル名で保存します。

```bash
install -d -m 0750 /opt/fn-knock
cd /opt/fn-knock
curl -fsSLo compose.yaml \
  https://raw.githubusercontent.com/kci-lnk/fn-knock-turborepo/main/deploy/docker/compose.remote.yaml
```

同じディレクトリに `.env` を作成します。次は本番環境向けのデフォルト設定です。`compose.remote.yaml` は、このファイルからイメージ、ポート、ネットワーク範囲を読み取ります。

```dotenv
FN_KNOCK_IMAGE=kcilnk/fn-knock:latest
TZ=Asia/Shanghai
ADMIN_VIEW_PORT=7991
GO_REPROXY_PORT=7999
DOCKER_ADMIN_TRUSTED_PROXY_CIDRS=
```

通常、変更が必要なのは `ADMIN_VIEW_PORT`、`GO_REPROXY_PORT`、タイムゾーンだけです。Compose はデフォルトで IPv4 の `172.30.0.0/16` と IPv6 の `fd42:fb33:7f7a:100::/64` を使用します。既存の Docker ネットワーク、VPN、ホストのルーティングと重複する場合に限り、`.env` に `FN_KNOCK_DOCKER_IPV4_SUBNET` と `FN_KNOCK_DOCKER_IPV6_SUBNET` を追加し、未使用のプライベートアドレス範囲へ変更してください。現在のリリースイメージは SQLite を使用するため、Redis コンテナや `REDIS_*` 環境変数を追加する必要はありません。

管理画面へインターネット側のリバースプロキシを経由してアクセスする必要がある場合は、プロキシノードの送信元 IP または CIDR を `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` に設定し、プロキシから `X-Forwarded-For` または `X-Real-IP` を渡します。信頼済みプロキシのリストに `0.0.0.0/0` を設定しないでください。

## 起動と動作確認

```bash
cd /opt/fn-knock
docker compose config
docker compose up -d
docker compose ps
docker compose logs --tail=100 fn-knock
```

`docker compose config` で完全な設定が出力され、`docker compose ps` で `fn-knock` が稼働中になっていることを確認します。管理サービスのヘルスチェックはホスト上で実行できます。

```bash
set -a
. ./.env
set +a
curl -fsS "http://127.0.0.1:${ADMIN_VIEW_PORT}/api/admin/healthz"
```

続いて、LAN 内から次の URL を開きます。

```text
http://<ホストのLAN内アドレス>:<ADMIN_VIEW_PORT>/
```

`<ADMIN_VIEW_PORT>` は `.env` で指定した実際の管理ポートで、デフォルトは `7991` です。画面の案内に従って Docker 管理パネルのパスワードを設定し、`fn-knock` の管理画面で動作モード、認証、マッピングを設定します。外部向けサービスのトラフィックは、`.env` の `GO_REPROXY_PORT` で指定したゲートウェイポートへ送ります。デフォルトは `7999` です。マッピングを設定したら、ホスト上の `127.0.0.1` だけで済ませず、モバイル回線など実際の外部ネットワークから確認してください。

## データ、バックアップ、復旧手段

Compose は 2 つの永続ボリュームを作成します。

| ボリューム | 内容 |
| --- | --- |
| `fn_knock_gateway` | ゲートウェイ設定と SQLite データベース |
| `fn_knock_data` | シークレット、バックアップ、FRP / Cloudflared などの実行データ |

コンテナを作り直してもこの 2 つのボリュームは消えませんが、ボリューム自体を削除するとデータも失われます。更新や移行の前にアプリのバックアップを書き出し、両方のボリュームをホスト側のバックアップ対象にも含めてください。認証情報や秘密鍵が含まれる可能性があるため、バックアップファイルを外部から読み取れるディレクトリに置かないでください。

`.knock` アーカイブとボリュームのバックアップは用途が異なります。前者は移行可能なアプリ設定の復元に使い、後者は SQLite、ダウンロード済みリソース、コンテナの実行データをそのまま保持します。アーカイブの内容、バージョン上の制約、復元後の確認項目は[バックアップ・復元・データ消去](/ja/guide/backup-and-restore)を参照してください。

利用者のログイン認証情報ではなく Docker 管理パネルのパスワードを忘れた場合は、実行ディレクトリで次のコマンドを実行します。

```bash
docker compose exec fn-knock \
  fn-knock-reset-panel-password
```

### 旧 Redis から移行する

この手順は、旧 Compose 構成に Redis が残っており、そのデータを引き継いでアップグレードする場合だけ必要です。新規インストールでは Redis を追加せず、この移行も実行しないでください。

最初に、旧 Redis と 2 つの永続ボリュームをバックアップします。旧 Redis サービスと現在の `fn-knock` コンテナが同じ Compose ネットワークに残っていることを確認してから、次のコマンドを実行します。

```bash
docker compose exec \
  -e FN_KNOCK_LEGACY_REDIS_URL=redis://redis:6379/ \
  fn-knock /opt/fn-knock/bin/server-admin-rs migrate-redis-to-sqlite
```

コマンドが成功すると、古いデータが再び読み込まれないよう Redis 内の `fn_knock:*` キーが削除されます。そのため、必ず先にバックアップを取り、Redis を外す、または現在の Compose 構成へ切り替える前に、管理画面と SQLite のデータがどちらも正常であることを確認してください。既存の SQLite データを上書きする意思が明確な場合にだけ `--force` を追加します。

## Docker 版の機能制限

| 機能 | Docker Compose での扱い |
| --- | --- |
| アプリ内 FPK 更新 | 非対応。Compose でイメージを取得し、コンテナを再作成します |
| 直接接続モード、ホストのファイアウォール管理、スマート接続 | 利用不可。Docker コンテナからホストのネットワークポリシーを安全に引き継ぐことはできません |
| Web ターミナル、SSH セキュリティ | 利用不可。ホストのターミナルや SSH ログに依存する機能です |
| 自動 HTTPS | 標準 Compose ではホストの `80` 番ポートを公開しません。前段のリバースプロキシと証明書を使うか、ポートと証明書を手動で設計します |

これらの制限があっても、サブドメインモードやリバースプロキシモードでゲートウェイを利用できます。Docker 環境では、ホストのファイアウォールによる動的なポート開放を必要としないモードを優先してください。

## リリースイメージを更新する

`latest` を使用している場合：

```bash
cd /opt/fn-knock
docker compose pull
docker compose up -d
docker compose ps
```

`.env` でバージョンタグを固定している場合は、先に `FN_KNOCK_IMAGE` を更新先のバージョンへ変更してから、同じコマンドを実行します。更新後は、管理画面、ゲートウェイ入口、証明書、使用中のトンネルを確認してください。インターネット側からの確認は、必ず実際の外部ネットワークから行います。

次に読むページ：

- [ポート・入口・アクセス経路](/ja/quick-start/ports-and-entrypoints)
- [アクセス構成を選ぶ](/ja/quick-start/run-modes)
- [バックアップ・復元・データ消去](/ja/guide/backup-and-restore)
- [ダッシュボードとシステム更新](/ja/guide/dashboard-and-update)
