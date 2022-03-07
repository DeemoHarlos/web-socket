<template lang="pug">
  .flex-column.vh-100
    #messages.flex-fill.p-3
      #messages-wrap.flex-(ref="messagesWrap")
        .message.text-break(v-for="message in messages")
          span.mr-3: b {{ message.username }}
          span {{ message.message }}
    form.flex-row.p-3(@submit="sendMessage")
      input.flex-fill(type="text" v-model="msg")
      button.btn.btn-primary(type="button" @click="sendMessage") SEND
    #username-prompt.position-fixed.d-flex.middle-center.w-100.vh-100(v-if="showUsernamePrompt")
      .bg-light.p-4
        div Please enter your username
        form.flex-row(@submit="setUsername")
          input.flex-fill(type="text" v-model="username")
          button.btn.btn-primary(type="button" @click="setUsername") CONFIRM
        div.text-danger {{ errorText }}
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, useContext } from '@nuxtjs/composition-api'

import { BroadcastMessage, ErrorMessage } from '@api/socketServer'
import { SendMessage, SetUsername } from '@api/socketClient'

// workaround for dependency not found
import { ServerEvent, ErrorType } from '../../api/socketServer'
import { ClientEvent } from '../../api/socketClient'

export default defineComponent({
  name: 'IndexPage',
  setup() {
    const { $io, $cookies } = useContext()

    const messagesWrap = ref<HTMLElement | null>(null)
    const messages = ref<BroadcastMessage.data[]>([])
    const username = ref('')
    const msg = ref('')
    const errorText = ref('')
    const showUsernamePrompt = ref(false)

    const sendMessage = (e: Event) => {
      e.preventDefault()
      $io.emit(ClientEvent.SendMessage, msg.value as SendMessage.data)
      msg.value = ''
    }

    const setUsername = (e: Event) => {
      e.preventDefault()
      const legalUsername = username.value.replace(/\W/g, '').slice(0, 32)
      if (!legalUsername) {
        errorText.value = 'Username can only contain alphabets, numbers and underscores.'
        return
      }
      $io.emit(ClientEvent.SetUsername, legalUsername as SetUsername.data)
      showUsernamePrompt.value = false
      errorText.value = ''
      $cookies.set('username', legalUsername, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    onMounted(() => {
      $io.on(ServerEvent.BroadcastMessage, (data: BroadcastMessage.data) => {
        messages.value.push(data)
        messagesWrap.value?.scrollTo(0, messagesWrap.value.scrollHeight)
      })
      $io.on(ServerEvent.ErrorMessage, (data: ErrorMessage.data) => {
          console.log(data.error)
          console.log(ErrorType.UsernameAlreadyUsed)
        if (data.error === ErrorType.UsernameAlreadyUsed) {
          showUsernamePrompt.value = true
          errorText.value = 'Someone already used the name!'
        }
      })

      const oldUsername = $cookies.get('username')
      if (oldUsername) $io.emit(ClientEvent.SetUsername, oldUsername as SetUsername.data)
      else showUsernamePrompt.value = true
    })

    return {
      messagesWrap,
      messages,
      username,
      msg,
      errorText,
      showUsernamePrompt,
      sendMessage,
      setUsername,
    }
  },
})
</script>

<style lang="sass" scoped>
// to let global sass work, style must have content
#messages
  overflow-wrap: break-word
  overflow-y: auto
  #messages-wrap
    min-height: 100%
    justify-content: flex-end
#username-prompt
  background: #00000090
  &>div
    width: 480px
</style>
