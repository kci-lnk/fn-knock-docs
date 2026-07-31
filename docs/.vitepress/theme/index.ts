import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { h } from 'vue'
import FnKnockWebsiteCard from './components/FnKnockWebsiteCard.vue'
import PerformanceBenchmarkCharts from './components/PerformanceBenchmarkCharts.vue'
import { installLocalePreference } from './locale-preference'
import './styles.css'

export default {
  extends: DefaultTheme,
  enhanceApp(context: EnhanceAppContext) {
    context.app.component('PerformanceBenchmarkCharts', PerformanceBenchmarkCharts)
    installLocalePreference(context)
  },
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(FnKnockWebsiteCard)
    })
}
