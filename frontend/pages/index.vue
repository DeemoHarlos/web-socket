<template lang="pug">
  .flex-column.vh-100.bg-dark.text-light
    #messages.flex-fill(ref="messagesContainer")
      #messages-wrap.flex-column.px-3.py-2
        .message.flex-row.text-break.my-1(v-for="message in messages")
          span.text-warning.mr-2: b {{ message.username }}
          span {{ message.message }}
    form.flex-row.p-2.bg-secondary(@submit="sendMessage")
      div.btn.btn-warning(@click="onUsernameClick") {{ username }}
      input.flex-fill(type="text" v-model="msg" @change="onTextChange")
      button.btn.btn-primary(type="button" @click="sendMessage") SEND
    #username-prompt.position-fixed.d-flex.middle-center.w-100.vh-100(v-if="showUsernamePrompt")
      .bg-light.p-4
        div Please enter your username
        form.flex-row(@submit="setUsername")
          input.flex-fill(type="text" v-model="newUsername")
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

    const messagesContainer = ref<HTMLElement | null>(null)
    const messages = ref<BroadcastMessage.data[]>([])
    const username = ref('')
    const newUsername = ref('')
    const msg = ref('')
    const errorText = ref('')
    const showUsernamePrompt = ref(false)

    const sendMessage = (e: Event) => {
      e.preventDefault()
      if (!msg.value) return
      $io.emit(ClientEvent.SendMessage, msg.value as SendMessage.data)
      msg.value = ''
    }

    const setUsername = (e: Event) => {
      e.preventDefault()
      const legalUsername = newUsername.value.replace(/\W/g, '').slice(0, 32)
      if (!legalUsername) {
        errorText.value = 'Username can only contain alphabets, numbers and underscores.'
        return
      }
      showUsernamePrompt.value = false
      if (legalUsername === username.value) return
      username.value = legalUsername
      newUsername.value = legalUsername
      $io.emit(ClientEvent.SetUsername, legalUsername as SetUsername.data)
      showUsernamePrompt.value = false
      errorText.value = ''
      $cookies.set('username', legalUsername, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    }

    const onUsernameClick = (e: Event) => {
      e.preventDefault()
      showUsernamePrompt.value = true
    }

    const onTextChange = () => {
      if (msg.value.length > 100) msg.value = msg.value.slice(0, 100)
      msg.value = msg.value.trim()
    }

    onMounted(() => {
      $io.on(ServerEvent.BroadcastMessage, (data: BroadcastMessage.data) => {
        messages.value.push(data)
        setTimeout(() => {
          messagesContainer.value?.scrollTo(
            0,
            messagesContainer.value.scrollHeight,
          )
        }, 0)
      })
      $io.on(ServerEvent.ErrorMessage, (data: ErrorMessage.data) => {
          console.log(data.error)
          console.log(ErrorType.UsernameAlreadyUsed)
        if (data.error === ErrorType.UsernameAlreadyUsed) {
          username.value = '?'
          showUsernamePrompt.value = true
          errorText.value = 'Someone already used the name!'
        }
      })

      const oldUsername = $cookies.get('username')
      if (oldUsername) {
        $io.emit(ClientEvent.SetUsername, oldUsername as SetUsername.data)
        username.value = oldUsername
        newUsername.value = oldUsername
      } else showUsernamePrompt.value = true
    })

    return {
      messagesContainer,
      messages,
      username,
      newUsername,
      msg,
      errorText,
      showUsernamePrompt,
      sendMessage,
      setUsername,
      onUsernameClick,
      onTextChange,
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
