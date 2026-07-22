<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { useLayout } from 'vitepress/theme'

const { hasSidebar } = useLayout()
const { localeIndex } = useData()

const copies = {
  root: {
    aria: '敲门 Knock 官网入口',
    eyebrow: '敲门 Knock 官网',
    title: '轻松配置公网访问，更安全',
    description: '了解产品、支持平台并下载最新版本',
    action: '访问官网',
  },
  'zh-tw': {
    aria: 'fn-knock 官方網站入口',
    eyebrow: 'fn-knock 官方網站',
    title: '集中管理 HomeLab 的公開入口',
    description: '瞭解產品、支援平台並下載最新版本',
    action: '前往官網',
  },
  en: {
    aria: 'fn-knock official website',
    eyebrow: 'fn-knock official site',
    title: 'One secure gateway for your HomeLab',
    description: 'Explore the product, supported platforms, and latest release',
    action: 'Visit site',
  },
  ja: {
    aria: 'fn-knock 公式サイト',
    eyebrow: 'fn-knock 公式サイト',
    title: 'HomeLab の公開入口をひとつに',
    description: '製品情報、対応環境、最新版のダウンロード',
    action: '公式サイトへ',
  },
  ko: {
    aria: 'fn-knock 공식 웹사이트',
    eyebrow: 'fn-knock 공식 웹사이트',
    title: 'HomeLab을 위한 안전한 통합 게이트웨이',
    description: '제품 정보, 지원 플랫폼 및 최신 릴리스 확인',
    action: '공식 사이트 열기',
  },
} as const

const copy = computed(
  () => copies[localeIndex.value as keyof typeof copies] ?? copies.root,
)
</script>

<template>
  <aside
    class="fnknock-website-card-wrap"
    :class="{ 'has-sidebar': hasSidebar }"
    :aria-label="copy.aria"
  >
    <a
      class="fnknock-website-card"
      href="https://www.fnknock.cn/"
      target="_blank"
      rel="noreferrer"
    >
      <span class="fnknock-website-card__copy">
        <span class="fnknock-website-card__eyebrow">{{ copy.eyebrow }}</span>
        <span class="fnknock-website-card__title">{{ copy.title }}</span>
        <span class="fnknock-website-card__description">
          {{ copy.description }}
        </span>
      </span>

      <span class="fnknock-website-card__action" aria-hidden="true">
        {{ copy.action }}
        <svg viewBox="0 0 20 20" fill="none">
          <path
            d="M6 14 14 6m0 0H8m6 0v6"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </a>
  </aside>
</template>

<style scoped>
.fnknock-website-card-wrap {
  position: relative;
  z-index: var(--vp-z-index-footer);
  border-top: 1px solid var(--vp-c-gutter);
  padding: 20px 24px 28px;
  background: var(--vp-c-bg);
}

.fnknock-website-card {
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin: 0 auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  padding: 18px 20px;
  width: 100%;
  max-width: 1152px;
  color: var(--vp-c-text-1);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--vp-c-brand-1) 16%, transparent), transparent 44%),
    linear-gradient(180deg, var(--vp-c-bg-soft) 0%, var(--vp-c-bg) 100%);
  box-shadow: 0 10px 28px rgb(0 0 0 / 5%);
  text-decoration: none;
  transition:
    border-color 0.25s,
    box-shadow 0.25s,
    transform 0.25s;
}

.fnknock-website-card:focus-visible {
  outline: 3px solid var(--vp-c-brand-soft);
  outline-offset: 3px;
}

.fnknock-website-card__copy {
  display: grid;
  min-width: 0;
}

.fnknock-website-card__eyebrow {
  margin-bottom: 5px;
  color: var(--vp-c-brand-1);
  font-size: 13px;
  font-weight: 700;
}

.fnknock-website-card__title {
  color: var(--vp-c-text-1);
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
}

.fnknock-website-card__description {
  margin-top: 4px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}

.fnknock-website-card__action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 40px;
  border-radius: 999px;
  padding: 9px 16px;
  color: #fff;
  background: var(--vp-c-brand-1);
  font-size: 14px;
  font-weight: 700;
}

.fnknock-website-card__action svg {
  width: 16px;
  height: 16px;
}

@media (min-width: 960px) {
  .fnknock-website-card-wrap.has-sidebar {
    padding-right: 20px;
    padding-left: calc(var(--vp-sidebar-width) + 20px);
  }

  .fnknock-website-card-wrap.has-sidebar .fnknock-website-card {
    max-width: calc(
      var(--vp-layout-max-width) - var(--vp-sidebar-width) - 40px
    );
  }
}

@media (min-width: 1760px) {
  .fnknock-website-card-wrap.has-sidebar {
    padding-right: calc(
      (100% - var(--vp-layout-max-width)) / 2 + 20px
    );
    padding-left: calc(
      (100% - var(--vp-layout-max-width)) / 2
      + var(--vp-sidebar-width)
      + 20px
    );
  }
}

@media (hover: hover) {
  .fnknock-website-card:hover {
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 14px 34px color-mix(in srgb, var(--vp-c-brand-1) 14%, transparent);
    transform: translateY(-2px);
  }
}

@media (max-width: 639px) {
  .fnknock-website-card-wrap {
    padding: 14px 16px max(20px, env(safe-area-inset-bottom));
  }

  .fnknock-website-card {
    align-items: stretch;
    flex-direction: column;
    gap: 16px;
    border-radius: 16px;
    padding: 16px;
  }

  .fnknock-website-card__eyebrow {
    margin-bottom: 4px;
    font-size: 12px;
  }

  .fnknock-website-card__title {
    font-size: 17px;
  }

  .fnknock-website-card__description {
    margin-top: 3px;
    font-size: 13px;
    line-height: 1.55;
  }

  .fnknock-website-card__action {
    width: 100%;
    min-height: 42px;
  }
}
</style>
