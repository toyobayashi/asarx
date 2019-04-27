import { openSync, closeSync, readSync } from 'original-fs'

const { createFromBuffer } = require('chromium-pickle-js')

class Api {
  public readAsarHeaderSync (path: string): AsarNode {
    const fd = openSync(path, 'r')
    let headerSizeBuffer = Buffer.alloc(8, 0)
    readSync(fd, headerSizeBuffer, 0, 8, 0)
    const headerSize: number = createFromBuffer(headerSizeBuffer).createIterator().readUInt32()

    let headerBuffer = Buffer.alloc(headerSize, 0)
    readSync(fd, headerBuffer, 0, headerSize, 8)
    closeSync(fd)

    return JSON.parse(createFromBuffer(headerBuffer).createIterator().readString())
  }

  public readAsarHeader (path: string): Promise<AsarNode> {
    return new Promise<AsarNode>((resolve, reject) => {
      try {
        resolve(this.readAsarHeaderSync(path))
      } catch (err) {
        reject(err)
      }
    })
  }

  // private static _instance: Api | null = null

  // public static getInstance (): Api {
  //   return this._instance || (this._instance = new Api())
  // }
  test = 1
  // constructor () {
  //   if (Api._instance) {
  //     return Api._instance
  //   }
  //   return (Api._instance = this)
  // }
}

export default Api
