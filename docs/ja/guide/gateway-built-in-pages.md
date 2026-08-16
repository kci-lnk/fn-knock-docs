---
lang: ja-JP
title: "ゲートウェイ内蔵ページ"
sourceLocale: zh-CN
translationStatus: translated
translationSourceHash: 2a965da8ae338020a10c85ef93b02e978cf6541fa3e850aeb7cfb0458bdf315f
---

# ゲートウェイ内蔵ページ

内蔵ページにマッピングは不要です。fn-knock ゲートウェイへ解決・転送される任意のサブドメインに、内蔵パスを付けて開けます。

```text
https://nas.example.com/__select__
https://nas.example.com/__wol__
```

パスは完全一致が必要です。`/__select__/` と `/__wol__/` は内蔵ページではありません。サブドメインは実際にゲートウェイへ到達し、証明書、CDN、リバースプロキシ、トンネルがドメインと `Host` を正しく処理する必要があります。

## アプリ選択ページ：`/__select__`

`https://ゲートウェイに接続された任意のサブドメイン/__select__` を開くと、アプリ選択ページが表示されます。未サインインの場合は先に認証され、サインイン後は現在の認証情報でアクセスできるサービスだけが表示されます。

![アプリ選択ページ](/images/gateway-built-in-pages/service-selection.webp)

カスタムサービススコープでは、`認証設定 → 権限` で「内蔵選択ページ」を選択します。このページを開いても未許可サービスの権限は得られません。

## Wake-on-LAN：`/__wol__`

`https://ゲートウェイに接続された任意のサブドメイン/__wol__` を開くと、有効なデバイスを確認して起動要求を送れます。

![Wake-on-LAN ページ](/images/gateway-built-in-pages/wake-on-lan-mobile.png)

次のすべてが必要です。

1. `システム設定 → 機能 → Wake-on-LAN` で WOL を有効にする。
2. `システム設定 → ゲートウェイ → ポータル` で Wake-on-LAN ショートカットを有効にする。
3. サインインする。カスタムサービススコープでは内蔵 Wake-on-LAN ページも選択する。

ショートカットを無効にすると、`/__wol__` は Not Found となり、アップストリームへは転送されません。

## サインイン用フォールバック：`/__auth__/…`

`/__auth__` はすべてのサブドメインで自動的に使われるサインイン入口ではありません。

| 条件 | サインイン先 |
| --- | --- |
| アプリのサブドメインが設定済みルートドメイン配下で、Cookie を共有できる | `auth.example.com` のような共通認証 Host |
| アプリのサブドメインがルートドメイン Cookie の範囲外で、セッションを共有できない | そのサブドメイン自身の `/__auth__/login` |

ルートドメインが `example.com`、認証 Host が `auth.example.com` の場合、`nas.example.com` は共通ログインを使います。`nas.other-example.net` は次の URL で個別にサインインします。

```text
https://nas.other-example.net/__auth__/login
```

このセッションは現在のサブドメインだけに属し、`example.com` 配下のサービスとは共有できません。`/__auth__/…` にはログアウトや OIDC コールバックなどの認証エンドポイントも含まれるため、公開 API として使用しないでください。

- [ゲートウェイポータル](/ja/guide/gateway-portal)
- [Wake-on-LAN（リモート起動）](/ja/guide/wake-on-lan)
- [セッション・送信元 IP 許可・IP 変更](/ja/guide/session-management)
