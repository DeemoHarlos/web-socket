import { NuxtSocket } from 'nuxt-socket-io'
import { NuxtCookies } from 'cookie-universal-nuxt'

declare module '@nuxt/types' {
  interface Context {
    $io: NuxtSocket
    $cookies: NuxtCookies
  }
}
