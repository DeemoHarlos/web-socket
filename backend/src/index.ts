import express from 'express'
import http from 'http'
import { Server as SocketServer } from 'socket.io'

import { ServerEvent, BroadcastMessage, ErrorType } from '@api/socketServer'
import { ClientEvent, SendMessage, SetUsername } from '@api/socketClient'

const port = 3001

const app = express()
const server = http.createServer(app)
const io = new SocketServer(server, {
  cors: {
    origin: '*',
  },
})

type User = {
  socketId: string
  username: string
}

const users = [] as User[]

io.on('connection', socket => {
  console.log('New connection!')

  socket.on(ClientEvent.SendMessage, (data: SendMessage.data) => {
    const user = users.find(u => u.socketId === socket.id)
    const username = user?.username
    let message = data
    if (!message) return
    if (message.length > 100) message = message.slice(0, 100)
    message = message.trim()
    io.emit(ServerEvent.BroadcastMessage, {
      username: username || '?',
      message,
    } as BroadcastMessage.data)
  })

  socket.on(ClientEvent.SetUsername, (data: SetUsername.data) => {
    const user = users.find(u => u.username === data)
    if (user && user.socketId !== socket.id) socket.emit('error', {
      error: ErrorType.UsernameAlreadyUsed,
    })
    else {
      const username = data.replace(/\W/g, '').slice(0, 32)
      users.push({ username, socketId: socket.id })
    }
  })

  socket.on('disconnect', _reason => {
    console.log('Disconnected!')
    const userIndex = users.findIndex(u => u.socketId === socket.id)
    if (userIndex >= 0) users.splice(userIndex, 1)
    else console.error('Socket not found.')
  })
})

console.log('Listening on port ' + port)
server.listen(port)
