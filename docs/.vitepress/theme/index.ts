import DefaultTheme from 'vitepress/theme'
import type { EnhanceAppContext } from 'vitepress'
import { h } from 'vue'
import FnKnockWebsiteCard from './components/FnKnockWebsiteCard.vue'
import { installLocalePreference } from './locale-preference'
import './styles.css'

export default {
  extends: DefaultTheme,
  enhanceApp(context: EnhanceAppContext) {
    installLocalePreference(context)
  },
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'layout-bottom': () => h(FnKnockWebsiteCard)
    })
}
