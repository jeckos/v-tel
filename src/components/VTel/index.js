import utils, { defaultOptions } from './utils'
import VTel from './src/VTel'

export function install (Vue, customOptions = {}) {
  if (install.installed) return
  install.installed = true

  utils.options = {
    ...defaultOptions,
    ...customOptions
  }

  Vue.component('v-tel', VTel)
}

export { VTel }

const plugin = {
  install
}

// Auto-install
let GlobalVue = null
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue
}
if (GlobalVue) {
  GlobalVue.use(plugin)
}

export default plugin
