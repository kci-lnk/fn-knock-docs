---
lang: ja-JP
title: "Docker Compose でデプロイ"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 5dbe558d2335cf9dd862fa1a6258676286d0409d9d7c3351c3025ae79cd554aa
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Docker Compose でデプロイ

現在のネットワークに適したイメージソースを選び、完全な Compose 設定を使用して、Linux ホストまたは Linux ベースの NAS で fn-knock を実行します。

[元の Docker Hub ページを開く](https://hub.docker.com/r/kcilnk/fn-knock)

## イメージソース

| イメージソース | イメージ | 推奨ネットワーク |
| --- | --- | --- |
| 公式ミラー | `hub.fnknock.cn/kcilnk/fn-knock:latest` | 中国本土のネットワーク。`latest` は 30 分ごとに同期 |
| Docker Hub | `kcilnk/fn-knock:latest` | Docker Hub に安定して接続できるネットワーク |

以下では公式ミラーを使用します。ソースを切り替える場合は、pull コマンドと `.env` の `FN_KNOCK_IMAGE` を対応するアドレスに変更してください。バージョンを固定する場合は、`latest` を公開済みの固定タグに変更します。

## ネットワークモード

| ネットワークモード | 推奨 | 説明 |
| --- | --- | --- |
| HOST ネットワーク | 推奨・既定 | ホストネットワークを直接使用し、実際のインターフェイスと IPv6 を認識できます |
| ブリッジネットワーク | 任意 | 分離されたデュアルスタック bridge とポートマッピングを使用しますが、DDNS がホストのインターフェイスや IPv6 を検出できない場合があります |

DDNS の「インターフェイスから取得」を使用する場合や、ホスト IPv6 に依存する場合は HOST ネットワークを使用してください。ブリッジは、ホストインターフェイスの検出よりもネットワーク分離を優先する場合に選択します。

## 一括インストール

対象 Linux ホストの root ターミナルへ以下のスクリプト全体を貼り付けます。既定では推奨の HOST ネットワークを使用し、完全な Compose 設定を書き込んで fn-knock を起動します。

<!--@include: ../../_shared/docker-quick-install.inc-->

インストール先は `/opt/fn-knock-docker` です。`.env` または `docker-compose.yml` がすでにある場合、スクリプトは上書きせず停止します。

## 完全なインストール手順

### 01 Docker 環境を確認

Linux ホスト、Docker Engine、Docker Compose が必要です。

```bash
docker version
docker compose version
```

以下では HOST ネットワークを使用します。このモードは `ports` やカスタム bridge を宣言せず、サービスはホストポートで直接待ち受けます。

### 02 ディレクトリを準備してイメージを取得

```bash
mkdir -p /opt/fn-knock-docker
cd /opt/fn-knock-docker
docker pull hub.fnknock.cn/kcilnk/fn-knock:latest
```

### 03 `.env` を作成

次の内容を `/opt/fn-knock-docker/.env` に保存します。

<!--@include: ../../_shared/docker-env.inc-->

主な設定：

| 設定 | デフォルト | 説明 |
| --- | --- | --- |
| `FN_KNOCK_IMAGE` | `hub.fnknock.cn/kcilnk/fn-knock:latest` | デフォルトでは `latest`。Docker Hub のイメージまたは固定バージョンタグへ変更可能 |
| `ADMIN_VIEW_PORT` / `GO_REPROXY_PORT` | `7991` / `7999` | 管理パネルと公開ゲートウェイのホスト側ポート |
| `FN_KNOCK_DOCKER_IPV4_SUBNET` | `172.30.0.0/16` | ブリッジモード専用。競合する場合は別のプライベート CIDR に変更 |
| `FN_KNOCK_DOCKER_IPV6_SUBNET` | `fd42:fb33:7f7a:100::/64` | ブリッジモード専用。Docker bridge の IPv6 ULA `/64` |
| `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` | 空 | `7991` が信頼済みリバースプロキシの背後にある場合のみ、プロキシの送信元 IP または CIDR を設定 |
| `DOCKER_DISCOVER_LAN_IP` | 空 | サードパーティー製リバースプロキシがホストの LAN アドレスを自動検出できない場合のみ設定 |

### 04 `docker-compose.yml` を作成

推奨設定は 1 つの `fn-knock` コンテナと HOST ネットワークを使用し、ホストの実インターフェイスと IPv6 に直接アクセスします。

<!--@include: ../../_shared/docker-compose.inc-->

#### 任意：ブリッジネットワークへ切り替える

ブリッジでは DDNS がホストのインターフェイスや IPv6 を検出できない場合があります。「インターフェイスから取得」に依存しないことを確認してから、`.env` を次に置き換えます。

<!--@include: ../../_shared/docker-env-bridge.inc-->

さらに `docker-compose.yml` を次に置き換えます。

<!--@include: ../../_shared/docker-compose-bridge.inc-->

### 05 起動して状態を確認

```bash
docker compose up -d
docker compose ps
docker compose logs -f fn-knock
```

最後のコマンドはログを継続表示します。終了するには `Ctrl+C` を押します。

## 初回アクセスと設定

既定の HOST モードはホストのネットワーク名前空間を直接使用します。管理パネルは `7991`、ゲートウェイは `7999` で待ち受け、その他のサービスは内部またはホスト loopback に留まります。

| ポート | サービス | 公開範囲 | 用途 |
| --- | --- | --- | --- |
| `7991` | 管理パネル | HOST ネットワーク | 初回アクセス時に Docker 管理パネルのパスワードを設定 |
| `7999` | ゲートウェイ / プロキシ入口 | HOST ネットワーク | 外部クライアントがプロキシ対象サービスへアクセスするときに使用 |
| `7998` | Rust バックエンド | ホスト loopback / 内部 | 通常は既定値のまま使用 |
| `7997` | 認証フロントエンド | ホスト loopback / 内部 | 通常は既定値のまま使用 |
| `7996` | Go ゲートウェイ管理 | ホスト loopback / 内部 | 通常は既定値のまま使用 |

1. `http://<ホストIP>:7991` を開き、Docker 管理パネルのパスワードを設定してログインします。
2. 管理パネルでリバースプロキシ、サブドメイン、証明書、認証を設定します。
3. 外部アプリケーションのトラフィックをポート `7999` のゲートウェイへ送ります。
4. `7991` が信頼済みリバースプロキシの背後にある場合は、`.env` で `DOCKER_ADMIN_TRUSTED_PROXY_CIDRS` を設定します。
5. サードパーティー製リバースプロキシがホストの LAN アドレスを自動検出できない場合のみ、`DOCKER_DISCOVER_LAN_IP` を設定します。

## 最新イメージへ更新

`.env` の `latest` を維持したまま、イメージを再取得してコンテナを再作成します。永続ボリュームは削除されません。

```bash
cd /opt/fn-knock-docker
docker compose pull
docker compose up -d
docker compose ps
```

## Watchtower で自動更新

`.env` で `latest` を使用している場合は、同じ Docker ホストで Watchtower を実行できます。デフォルトでは、実行中のすべてのコンテナを 24 時間ごとに確認します。イメージタグのダイジェストが変わると、新しいイメージを取得し、既存の設定でコンテナを再作成します。fn-knock のマウント済みボリュームは保持されますが、更新時には短時間の再起動が発生します。固定バージョンタグから別のタグへ自動的に移行することはありません。

```bash
docker run -d \
  --name watchtower \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  nickfedor/watchtower
```

Watchtower が起動していることを確認し、チェック履歴を表示します。

```bash
docker ps --filter name=watchtower
docker logs watchtower
```

> この基本設定はホスト上で実行中のすべてのコンテナを管理し、Docker Socket を通じて Docker を管理できる強い権限を取得します。信頼できるホストでのみ使用し、有効にする前に fn-knock をバックアップしてください。自動更新してはいけないコンテナがある場合は、[Watchtower 公式ドキュメント](https://watchtower.nickfedor.com/)に従って、コンテナ名、ラベル、または Scope で更新対象を制限してください。

## 管理パネルのパスワードをリセット

パスワードを忘れた場合は Docker ホストへログインし、次を実行します。

```bash
cd /opt/fn-knock-docker && docker compose exec -T fn-knock fn-knock-reset-panel-password
```

次にポート `7991` へアクセスすると、初回パスワード設定に戻ります。このコマンドが消去するのは、管理パネルのパスワード、ログインセッション、ログイン失敗時のバックオフ状態だけです。アプリケーション設定、プロキシルール、証明書、許可リスト、ログ、データボリュームは削除されません。

## 関連ドキュメント

- [ポート、入口、アクセスパス](/ja/quick-start/ports-and-entrypoints)
- [アクセス方式を選ぶ](/ja/quick-start/run-modes)
- [バックアップ、復元、データ削除](/ja/guide/backup-and-restore)
- [ダッシュボードとシステム更新](/ja/guide/dashboard-and-update)
