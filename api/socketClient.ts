export enum ClientEvent {
  SetUsername = 'username',
  SendMessage = 'message',
}

export namespace SetUsername {
  export type data = string
}

export namespace SendMessage {
  export type data = string
}
