---
lang: ja-JP
title: "Cloudflare Turnstile"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: bff7a9896c9cb9682d294bc7410d6890f4a1cc2a185542614228ec82e42fe628
---

<!-- i18n-source-locale: zh-CN; locale routes and page title are maintained independently. -->

# Cloudflare Turnstile

Turnstile は、fn-knock のログインページで選択できるボット対策認証です。検証するのはログイン前のブラウザーリクエストだけであり、リバースプロキシ、CDN、WAF の代わりにはなりません。

## 設定手順

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログインし、Turnstile ウィジェットを作成します。
2. ウィジェットの種類は通常の表示モードのままで構いません。hostname の一覧に、ログインページへアクセスするときのドメインを追加します。プロトコル、パス、ポートは入力しないでください。
3. ウィジェットの `Site key` と `Secret key` をコピーします。
4. fn-knock の `システム設定 → チャレンジ` を開いて `Turnstile` を選び、2 つのキーを入力して保存します。
5. 実際の外部ネットワークから認証用 Host を開き、ログインを 1 回テストします。

認証用 Host が `auth.example.com` なら、Cloudflare にも `auth.example.com` を登録します。アクセス入口が CDN やトンネルを経由する場合は、`localhost`、コンテナ名、ゲートウェイの LAN 内アドレスではなく、利用者のブラウザーに最終的に表示されるドメインを入力してください。

`Site key` はブラウザーへ送信されます。`Secret key` は、サーバー側から Cloudflare Siteverify API を呼び出すときだけ使われます。Secret key をフロントエンドのコード、公開 Issue、トラブルシューティング用のスクリーンショットへ記載しないでください。

fn-knock は、識別したクライアント IP も Turnstile の検証へ渡します。前段に CDN またはリバースプロキシがある場合は、先にリクエストログのクライアント IP が正しいことを確認してください。

## よくある問題

| 症状 | 最初に確認する項目 |
| --- | --- |
| ウィジェットが表示されない | ウィジェットの hostname、ブラウザーから Cloudflare へ接続できるか、ログインページに新しい設定が読み込まれているか |
| 設定が完了していないと表示される | 2 つのキーが両方とも保存済みか、ログインページが古い設定を使い続けていないか |
| ウィジェット通過後も失敗する | `Secret key` が同じウィジェットのものか、Cloudflare Siteverify へ接続できるか、サーバー時刻、ドメイン、プロキシ経路 |
| トークンが空、またはレスポンスが無効と表示される | ブラウザーがウィジェットの結果を送信しているか、リバースプロキシがリクエストボディを書き換えていないか |
| LAN 内では有効になっていないように見える | プライベートネットワークの送信元にはローカル例外が適用される場合があります。モバイル回線で検証してください |
| IP アドレスだけでアクセスしている | hostname の検証と HTTPS コンテキストは通常 Turnstile に適していません。ドメインを使用してください |

Cloudflare の検証サービスへ到達できない場合、fn-knock はボット対策をスキップせず、その認証を拒否します。Cloudflare への接続が不安定なネットワークでは、外部サービスに依存しない PoW へ戻すことができます。

Cloudflare のウィジェット種別や管理画面は変更されることがあります。各選択肢については、[Turnstile 公式ドキュメント](https://developers.cloudflare.com/turnstile/get-started/)を参照してください。

- [ログイン前のボット対策](/ja/guide/captcha)
- [認証・セッション・サービススコープ](/ja/guide/auth)
