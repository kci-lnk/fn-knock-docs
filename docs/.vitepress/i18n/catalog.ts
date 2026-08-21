import type { DefaultTheme } from 'vitepress'

export const LOCALE_KEYS = ['root', 'zh-tw', 'en', 'ja', 'ko'] as const

export type LocaleKey = (typeof LOCALE_KEYS)[number]

type LocaleCopy = {
  label: string
  lang: string
  link: string
  title: string
  description: string
  nav: {
    quickStart: string
    tutorials: string
    guide: string
    faq: string
    origin: string
  }
  groups: {
    gettingStarted: string
    deployment: string
    accessPatterns: string
    choosePattern: string
    publicAndTunnels: string
    clientsAndEdge: string
    authAndAccess: string
    routingAndGateway: string
    networkDnsTls: string
    securityObservability: string
    systemOperations: string
    operationsTroubleshooting: string
    commonReferences: string
    productVision: string
  }
  ui: {
    outline: string
    previous: string
    next: string
    sidebar: string
    returnToTop: string
    appearance: string
    lightMode: string
    darkMode: string
    language: string
    skipToContent: string
    lastUpdated: string
    community: string
    notFoundTitle: string
    notFoundQuote: string
    notFoundLink: string
  }
}

export const LOCALES = {
  root: {
    label: '简体中文',
    lang: 'zh-CN',
    link: '/',
    title: 'fn-knock',
    description: '为 NAS、家庭服务器和自托管服务提供统一入口、身份认证与访问控制',
    nav: {
      quickStart: '快速开始',
      tutorials: '接入教程',
      guide: '功能说明',
      faq: '常见问题',
      origin: '初心',
    },
    groups: {
      gettingStarted: '开始使用',
      deployment: '部署方式',
      accessPatterns: '访问方案',
      choosePattern: '选择方案',
      publicAndTunnels: '公网与隧道',
      clientsAndEdge: '客户端与边缘平台',
      authAndAccess: '认证与访问控制',
      routingAndGateway: '路由与网关',
      networkDnsTls: '网络、DNS 与证书',
      securityObservability: '安全与可观测性',
      systemOperations: '系统与运维',
      operationsTroubleshooting: '运维与排障',
      commonReferences: '常用资料',
      productVision: '产品理念',
    },
    ui: {
      outline: '本页导航',
      previous: '上一页',
      next: '下一页',
      sidebar: '文档菜单',
      returnToTop: '回到顶部',
      appearance: '外观切换',
      lightMode: '切换到浅色模式',
      darkMode: '切换到深色模式',
      language: '切换语言',
      skipToContent: '跳到正文',
      lastUpdated: '最后更新',
      community: 'QQ群：1081609274',
      notFoundTitle: '页面不存在',
      notFoundQuote: '这个地址没有对应的文档，可能已移动或尚未发布。',
      notFoundLink: '返回首页',
    },
  },
  'zh-tw': {
    label: '繁體中文（台灣）',
    lang: 'zh-TW',
    link: '/zh-tw/',
    title: 'fn-knock',
    description: '為 NAS、HomeLab 與自架服務提供統一入口、身分驗證與存取控制',
    nav: {
      quickStart: '快速開始',
      tutorials: '串接教學',
      guide: '功能說明',
      faq: '常見問題',
      origin: '開發初衷',
    },
    groups: {
      gettingStarted: '開始使用',
      deployment: '部署方式',
      accessPatterns: '存取方案',
      choosePattern: '選擇方案',
      publicAndTunnels: '公網與隧道',
      clientsAndEdge: '用戶端與邊緣平台',
      authAndAccess: '身分驗證與存取控制',
      routingAndGateway: '路由與閘道',
      networkDnsTls: '網路、DNS 與 TLS 憑證',
      securityObservability: '資安與可觀測性',
      systemOperations: '系統與維運',
      operationsTroubleshooting: '維運與疑難排解',
      commonReferences: '常用參考',
      productVision: '產品理念',
    },
    ui: {
      outline: '本頁導覽',
      previous: '上一頁',
      next: '下一頁',
      sidebar: '文件選單',
      returnToTop: '回到頂端',
      appearance: '外觀設定',
      lightMode: '切換至淺色模式',
      darkMode: '切換至深色模式',
      language: '切換語言',
      skipToContent: '跳至正文',
      lastUpdated: '最後更新',
      community: 'QQ 群組：1081609274',
      notFoundTitle: '找不到頁面',
      notFoundQuote: '此網址沒有對應文件，內容可能已移動或尚未發布。',
      notFoundLink: '返回首頁',
    },
  },
  en: {
    label: 'English',
    lang: 'en-US',
    link: '/en/',
    title: 'fn-knock',
    description: 'A unified gateway, authentication, and access-control layer for NAS, HomeLab, and self-hosted services',
    nav: {
      quickStart: 'Getting Started',
      tutorials: 'Integration Guides',
      guide: 'Feature Reference',
      faq: 'FAQ',
      origin: 'Why fn-knock',
    },
    groups: {
      gettingStarted: 'Getting Started',
      deployment: 'Deployment',
      accessPatterns: 'Access Patterns',
      choosePattern: 'Choose an Access Pattern',
      publicAndTunnels: 'Public Access and Tunnels',
      clientsAndEdge: 'Clients and Edge Platforms',
      authAndAccess: 'Authentication and Access Control',
      routingAndGateway: 'Routing and Gateway',
      networkDnsTls: 'Networking, DNS, and TLS',
      securityObservability: 'Security and Observability',
      systemOperations: 'System and Operations',
      operationsTroubleshooting: 'Operations and Troubleshooting',
      commonReferences: 'Common References',
      productVision: 'Product Vision',
    },
    ui: {
      outline: 'On this page',
      previous: 'Previous',
      next: 'Next',
      sidebar: 'Documentation menu',
      returnToTop: 'Back to top',
      appearance: 'Appearance',
      lightMode: 'Switch to light theme',
      darkMode: 'Switch to dark theme',
      language: 'Change language',
      skipToContent: 'Skip to content',
      lastUpdated: 'Last updated',
      community: 'Community QQ group: 1081609274',
      notFoundTitle: 'Page not found',
      notFoundQuote: 'No documentation exists at this address. It may have moved or is not published yet.',
      notFoundLink: 'Back to home',
    },
  },
  ja: {
    label: '日本語',
    lang: 'ja-JP',
    link: '/ja/',
    title: 'fn-knock',
    description: 'NAS・HomeLab・セルフホスト環境の入口、認証、アクセス制御を一元化',
    nav: {
      quickStart: 'はじめに',
      tutorials: '連携ガイド',
      guide: '機能リファレンス',
      faq: 'よくある質問',
      origin: '開発の背景',
    },
    groups: {
      gettingStarted: '利用を開始する',
      deployment: 'デプロイ方法',
      accessPatterns: 'アクセス構成',
      choosePattern: '構成を選ぶ',
      publicAndTunnels: '公開アクセスとトンネル',
      clientsAndEdge: 'クライアントとエッジ基盤',
      authAndAccess: '認証とアクセス制御',
      routingAndGateway: 'ルーティングとゲートウェイ',
      networkDnsTls: 'ネットワーク・DNS・TLS',
      securityObservability: 'セキュリティと可観測性',
      systemOperations: 'システムと運用',
      operationsTroubleshooting: '運用とトラブルシューティング',
      commonReferences: 'よく使う資料',
      productVision: 'プロダクトの考え方',
    },
    ui: {
      outline: 'このページの内容',
      previous: '前へ',
      next: '次へ',
      sidebar: 'ドキュメントメニュー',
      returnToTop: 'ページ上部へ',
      appearance: '表示設定',
      lightMode: 'ライトテーマに切り替え',
      darkMode: 'ダークテーマに切り替え',
      language: '言語を変更',
      skipToContent: '本文へ移動',
      lastUpdated: '最終更新',
      community: 'QQ コミュニティ：1081609274',
      notFoundTitle: 'ページが見つかりません',
      notFoundQuote: 'この URL に対応するドキュメントはありません。移動または未公開の可能性があります。',
      notFoundLink: 'ホームへ戻る',
    },
  },
  ko: {
    label: '한국어',
    lang: 'ko-KR',
    link: '/ko/',
    title: 'fn-knock',
    description: 'NAS·HomeLab·자체 호스팅 서비스를 위한 통합 인증 및 접근 게이트웨이',
    nav: {
      quickStart: '시작하기',
      tutorials: '실전 가이드',
      guide: '기능 레퍼런스',
      faq: '자주 묻는 질문',
      origin: '개발 배경',
    },
    groups: {
      gettingStarted: '시작하기',
      deployment: '배포 방식',
      accessPatterns: '접근 방식',
      choosePattern: '방식 선택',
      publicAndTunnels: '외부 접근 및 터널',
      clientsAndEdge: '클라이언트와 엣지 플랫폼',
      authAndAccess: '인증 및 접근 제어',
      routingAndGateway: '라우팅 및 게이트웨이',
      networkDnsTls: '네트워크, DNS 및 TLS',
      securityObservability: '보안 및 관측성',
      systemOperations: '시스템 및 운영',
      operationsTroubleshooting: '운영 및 문제 해결',
      commonReferences: '자주 찾는 문서',
      productVision: '제품 철학',
    },
    ui: {
      outline: '이 페이지의 내용',
      previous: '이전',
      next: '다음',
      sidebar: '문서 메뉴',
      returnToTop: '맨 위로',
      appearance: '화면 설정',
      lightMode: '라이트 테마로 전환',
      darkMode: '다크 테마로 전환',
      language: '언어 변경',
      skipToContent: '본문으로 건너뛰기',
      lastUpdated: '최종 업데이트',
      community: 'QQ 커뮤니티: 1081609274',
      notFoundTitle: '페이지를 찾을 수 없습니다',
      notFoundQuote: '이 주소에 해당하는 문서가 없습니다. 이동되었거나 아직 공개되지 않았을 수 있습니다.',
      notFoundLink: '홈으로 돌아가기',
    },
  },
} as const satisfies Record<LocaleKey, LocaleCopy>

export const PAGE_TITLES = {
  faq: {
    root: '常见问题',
    'zh-tw': '常見問題',
    en: 'Frequently Asked Questions',
    ja: 'よくある質問',
    ko: '자주 묻는 질문',
  },
  'guide/advanced-auth': {
    root: '子域高级认证',
    'zh-tw': '子網域進階驗證',
    en: 'Advanced Authentication for Subdomains',
    ja: 'サブドメインの高度な認証',
    ko: '서브도메인 고급 인증',
  },
  'guide/auth': {
    root: '认证、会话与服务范围',
    'zh-tw': '身分驗證、工作階段與服務範圍',
    en: 'Authentication, Sessions, and Service Scopes',
    ja: '認証・セッション・サービススコープ',
    ko: '인증, 세션 및 서비스 범위',
  },
  'guide/backup-and-restore': {
    root: '备份、恢复与数据清理',
    'zh-tw': '備份、還原與資料清理',
    en: 'Backup, Restore, and Data Cleanup',
    ja: 'バックアップ・復元・データ消去',
    ko: '백업, 복원 및 데이터 정리',
  },
  'guide/captcha': {
    root: '登录前的人机验证',
    'zh-tw': '登入前的人機驗證',
    en: 'Pre-login Bot Protection',
    ja: 'ログイン前のボット対策',
    ko: '로그인 전 봇 차단',
  },
  'guide/cloudflare-ddns': {
    root: 'Cloudflare DDNS',
    'zh-tw': 'Cloudflare DDNS',
    en: 'Cloudflare DDNS',
    ja: 'Cloudflare DDNS',
    ko: 'Cloudflare DDNS',
  },
  'guide/cloudflare-turnstile': {
    root: 'Cloudflare Turnstile',
    'zh-tw': 'Cloudflare Turnstile',
    en: 'Cloudflare Turnstile',
    ja: 'Cloudflare Turnstile',
    ko: 'Cloudflare Turnstile',
  },
  'guide/cloudflared-tunnel': {
    root: 'Cloudflared 隧道配置',
    'zh-tw': 'Cloudflare Tunnel（cloudflared）設定',
    en: 'Cloudflare Tunnel with cloudflared',
    ja: 'cloudflared による Cloudflare Tunnel',
    ko: 'cloudflared 기반 Cloudflare Tunnel',
  },
  'guide/dashboard-and-update': {
    root: '控制台与系统更新',
    'zh-tw': '控制台與系統更新',
    en: 'Dashboard and System Updates',
    ja: 'ダッシュボードとシステム更新',
    ko: '대시보드 및 시스템 업데이트',
  },
  'guide/ddns': {
    root: 'DDNS 管理',
    'zh-tw': 'DDNS 管理',
    en: 'Dynamic DNS (DDNS)',
    ja: 'ダイナミック DNS（DDNS）',
    ko: '동적 DNS(DDNS)',
  },
  'guide/event-center-and-notifications': {
    root: '事件中心与通知',
    'zh-tw': '事件中心與通知',
    en: 'Event Center and Notifications',
    ja: 'イベントセンターと通知',
    ko: '이벤트 센터 및 알림',
  },
  'guide/fnos-share-bypass': {
    root: '飞牛分享直通',
    'zh-tw': 'fnOS 分享直通',
    en: 'fnOS Share Bypass',
    ja: 'fnOS 共有リンクのパススルー',
    ko: 'fnOS 공유 우회',
  },
  'guide/gateway-host-response': {
    root: '向上游保留 Host',
    'zh-tw': '轉送至上游時保留 Host 標頭',
    en: 'Preserve the Host Header Upstream',
    ja: 'アップストリームへの転送時に Host ヘッダーを維持',
    ko: '업스트림 Host 헤더 유지',
  },
  'guide/gateway-built-in-pages': {
    root: '网关内置页面',
    'zh-tw': '閘道內建頁面',
    en: 'Built-in Gateway Pages',
    ja: 'ゲートウェイ内蔵ページ',
    ko: '게이트웨이 내장 페이지',
  },
  'guide/gateway-path-response': {
    root: '路径响应',
    'zh-tw': '路徑回應',
    en: 'Static Path Responses',
    ja: 'パス単位の固定レスポンス',
    ko: '경로별 고정 응답',
  },
  'guide/gateway-portal': {
    root: '网关传送门',
    'zh-tw': '閘道入口頁',
    en: 'Gateway Portal',
    ja: 'ゲートウェイポータル',
    ko: '게이트웨이 포털',
  },
  'guide/gateway-proxy-headers': {
    root: '入站 PROXY Protocol 与上游代理头',
    'zh-tw': '入站 PROXY Protocol 與上游代理標頭',
    en: 'Inbound PROXY Protocol and Upstream Headers',
    ja: '受信 PROXY Protocol と上流プロキシヘッダー',
    ko: '인바운드 PROXY Protocol과 업스트림 헤더',
  },
  'guide/gateway-visibility': {
    root: '网关可见性',
    'zh-tw': '閘道可見性',
    en: 'Gateway Visibility',
    ja: 'ゲートウェイの公開範囲',
    ko: '게이트웨이 접근 범위',
  },
  'guide/general-blacklist': {
    root: '通用黑名单',
    'zh-tw': '全域封鎖清單',
    en: 'Global Blocklist',
    ja: 'グローバルブロックリスト',
    ko: '일반 차단 목록',
  },
  'guide/ip-location': {
    root: 'IP 归属地服务',
    'zh-tw': 'IP 地理位置服務',
    en: 'IP Geolocation',
    ja: 'IP ジオロケーション',
    ko: 'IP 지리 정보',
  },
  'guide/oidc': {
    root: '外部账号登录（OIDC / OAuth / LDAP）',
    'zh-tw': '外部帳號登入（OIDC / OAuth / LDAP）',
    en: 'External Identity Providers (OIDC / OAuth / LDAP)',
    ja: '外部アカウント認証（OIDC / OAuth / LDAP）',
    ko: '외부 계정 로그인(OIDC / OAuth / LDAP)',
  },
  'guide/openapi': {
    root: 'OpenAPI：开放管理 API 与 AI Agent',
    'zh-tw': 'OpenAPI：開放管理 API 與 AI Agent',
    en: 'OpenAPI: Management API Access and AI Agents',
    ja: 'OpenAPI：管理 API の公開と AI Agent',
    ko: 'OpenAPI: 관리 API 공개와 AI Agent',
  },
  'guide/panel-sync': {
    root: '导航面板同步',
    'zh-tw': '導覽面板同步',
    en: 'Navigation Panel Sync',
    ja: 'ナビゲーションパネル同期',
    ko: '내비게이션 패널 동기화',
  },
  'guide/passkey': {
    root: 'Passkey',
    'zh-tw': 'Passkey',
    en: 'Passkeys',
    ja: 'パスキー',
    ko: '패스키',
  },
  'guide/password-login': {
    root: '账号密码登录',
    'zh-tw': '帳號密碼登入',
    en: 'Username and Password Sign-in',
    ja: 'ユーザー名とパスワードによるログイン',
    ko: '계정 및 비밀번호 로그인',
  },
  'guide/qq-quick-login': {
    root: '绑定 QQ 快捷登录',
    'zh-tw': '綁定 QQ 快速登入',
    en: 'Link QQ for Quick Sign-in',
    ja: 'QQ クイックログインの連携',
    ko: 'QQ 빠른 로그인 연동',
  },
  'guide/request-logs': {
    root: '请求分析',
    'zh-tw': '請求分析',
    en: 'Request Analysis',
    ja: 'リクエスト分析',
    ko: '요청 분석',
  },
  'guide/reverse-proxy': {
    root: '路径映射（兼容模式）',
    'zh-tw': '路徑型反向代理（相容模式）',
    en: 'Path-based Reverse Proxy (Compatibility Mode)',
    ja: 'パスベースのリバースプロキシ（互換モード）',
    ko: '경로 기반 리버스 프록시(호환 모드)',
  },
  'guide/scanner-interception': {
    root: '扫描拦截',
    'zh-tw': '自動化掃描攔截',
    en: 'Automated Scan Blocking',
    ja: '自動スキャンの遮断',
    ko: '자동 스캔 차단',
  },
  'guide/security': {
    root: '安全边界与基线',
    'zh-tw': '資安邊界與基準',
    en: 'Security Model and Baseline',
    ja: 'セキュリティ境界とベースライン',
    ko: '보안 경계 및 기준선',
  },
  'guide/service-discovery': {
    root: '服务发现与批量接入',
    'zh-tw': '服務探索與批次串接',
    en: 'Service Discovery and Bulk Onboarding',
    ja: 'サービス検出と一括登録',
    ko: '서비스 검색 및 일괄 등록',
  },
  'guide/session-management': {
    root: '会话、IP 授权与 IP 漂移',
    'zh-tw': '工作階段、IP 授權與 IP 漂移',
    en: 'Sessions, Source-IP Authorization, and IP Changes',
    ja: 'セッション・送信元 IP 許可・IP 変更',
    ko: '세션, 출발지 IP 허용 및 IP 변경',
  },
  'guide/smart-connect': {
    root: '智能连接',
    'zh-tw': '智慧連線',
    en: 'Smart Connect',
    ja: 'スマート接続',
    ko: '스마트 연결',
  },
  'guide/ssh-security': {
    root: 'SSH 安全',
    'zh-tw': 'SSH 安全強化',
    en: 'SSH Hardening',
    ja: 'SSH のセキュリティ強化',
    ko: 'SSH 보안 강화',
  },
  'guide/ssl': {
    root: '证书与 HTTPS',
    'zh-tw': 'TLS 憑證與 HTTPS',
    en: 'TLS Certificates and HTTPS',
    ja: 'TLS 証明書と HTTPS',
    ko: 'TLS 인증서 및 HTTPS',
  },
  'guide/stream-mappings': {
    root: '协议映射',
    'zh-tw': 'TCP / UDP 通訊協定映射',
    en: 'TCP/UDP Stream Proxying',
    ja: 'TCP / UDP ストリームプロキシ',
    ko: 'TCP/UDP 스트림 프록시',
  },
  'guide/subdomain-proxy': {
    root: '子域映射',
    'zh-tw': '子網域路由',
    en: 'Subdomain Routing',
    ja: 'サブドメインルーティング',
    ko: '서브도메인 라우팅',
  },
  'guide/system': {
    root: '系统设置与维护',
    'zh-tw': '系統設定與維護',
    en: 'System Settings and Maintenance',
    ja: 'システム設定とメンテナンス',
    ko: '시스템 설정 및 유지 관리',
  },
  'guide/totp': {
    root: 'TOTP 与密码器',
    'zh-tw': 'TOTP 與驗證器 App',
    en: 'TOTP Authenticator Apps',
    ja: 'TOTP 認証アプリ',
    ko: 'TOTP 인증기',
  },
  'guide/tunnel': {
    root: '内网穿透',
    'zh-tw': '內網穿透與隧道',
    en: 'NAT Traversal and Tunnels',
    ja: 'NAT 越えとトンネル',
    ko: 'NAT 통과 및 터널',
  },
  'guide/waf': {
    root: 'WAF',
    'zh-tw': 'WAF',
    en: 'Web Application Firewall (WAF)',
    ja: 'Web Application Firewall（WAF）',
    ko: '웹 애플리케이션 방화벽(WAF)',
  },
  'guide/wake-on-lan': {
    root: '远程唤醒（Wake-on-LAN）',
    'zh-tw': '遠端喚醒（Wake-on-LAN）',
    en: 'Wake-on-LAN',
    ja: 'Wake-on-LAN（リモート起動）',
    ko: 'Wake-on-LAN(원격 깨우기)',
  },
  'guide/web-terminal': {
    root: 'Web 终端',
    'zh-tw': 'Web 終端機',
    en: 'Web Terminal',
    ja: 'Web ターミナル',
    ko: '웹 터미널',
  },
  'guide/whitelist': {
    root: 'IP 白名单',
    'zh-tw': 'IP 允許清單',
    en: 'IP Allowlist',
    ja: 'IP 許可リスト',
    ko: 'IP 허용 목록',
  },
  'origin/why-knock': {
    root: '为什么做敲门 Knock',
    'zh-tw': '為什麼打造 fn-knock',
    en: 'Why We Built fn-knock',
    ja: 'fn-knock を開発した理由',
    ko: 'fn-knock를 만든 이유',
  },
  'origin/performance-benchmark': {
    root: '性能与资源效率测试',
    'zh-tw': '效能與資源效率測試',
    en: 'Performance and Resource Efficiency Benchmark',
    ja: 'パフォーマンスとリソース効率の検証',
    ko: '성능 및 리소스 효율 벤치마크',
  },
  'quick-start/deployment-options': {
    root: '选择部署与访问方案',
    'zh-tw': '選擇部署與存取方案',
    en: 'Choose a Deployment and Access Pattern',
    ja: 'デプロイ方法とアクセス構成を選ぶ',
    ko: '배포 및 접근 방식 선택',
  },
  'quick-start/direct-mode': {
    root: '原始端口访问：直连授权',
    'zh-tw': '原始連接埠存取：直連授權',
    en: 'Direct Access on Original Ports',
    ja: '元のポートへ直接アクセスする',
    ko: '원본 포트 직접 접근',
  },
  'quick-start/docker-deployment': {
    root: 'Docker Compose 部署',
    'zh-tw': 'Docker Compose 部署',
    en: 'Deploy with Docker Compose',
    ja: 'Docker Compose でデプロイ',
    ko: 'Docker Compose로 배포',
  },
  'quick-start/fpk-lite-vs-standard': {
    root: '飞牛应用商店 Lite 与官网标准 FPK',
    'zh-tw': 'fnOS 應用程式商店 Lite 與官網標準 FPK',
    en: 'fnOS App Store Lite vs. the Standard FPK',
    ja: 'fnOS アプリストア Lite と標準 FPK の違い',
    ko: 'fnOS 앱 스토어 Lite와 표준 FPK 비교',
  },
  'quick-start/install-and-first-login': {
    root: '飞牛原生 FPK 安装与首次配置',
    'zh-tw': 'fnOS 原生 FPK 安裝與初始設定',
    en: 'Install and Set Up the Native fnOS FPK',
    ja: 'fnOS ネイティブ FPK のインストールと初期設定',
    ko: 'fnOS 네이티브 FPK 설치 및 초기 설정',
  },
  'quick-start/linux-deployment': {
    root: 'Linux 部署（systemd / OpenRC）',
    'zh-tw': 'Linux 部署（systemd / OpenRC）',
    en: 'Deploy on Linux (systemd / OpenRC)',
    ja: 'Linux へデプロイ（systemd / OpenRC）',
    ko: 'Linux 배포(systemd / OpenRC)',
  },
  'quick-start/macos-deployment': {
    root: 'macOS 部署（Intel / Apple Silicon）',
    'zh-tw': 'macOS 部署（Intel / Apple Silicon）',
    en: 'Deploy on macOS (Intel / Apple Silicon)',
    ja: 'macOS へデプロイ（Intel / Apple Silicon）',
    ko: 'macOS 배포(Intel / Apple Silicon)',
  },
  'quick-start/openwrt-deployment': {
    root: 'OpenWrt 部署',
    'zh-tw': 'OpenWrt 部署',
    en: 'Deploy on OpenWrt',
    ja: 'OpenWrt へデプロイ',
    ko: 'OpenWrt 배포',
  },
  'quick-start/ports-and-entrypoints': {
    root: '端口与入口',
    'zh-tw': '連接埠、入口與 URL 路徑',
    en: 'Ports, Endpoints, and URL Paths',
    ja: 'ポート・エンドポイント・URL パス',
    ko: '포트, 엔드포인트 및 URL 경로',
  },
  'quick-start/reverse-proxy-mode': {
    root: '内网穿透：子域路由',
    'zh-tw': '內網穿透：子網域路由',
    en: 'NAT Traversal with Subdomain Routing',
    ja: 'NAT 越え：サブドメインルーティング',
    ko: 'NAT 통과: 서브도메인 라우팅',
  },
  'quick-start/run-modes': {
    root: '选择运行方式',
    'zh-tw': '選擇執行模式',
    en: 'Choose a Runtime Mode',
    ja: '実行モードを選ぶ',
    ko: '실행 모드 선택',
  },
  'quick-start/subdomain-mode': {
    root: '公网直达：子域路由',
    'zh-tw': '公網直連：子網域路由',
    en: 'Public IP Access with Subdomain Routing',
    ja: 'グローバル IP からのサブドメインルーティング',
    ko: '공인 IP 직접 연결: 서브도메인 라우팅',
  },
  'quick-start/synology-deployment': {
    root: '群晖 DSM 7 部署（x86_64 / ARM）',
    'zh-tw': 'Synology DSM 7 部署（x86_64 / ARM）',
    en: 'Deploy on Synology DSM 7 (x86_64 / ARM)',
    ja: 'Synology DSM 7 へデプロイ（x86_64 / ARM）',
    ko: 'Synology DSM 7 배포(x86_64 / ARM)',
  },
  'quick-start/windows-deployment': {
    root: 'Windows 部署（x86_64）',
    'zh-tw': 'Windows 部署（x86_64）',
    en: 'Deploy on Windows (x86_64)',
    ja: 'Windows へデプロイ（x86_64）',
    ko: 'Windows 배포(x86_64)',
  },
  'tutorials/aliyun-esa-with-fknock': {
    root: '让阿里云 ESA 前置 fn-knock',
    'zh-tw': '在 fn-knock 前端串接 Alibaba Cloud ESA',
    en: 'Put Alibaba Cloud ESA in Front of fn-knock',
    ja: 'fn-knock の前段に Alibaba Cloud ESA を配置',
    ko: 'fn-knock 앞단에 Alibaba Cloud ESA 배치',
  },
  'tutorials/ipv6-direct-with-fknock': {
    root: 'IPv6 公网直达与原始端口授权',
    'zh-tw': 'IPv6 公網直連與原始連接埠授權',
    en: 'Public IPv6 Access and Original-Port Authorization',
    ja: 'グローバル IPv6 と元ポートへの直接アクセス',
    ko: '공인 IPv6 직접 연결 및 원본 포트 허용',
  },
  'tutorials/reverse-proxy-with-fknock': {
    root: '无公网 IP：通过隧道发布子域',
    'zh-tw': '無公網 IP：透過隧道發布子網域',
    en: 'Publish a Subdomain through a Tunnel without a Public IP',
    ja: 'グローバル IP なしでトンネル経由のサブドメインを公開',
    ko: '공인 IP 없이 터널로 서브도메인 공개',
  },
  'tutorials/subdomain-direct-with-fknock': {
    root: '公网直达：用子域发布服务',
    'zh-tw': '公網直連：以子網域發布服務',
    en: 'Publish Services on Subdomains with a Public IP',
    ja: 'グローバル IP とサブドメインでサービスを公開',
    ko: '공인 IP와 서브도메인으로 서비스 공개',
  },
  'tutorials/tencent-edgeone-with-fknock': {
    root: '让腾讯云 EdgeOne 前置 fn-knock',
    'zh-tw': '在 fn-knock 前端串接 Tencent Cloud EdgeOne',
    en: 'Put Tencent Cloud EdgeOne in Front of fn-knock',
    ja: 'fn-knock の前段に Tencent Cloud EdgeOne を配置',
    ko: 'fn-knock 앞단에 Tencent Cloud EdgeOne 배치',
  },
  'tutorials/use-fnos-app-with-fknock': {
    root: '通过 fn-knock 使用飞牛 App',
    'zh-tw': '透過 fn-knock 使用 fnOS App',
    en: 'Use the fnOS App through fn-knock',
    ja: 'fn-knock 経由で fnOS アプリを使う',
    ko: 'fn-knock를 통해 fnOS 클라이언트 사용',
  },
} as const satisfies Record<string, Record<LocaleKey, string>>

export type PagePath = keyof typeof PAGE_TITLES

type SidebarGroupKey = keyof LocaleCopy['groups']

type SidebarSection = {
  match: '/quick-start/' | '/tutorials/' | '/guide/' | '/faq' | '/origin/'
  groups: readonly {
    label: SidebarGroupKey
    collapsed?: boolean
    items: readonly PagePath[]
  }[]
}

const SIDEBAR_SECTIONS = [
  {
    match: '/quick-start/',
    groups: [
      {
        label: 'gettingStarted',
        items: [
          'quick-start/deployment-options',
          'quick-start/fpk-lite-vs-standard',
          'quick-start/install-and-first-login',
          'quick-start/ports-and-entrypoints',
        ],
      },
      {
        label: 'deployment',
        collapsed: false,
        items: [
          'quick-start/docker-deployment',
          'quick-start/openwrt-deployment',
          'quick-start/linux-deployment',
          'quick-start/macos-deployment',
          'quick-start/synology-deployment',
          'quick-start/windows-deployment',
        ],
      },
      {
        label: 'accessPatterns',
        items: [
          'quick-start/subdomain-mode',
          'quick-start/reverse-proxy-mode',
          'quick-start/direct-mode',
          'quick-start/run-modes',
        ],
      },
    ],
  },
  {
    match: '/tutorials/',
    groups: [
      {
        label: 'choosePattern',
        items: [
          'quick-start/deployment-options',
          'quick-start/subdomain-mode',
          'quick-start/reverse-proxy-mode',
        ],
      },
      {
        label: 'publicAndTunnels',
        items: [
          'tutorials/subdomain-direct-with-fknock',
          'tutorials/ipv6-direct-with-fknock',
          'tutorials/reverse-proxy-with-fknock',
        ],
      },
      {
        label: 'clientsAndEdge',
        items: [
          'tutorials/use-fnos-app-with-fknock',
          'tutorials/tencent-edgeone-with-fknock',
          'tutorials/aliyun-esa-with-fknock',
        ],
      },
    ],
  },
  {
    match: '/guide/',
    groups: [
      {
        label: 'authAndAccess',
        items: [
          'guide/auth',
          'guide/captcha',
          'guide/cloudflare-turnstile',
          'guide/password-login',
          'guide/totp',
          'guide/passkey',
          'guide/oidc',
          'guide/qq-quick-login',
          'guide/session-management',
          'guide/whitelist',
        ],
      },
      {
        label: 'routingAndGateway',
        collapsed: false,
        items: [
          'guide/subdomain-proxy',
          'guide/panel-sync',
          'guide/service-discovery',
          'guide/advanced-auth',
          'guide/reverse-proxy',
          'guide/gateway-path-response',
          'guide/stream-mappings',
          'guide/openapi',
          'guide/gateway-proxy-headers',
          'guide/gateway-host-response',
          'guide/gateway-built-in-pages',
          'guide/gateway-portal',
          'guide/smart-connect',
          'guide/fnos-share-bypass',
          'guide/gateway-visibility',
        ],
      },
      {
        label: 'networkDnsTls',
        collapsed: false,
        items: [
          'guide/ssl',
          'guide/ddns',
          'guide/cloudflare-ddns',
          'guide/tunnel',
          'guide/cloudflared-tunnel',
          'guide/ip-location',
        ],
      },
      {
        label: 'securityObservability',
        collapsed: false,
        items: [
          'guide/general-blacklist',
          'guide/scanner-interception',
          'guide/security',
          'guide/request-logs',
          'guide/waf',
          'guide/ssh-security',
          'guide/event-center-and-notifications',
        ],
      },
      {
        label: 'systemOperations',
        collapsed: false,
        items: [
          'guide/wake-on-lan',
          'guide/web-terminal',
          'guide/system',
          'guide/backup-and-restore',
          'guide/dashboard-and-update',
        ],
      },
    ],
  },
  {
    match: '/faq',
    groups: [
      {
        label: 'operationsTroubleshooting',
        items: ['faq'],
      },
      {
        label: 'commonReferences',
        collapsed: false,
        items: [
          'quick-start/ports-and-entrypoints',
          'quick-start/docker-deployment',
          'quick-start/openwrt-deployment',
          'quick-start/linux-deployment',
          'quick-start/macos-deployment',
          'quick-start/synology-deployment',
          'quick-start/windows-deployment',
          'guide/service-discovery',
          'guide/backup-and-restore',
          'guide/system',
        ],
      },
    ],
  },
  {
    match: '/origin/',
    groups: [
      {
        label: 'productVision',
        items: ['origin/why-knock', 'origin/performance-benchmark'],
      },
    ],
  },
] as const satisfies readonly SidebarSection[]

export function localePath(locale: LocaleKey, path = '/') {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (locale === 'root') return normalized
  return normalized === '/' ? `/${locale}/` : `/${locale}${normalized}`
}

export function pageLink(locale: LocaleKey, page: PagePath) {
  return localePath(locale, `/${page}`)
}

export function getPageTitle(locale: LocaleKey, page: PagePath) {
  return PAGE_TITLES[page][locale]
}

function createNav(locale: LocaleKey): DefaultTheme.NavItem[] {
  const copy = LOCALES[locale]
  return [
    {
      text: copy.nav.quickStart,
      link: pageLink(locale, 'quick-start/deployment-options'),
    },
    {
      text: copy.nav.tutorials,
      link: pageLink(locale, 'tutorials/subdomain-direct-with-fknock'),
    },
    { text: copy.nav.guide, link: pageLink(locale, 'guide/auth') },
    { text: copy.nav.faq, link: pageLink(locale, 'faq') },
    { text: copy.nav.origin, link: pageLink(locale, 'origin/why-knock') },
  ]
}

function createSidebar(locale: LocaleKey): DefaultTheme.SidebarMulti {
  const copy = LOCALES[locale]

  return Object.fromEntries(
    SIDEBAR_SECTIONS.map((section) => [
      localePath(locale, section.match),
      section.groups.map((group) => ({
        text: copy.groups[group.label],
        ...(group.collapsed === undefined
          ? {}
          : { collapsed: group.collapsed }),
        items: group.items.map((page) => ({
          text: getPageTitle(locale, page),
          link: pageLink(locale, page),
        })),
      })),
    ]),
  )
}

export function createThemeConfig(locale: LocaleKey): DefaultTheme.Config {
  const copy = LOCALES[locale]

  return {
    nav: createNav(locale),
    sidebar: createSidebar(locale),
    outline: {
      level: [2, 3],
      label: copy.ui.outline,
    },
    docFooter: {
      prev: copy.ui.previous,
      next: copy.ui.next,
    },
    sidebarMenuLabel: copy.ui.sidebar,
    returnToTopLabel: copy.ui.returnToTop,
    darkModeSwitchLabel: copy.ui.appearance,
    lightModeSwitchTitle: copy.ui.lightMode,
    darkModeSwitchTitle: copy.ui.darkMode,
    langMenuLabel: copy.ui.language,
    skipToContentLabel: copy.ui.skipToContent,
    lastUpdated: {
      text: copy.ui.lastUpdated,
    },
    footer: {
      message: copy.ui.community,
      copyright: 'Copyright © fn-knock docs',
    },
    notFound: {
      title: copy.ui.notFoundTitle,
      quote: copy.ui.notFoundQuote,
      link: localePath(locale),
      linkLabel: copy.ui.notFoundLink,
      linkText: copy.ui.notFoundLink,
    },
  }
}
