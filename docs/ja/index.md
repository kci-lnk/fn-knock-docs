---
layout: home

hero:
  name: fn-knock
  text: HomeLab の公開入口をひとつに
  tagline: NAS、写真管理、ダウンロード環境、セルフホストアプリをひとつのゲートウェイに集約します。認証後にサービスへ接続し、公開 IP があれば直接、CGNAT 配下なら FRP や Cloudflare Tunnel を利用できます。
  image:
    src: /logo.png
    alt: fn-knock
  actions:
    - theme: brand
      text: デプロイを始める
      link: /ja/quick-start/deployment-options
    - theme: alt
      text: 公開 IP がある
      link: /ja/quick-start/subdomain-mode
    - theme: alt
      text: CGNAT 配下で使う
      link: /ja/quick-start/reverse-proxy-mode

features:
  - title: ひとつの入口から複数のサービスへ
    details: NAS とセルフホストアプリを別々のサブドメインで公開し、ログイン、TLS 証明書、アクセス方針を一元管理します。
    link: /ja/guide/subdomain-proxy
  - title: サービスへ到達する前に認証
    details: TOTP、パスキー、パスワード、外部 IdP に対応し、セッション、IP 許可リスト、WAF、リクエストログも利用できます。
    link: /ja/guide/auth
  - title: 機器とネットワーク構成に合わせて導入
    details: fnOS、Docker、OpenWrt、Linux、macOS、Synology DSM、Windows に対応し、FRP や Cloudflare Tunnel とも組み合わせられます。
    link: /ja/quick-start/deployment-options
---

## 初回セットアップ

次の順序でまず 1 つのサービスを接続し、経路全体を確認してから他のサービスを追加します。

1. fnOS、Docker、OpenWrt、Linux、macOS、Synology DSM、Windows から環境を選び、[インストール](/ja/quick-start/deployment-options)を完了します。
2. 自宅回線に合わせて、[公開 IP によるサブドメインルーティング](/ja/quick-start/subdomain-mode)または [FRP / Cloudflare Tunnel による NAT 越え](/ja/quick-start/reverse-proxy-mode)を選びます。
3. 認証を設定します。復旧可能な [TOTP 認証アプリ](/ja/guide/totp)を 1 つ残し、必要に応じてパスキーや外部 IdP を追加します。
4. テスト用サービスを 1 つ登録して [TLS 証明書](/ja/guide/ssl)を設定し、モバイル回線からログインとアクセスの全工程を確認します。
5. 安定動作を確認後、[サービス検出](/ja/guide/service-discovery)で対象を追加し、[アプリケーションのバックアップ](/ja/guide/backup-and-restore)をエクスポートします。

::: warning ゲートウェイを迂回する公開経路を残さない
fn-knock が保護できるのは、fn-knock を通過する通信だけです。ルーター、コンテナ基盤、クラウド側のファイアウォールで NAS の管理画面やアプリ本来のポートを公開したままにすると、fn-knock の認証、WAF、リクエストログを迂回します。
:::

## 現在の環境から選ぶ

- **未導入で、使うパッケージが分からない：**[デプロイ方法とアクセス構成](/ja/quick-start/deployment-options)から始めます。
- **公開 IPv4 または IPv6 が利用できる：**ドメインを fn-knock に向け、[公開 IP のサブドメインルーティング](/ja/quick-start/subdomain-mode)を参照します。
- **CGNAT 配下または ISP が着信を遮断している：**FRP または Cloudflare Tunnel を使い、[NAT 越えの構成](/ja/quick-start/reverse-proxy-mode)を参照します。
- **アプリ本来のポート番号で接続する必要がある：**利用環境が[元ポートへの直接アクセス](/ja/quick-start/direct-mode)に対応するか確認します。
- **認証、TLS、リバースプロキシが動作しない：**[よくある質問とトラブルシューティング](/ja/faq)を確認します。
- **アップグレード、移行、再インストールを予定している：**先に[バックアップ・復元・データ消去](/ja/guide/backup-and-restore)を確認します。
