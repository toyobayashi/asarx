declare interface AsarNode {
  _open?: boolean
  _active?: boolean
  // _focused?: boolean
  // _path?: string
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
  readAsarHeader (path: string): Promise<{ headerSize: number; header: AsarNode }>
  readAsarHeaderSync (path: string): { headerSize: number; header: AsarNode }
  extractAsarItem (asar: IAsar, filenames: string | string[], dest: string, onData?: (info: any) => void): Promise<void>
  mkdirsSync (path: string): string | null
  getPackageSync (): any
  readFileSizeSync (path: string): number
}

declare interface IAsar {
  src: string
  header: AsarNode
  headerSize: number
  fd?: number
}
