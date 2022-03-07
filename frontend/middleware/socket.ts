import { Context } from '@nuxt/types'

export default (ctx: Context) => {
  ctx.$io = ctx.$nuxtSocket({})
}
