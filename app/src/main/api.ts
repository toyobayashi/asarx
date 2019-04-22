import { openSync, closeSync, readSync } from 'original-fs'

const { createFromBuffer } = require('chromium-pickle-js')

class Api {
  readAsarHeader (path: string) {
    const fd = openSync(path, 'r')
    let headerSizeBuffer = Buffer.alloc(8, 0)
    readSync(fd, headerSizeBuffer, 0, 8, 0)
    const headerSize: number = createFromBuffer(headerSizeBuffer).createIterator().readUInt32()

    let headerBuffer = Buffer.alloc(headerSize, 0)
    readSync(fd, headerBuffer, 0, headerSize, 8)
    closeSync(fd)

    return JSON.parse(createFromBuffer(headerBuffer).createIterator().readString())
  }
}

export default Api
