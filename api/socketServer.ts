export enum ServerEvent {
  BroadcastMessage = 'message',
  ErrorMessage = 'error',
}

export enum ErrorType {
  UsernameAlreadyUsed = 'UsernameAlreadyUsed'
}

export namespace BroadcastMessage {
  export type data = {
    username: string
    message: string
  }
}

export namespace ErrorMessage {
  export type data = {
    error: ErrorType
  }
}
