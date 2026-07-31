<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { localeIndex } = useData()

const copies = {
  root: {
    aria: 'fn-knock 性能测试图表',
    other: '其他产品',
    concurrency: '并发',
    throughput: '吞吐量',
    throughputUnit: 'req/s',
    latency: 'P99 延迟',
    latencyUnit: 'ms',
    lowerBetter: '越低越好',
    resources: '512 并发时的 CPU 与内存',
    cpu: '服务 CPU',
    cpuUnit: '核',
    perCore: '每核吞吐',
    perCoreUnit: 'req/s/核',
    rss: '平均内存（RSS）',
    rssUnit: 'MiB',
    memory: '压测前后的内存变化',
    memoryUnit: 'MiB',
    stages: ['压测前', '高负载平均', '历史峰值', '冷却后'],
  },
  'zh-tw': {
    aria: 'fn-knock 效能測試圖表',
    other: '其他產品',
    concurrency: '併發',
    throughput: '吞吐量',
    throughputUnit: 'req/s',
    latency: 'P99 延遲',
    latencyUnit: 'ms',
    lowerBetter: '越低越好',
    resources: '512 併發時的 CPU 與記憶體',
    cpu: '服務 CPU',
    cpuUnit: '核心',
    perCore: '每核心吞吐量',
    perCoreUnit: 'req/s/核心',
    rss: '平均記憶體（RSS）',
    rssUnit: 'MiB',
    memory: '壓測前後的記憶體變化',
    memoryUnit: 'MiB',
    stages: ['壓測前', '高負載平均', '歷史峰值', '冷卻後'],
  },
  en: {
    aria: 'fn-knock performance benchmark charts',
    other: 'Other product',
    concurrency: 'concurrent',
    throughput: 'Throughput',
    throughputUnit: 'req/s',
    latency: 'P99 latency',
    latencyUnit: 'ms',
    lowerBetter: 'lower is better',
    resources: 'CPU and memory at 512 concurrent connections',
    cpu: 'Service CPU',
    cpuUnit: 'cores',
    perCore: 'Per-core throughput',
    perCoreUnit: 'req/s/core',
    rss: 'Average memory (RSS)',
    rssUnit: 'MiB',
    memory: 'Memory before and after load',
    memoryUnit: 'MiB',
    stages: ['Before load', 'Load average', 'Recorded peak', 'After cooldown'],
  },
  ja: {
    aria: 'fn-knock パフォーマンステストのグラフ',
    other: '他製品',
    concurrency: '同時接続',
    throughput: 'スループット',
    throughputUnit: 'req/s',
    latency: 'P99 レイテンシ',
    latencyUnit: 'ms',
    lowerBetter: '低いほど良い',
    resources: '同時接続 512 での CPU とメモリ',
    cpu: 'サービス CPU',
    cpuUnit: 'コア',
    perCore: 'コアあたりのスループット',
    perCoreUnit: 'req/s/コア',
    rss: '平均メモリ（RSS）',
    rssUnit: 'MiB',
    memory: '負荷テスト前後のメモリ変化',
    memoryUnit: 'MiB',
    stages: ['負荷テスト前', '高負荷時平均', '記録ピーク', 'クールダウン後'],
  },
  ko: {
    aria: 'fn-knock 성능 벤치마크 차트',
    other: '다른 제품',
    concurrency: '동시 연결',
    throughput: '처리량',
    throughputUnit: 'req/s',
    latency: 'P99 지연 시간',
    latencyUnit: 'ms',
    lowerBetter: '낮을수록 좋음',
    resources: '동시 연결 512에서의 CPU 및 메모리',
    cpu: '서비스 CPU',
    cpuUnit: '코어',
    perCore: '코어당 처리량',
    perCoreUnit: 'req/s/코어',
    rss: '평균 메모리(RSS)',
    rssUnit: 'MiB',
    memory: '부하 테스트 전후의 메모리 변화',
    memoryUnit: 'MiB',
    stages: ['부하 테스트 전', '고부하 평균', '기록 최고값', '냉각 후'],
  },
} as const

const copy = computed(
  () => copies[localeIndex.value as keyof typeof copies] ?? copies.root,
)

const throughput = [
  { concurrency: 64, fnknock: 13529, other: 2992 },
  { concurrency: 256, fnknock: 12982, other: 4251 },
  { concurrency: 512, fnknock: 13026, other: 4642 },
]

const latency = [
  { concurrency: 64, fnknock: 30.38, other: 81.52 },
  { concurrency: 256, fnknock: 242.29, other: 272.92 },
  { concurrency: 512, fnknock: 498.68, other: 573.1 },
]

const resources = [
  { key: 'cpu', fnknock: 5.81, other: 4.37, max: 6 },
  { key: 'perCore', fnknock: 2242, other: 1063, max: 2500 },
  { key: 'rss', fnknock: 153.4, other: 325.6, max: 350 },
] as const

const memory = [
  { fnknock: 58.3, other: 121.4 },
  { fnknock: 153.4, other: 325.6 },
  { fnknock: 228.6, other: 610 },
  { fnknock: 132.8, other: 201.7 },
]

function percent(value: number, max: number) {
  return `${Math.max(1.5, Math.min(100, (value / max) * 100))}%`
}

function number(value: number, digits?: number) {
  const defaultDigits = Number.isInteger(value) ? 0 : 1
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits ?? defaultDigits,
    maximumFractionDigits: digits ?? 2,
  })
}

function resourceLabel(key: (typeof resources)[number]['key']) {
  return copy.value[key]
}

function resourceUnit(key: (typeof resources)[number]['key']) {
  if (key === 'cpu') return copy.value.cpuUnit
  if (key === 'perCore') return copy.value.perCoreUnit
  return copy.value.rssUnit
}
</script>

<template>
  <section class="benchmark-charts" :aria-label="copy.aria">
    <div class="benchmark-legend" aria-hidden="true">
      <span><i class="benchmark-swatch benchmark-swatch--fnknock" />fn-knock</span>
      <span><i class="benchmark-swatch benchmark-swatch--other" />{{ copy.other }}</span>
    </div>

    <div class="benchmark-grid benchmark-grid--comparison">
      <figure class="benchmark-panel">
        <figcaption>
          <strong>{{ copy.throughput }}</strong>
          <span>{{ copy.throughputUnit }}</span>
        </figcaption>
        <div
          v-for="sample in throughput"
          :key="`throughput-${sample.concurrency}`"
          class="benchmark-group"
        >
          <p>{{ sample.concurrency }} {{ copy.concurrency }}</p>
          <div class="benchmark-row">
            <span>fn-knock</span>
            <i class="benchmark-track">
              <b
                class="benchmark-bar benchmark-bar--fnknock"
                :style="{ width: percent(sample.fnknock, 15000) }"
              />
            </i>
            <data :value="sample.fnknock">{{ number(sample.fnknock) }}</data>
          </div>
          <div class="benchmark-row">
            <span>{{ copy.other }}</span>
            <i class="benchmark-track">
              <b
                class="benchmark-bar benchmark-bar--other"
                :style="{ width: percent(sample.other, 15000) }"
              />
            </i>
            <data :value="sample.other">{{ number(sample.other) }}</data>
          </div>
        </div>
      </figure>

      <figure class="benchmark-panel">
        <figcaption>
          <strong>{{ copy.latency }}</strong>
          <span>{{ copy.latencyUnit }} · {{ copy.lowerBetter }}</span>
        </figcaption>
        <div
          v-for="sample in latency"
          :key="`latency-${sample.concurrency}`"
          class="benchmark-group"
        >
          <p>{{ sample.concurrency }} {{ copy.concurrency }}</p>
          <div class="benchmark-row">
            <span>fn-knock</span>
            <i class="benchmark-track">
              <b
                class="benchmark-bar benchmark-bar--fnknock"
                :style="{ width: percent(sample.fnknock, 600) }"
              />
            </i>
            <data :value="sample.fnknock">{{ number(sample.fnknock, 2) }}</data>
          </div>
          <div class="benchmark-row">
            <span>{{ copy.other }}</span>
            <i class="benchmark-track">
              <b
                class="benchmark-bar benchmark-bar--other"
                :style="{ width: percent(sample.other, 600) }"
              />
            </i>
            <data :value="sample.other">{{ number(sample.other, 2) }}</data>
          </div>
        </div>
      </figure>
    </div>

    <figure class="benchmark-panel benchmark-panel--wide">
      <figcaption>
        <strong>{{ copy.resources }}</strong>
      </figcaption>
      <div class="benchmark-grid benchmark-grid--resources">
        <article v-for="metric in resources" :key="metric.key" class="benchmark-metric">
          <h3>{{ resourceLabel(metric.key) }}</h3>
          <div class="benchmark-row benchmark-row--metric">
            <span>fn-knock</span>
            <i class="benchmark-track">
              <b
                class="benchmark-bar benchmark-bar--fnknock"
                :style="{ width: percent(metric.fnknock, metric.max) }"
              />
            </i>
            <data :value="metric.fnknock">
              {{ number(metric.fnknock) }} {{ resourceUnit(metric.key) }}
            </data>
          </div>
          <div class="benchmark-row benchmark-row--metric">
            <span>{{ copy.other }}</span>
            <i class="benchmark-track">
              <b
                class="benchmark-bar benchmark-bar--other"
                :style="{ width: percent(metric.other, metric.max) }"
              />
            </i>
            <data :value="metric.other">
              {{ number(metric.other) }} {{ resourceUnit(metric.key) }}
            </data>
          </div>
        </article>
      </div>
    </figure>

    <figure class="benchmark-panel benchmark-panel--wide">
      <figcaption>
        <strong>{{ copy.memory }}</strong>
        <span>{{ copy.memoryUnit }}</span>
      </figcaption>
      <div class="benchmark-memory">
        <div
          v-for="(sample, index) in memory"
          :key="copy.stages[index]"
          class="benchmark-memory__stage"
        >
          <div class="benchmark-memory__bars">
            <i
              class="benchmark-memory__bar benchmark-memory__bar--fnknock"
              :style="{ height: percent(sample.fnknock, 650) }"
            >
              <data :value="sample.fnknock">{{ number(sample.fnknock) }}</data>
            </i>
            <i
              class="benchmark-memory__bar benchmark-memory__bar--other"
              :style="{ height: percent(sample.other, 650) }"
            >
              <data :value="sample.other">{{ number(sample.other) }}</data>
            </i>
          </div>
          <span>{{ copy.stages[index] }}</span>
        </div>
      </div>
    </figure>
  </section>
</template>

<style scoped>
.benchmark-charts {
  --benchmark-fnknock: var(--vp-c-brand-1);
  --benchmark-other: var(--vp-c-text-3);
  display: grid;
  gap: 18px;
  margin: 28px 0 36px;
}

.benchmark-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 22px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 650;
}

.benchmark-legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.benchmark-swatch {
  display: inline-block;
  width: 22px;
  height: 9px;
  border-radius: 2px;
}

.benchmark-swatch--fnknock,
.benchmark-bar--fnknock,
.benchmark-memory__bar--fnknock {
  background: var(--benchmark-fnknock);
}

.benchmark-swatch--other,
.benchmark-bar--other,
.benchmark-memory__bar--other {
  background:
    repeating-linear-gradient(
      135deg,
      var(--benchmark-other) 0 3px,
      color-mix(in srgb, var(--benchmark-other) 42%, transparent) 3px 6px
    );
}

.benchmark-grid {
  display: grid;
  gap: 18px;
}

.benchmark-grid--comparison {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.benchmark-panel {
  margin: 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  padding: 18px;
  min-width: 0;
  background:
    linear-gradient(180deg, var(--vp-c-bg-soft), var(--vp-c-bg));
  box-shadow: var(--fnknock-shadow-sm);
}

.benchmark-panel figcaption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
  color: var(--vp-c-text-1);
}

.benchmark-panel figcaption strong {
  font-size: 15px;
}

.benchmark-panel figcaption span {
  color: var(--vp-c-text-3);
  font-size: 11px;
  text-align: right;
}

.benchmark-group + .benchmark-group {
  margin-top: 16px;
}

.benchmark-group p {
  margin: 0 0 6px;
  color: var(--vp-c-text-3);
  font-size: 11px;
  font-weight: 650;
}

.benchmark-row {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 72px;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  color: var(--vp-c-text-2);
  font-size: 11px;
}

.benchmark-row > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.benchmark-row data {
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.benchmark-track {
  display: block;
  overflow: hidden;
  height: 12px;
  border-left: 1px solid var(--vp-c-text-3);
  background:
    linear-gradient(to right, transparent 24.6%, var(--vp-c-divider) 25%, transparent 25.4%),
    linear-gradient(to right, transparent 49.6%, var(--vp-c-divider) 50%, transparent 50.4%),
    linear-gradient(to right, transparent 74.6%, var(--vp-c-divider) 75%, transparent 75.4%),
    color-mix(in srgb, var(--vp-c-bg-alt) 78%, transparent);
}

.benchmark-bar {
  display: block;
  height: 100%;
  border-radius: 0 2px 2px 0;
}

.benchmark-panel--wide {
  padding-bottom: 20px;
}

.benchmark-grid--resources {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 22px;
}

.benchmark-metric {
  min-width: 0;
}

.benchmark-metric + .benchmark-metric {
  border-left: 1px solid var(--vp-c-divider);
  padding-left: 22px;
}

.benchmark-metric h3 {
  margin: 0 0 12px;
  border: 0;
  padding: 0;
  font-size: 12px;
  line-height: 1.4;
}

.benchmark-row--metric {
  grid-template-columns: 76px minmax(0, 1fr) minmax(84px, auto);
}

.benchmark-memory {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: end;
  gap: 18px;
  height: 280px;
  border-bottom: 1px solid var(--vp-c-text-3);
  padding: 18px 8px 0;
  background:
    linear-gradient(to top, transparent 24.7%, var(--vp-c-divider) 25%, transparent 25.3%),
    linear-gradient(to top, transparent 49.7%, var(--vp-c-divider) 50%, transparent 50.3%),
    linear-gradient(to top, transparent 74.7%, var(--vp-c-divider) 75%, transparent 75.3%);
}

.benchmark-memory__stage {
  display: grid;
  grid-template-rows: minmax(0, 1fr) 42px;
  align-self: stretch;
  min-width: 0;
}

.benchmark-memory__stage > span {
  align-self: center;
  color: var(--vp-c-text-2);
  font-size: 11px;
  line-height: 1.25;
  text-align: center;
}

.benchmark-memory__bars {
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 8px;
  min-height: 0;
}

.benchmark-memory__bar {
  position: relative;
  display: block;
  width: min(38px, 38%);
  min-height: 3px;
  border-radius: 3px 3px 0 0;
}

.benchmark-memory__bar data {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 50%;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-style: normal;
  font-variant-numeric: tabular-nums;
  transform: translateX(-50%);
  white-space: nowrap;
}

@media (max-width: 820px) {
  .benchmark-grid--comparison,
  .benchmark-grid--resources {
    grid-template-columns: 1fr;
  }

  .benchmark-metric + .benchmark-metric {
    border-top: 1px solid var(--vp-c-divider);
    border-left: 0;
    padding-top: 18px;
    padding-left: 0;
  }
}

@media (max-width: 520px) {
  .benchmark-panel {
    border-radius: 12px;
    padding: 14px;
  }

  .benchmark-row {
    grid-template-columns: 74px minmax(0, 1fr) 64px;
    gap: 6px;
    font-size: 10px;
  }

  .benchmark-row--metric {
    grid-template-columns: 66px minmax(0, 1fr) minmax(72px, auto);
  }

  .benchmark-memory {
    gap: 6px;
    height: 230px;
    padding-right: 0;
    padding-left: 0;
  }

  .benchmark-memory__bars {
    gap: 4px;
  }

  .benchmark-memory__bar data {
    font-size: 9px;
  }
}
</style>
