declare interface AsarNode {
  files?: {
    [item: string]: AsarNode
  }
  size?: number
  offset?: string
  unpacked?: boolean
  executable?: boolean
  link?: string
}

declare type ErrorObject = {
  message?: string
  stack?: string
  _constructor: string
  [key: string]: any
}

declare type IPCCallSuccess<T> = {
  err: null
  data: T
}

declare type IPCCallFailed = {
  err: ErrorObject
  data: null
}

declare type IPCCallResult<T = any> = IPCCallSuccess<T> | IPCCallFailed

declare interface Api {
  new (): {
    test: number
    readAsarHeader (path: string): Promise<AsarNode>
    readAsarHeaderSync (path: string): AsarNode
    destroy (): void
  }

  readAsarHeader (path: string): Promise<AsarNode>
  readAsarHeaderSync (path: string): AsarNode
}
