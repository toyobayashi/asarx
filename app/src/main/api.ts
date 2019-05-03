import { openSync, closeSync, readSync, createReadStream, createWriteStream, close, existsSync, statSync, symlink } from 'original-fs'
import { join, sep, basename, dirname } from 'path'
import * as mkdirp from 'mkdirp'

const { createFromBuffer } = require('chromium-pickle-js')

class Api {
  public static readAsarHeaderSync (path: string): { headerSize: number; header: AsarNode } {
    const fd = openSync(path, 'r')
    let headerSizeBuffer = Buffer.alloc(8, 0)
    readSync(fd, headerSizeBuffer, 0, 8, 0)
    const headerSize: number = createFromBuffer(headerSizeBuffer).createIterator().readUInt32()

    let headerBuffer = Buffer.alloc(headerSize, 0)
    readSync(fd, headerBuffer, 0, headerSize, 8)
    closeSync(fd)

    return { headerSize, header: JSON.parse(createFromBuffer(headerBuffer).createIterator().readString()) }
  }

  public static readAsarHeader (path: string): Promise<{ headerSize: number; header: AsarNode }> {
    return new Promise<{ headerSize: number; header: AsarNode }>((resolve, reject) => {
      try {
        resolve(this.readAsarHeaderSync(path))
      } catch (err) {
        reject(err)
      }
    })
  }

  public static mkdirsSync (path: string) {
    if (existsSync(path)) {
      if (statSync(path).isDirectory()) {
        return path
      } else {
        return null
      }
    }

    return mkdirp.sync(path)
  }

  public static async extractAsarItem (asar: IAsar, filenames: string | string[], dest: string, onData?: (info: any) => void): Promise<void> {
    if (typeof filenames === 'string') {
      filenames = filenames ? [filenames] : []
    }
    if (!filenames.length) return

    for (let i = 0; i < filenames.length; i++) {
      asar.fd = await extractAsarItem(asar, filenames[i], dest, onData)
    }

    return new Promise<void>((resolve) => {
      close(asar.fd as number, (err) => {
        if (err) {
          console.log(err)
        }
        resolve()
      })
    })
  }
}

export default Api

async function extractAsarItem (asar: IAsar, filename: string, dest: string, onData?: (info: any) => void): Promise<number> {
  filename = filename.replace(/\\/g, '/')
  let fd: number
  let asarHeader: AsarNode = { files: {} }
  let headerSize: number = 0

  // if (typeof asar === 'string') {
  //   fd = openSync(asar, 'r')

  //   let headerSizeBuffer = Buffer.alloc(8, 0)
  //   readSync(fd, headerSizeBuffer, 0, 8, 0)
  //   headerSize = createFromBuffer(headerSizeBuffer).createIterator().readUInt32()

  //   let headerBuffer = Buffer.alloc(headerSize, 0)
  //   readSync(fd, headerBuffer, 0, headerSize, 8)
  //   asarHeader = JSON.parse(createFromBuffer(headerBuffer).createIterator().readString())

  //   asar = { _src: asar, _header: asarHeader, _headerSize: headerSize, _fd: fd }
  // } else {
  if (asar.header && asar.headerSize && asar.fd) {
    fd = asar.fd
    asarHeader = asar.header
    headerSize = asar.headerSize
  } else {
    asar.fd = fd = openSync(asar.src, 'r')

    let headerSizeBuffer = Buffer.alloc(8, 0)
    readSync(fd, headerSizeBuffer, 0, 8, 0)
    headerSize = createFromBuffer(headerSizeBuffer).createIterator().readUInt32()

    let headerBuffer = Buffer.alloc(headerSize, 0)
    readSync(fd, headerBuffer, 0, headerSize, 8)
    asarHeader = JSON.parse(createFromBuffer(headerBuffer).createIterator().readString())
  }
  // }

  const node = getNode(asarHeader, filename)
  if (!node) return fd

  if (node.files) {
    for (let name in node.files) {
      await extractAsarItem(asar, join(filename, name), join(dest, basename(filename)), onData)
    }
    return fd
  } else {
    const target = join(dest, basename(filename))
    if (!existsSync(dirname(target))) mkdirp.sync(dirname(target))
    if (node.unpacked) {
      return new Promise<number>((resolve, reject) => {
        let len = 0
        console.log(join(asar.src + '.unpacked', filename))
        try {
          createReadStream(join(asar.src + '.unpacked', filename))
            .on('data', (chunk: Buffer) => {
              len += chunk.length
              if (typeof onData === 'function') {
                onData({
                  filename: filename,
                  total: node.size,
                  current: len
                })
              }
            })
            .on('error', (err) => {
              closeSync(fd)
              reject(err)
            })
            .pipe(
              createWriteStream(join(dest, basename(filename)))
                .on('close', () => resolve(fd))
                .on('error', (err) => {
                  closeSync(fd)
                  reject(err)
                })
            )
        } catch (err) {
          reject(err)
          closeSync(fd)
          console.log(err)
          console.log(filename)
        }
      })
    }

    if (node.link) {
      const target = node.link
      return new Promise<number>((resolve, reject) => {
        const stat = statSync(target)
        symlink(target, join(dest, basename(filename)), stat.isDirectory() ? 'dir' : 'file', (err) => {
          if (err) {
            reject(err)
          }
          resolve(fd)
        })
      })
    }

    return new Promise<number>((resolve, reject) => {
      let len = 0
      try {
        if (node.size as number > 0) {
          createReadStream('', {
            fd,
            autoClose: false,
            start: 8 + headerSize + Number(node.offset),
            end: 8 + headerSize + Number(node.offset) + (node.size as number) - 1
          })
            .on('data', (chunk: Buffer) => {
              len += chunk.length
              if (typeof onData === 'function') {
                onData({
                  filename: filename,
                  total: node.size,
                  current: len
                })
              }
            })
            .on('error', (err) => {
              console.log(filename)
              closeSync(fd)
              reject(err)
            })
            .pipe(
              createWriteStream(join(dest, basename(filename)))
                .on('close', () => resolve(fd))
                .on('error', (err) => {
                  console.log(filename)
                  closeSync(fd)
                  reject(err)
                })
            )
        } else {
          closeSync(openSync(join(dest, basename(filename)), 'w'))
          resolve(fd)
        }
      } catch (err) {
        reject(err)
        closeSync(fd)
        console.log(err)
        console.log(filename)
      }
    })
  }
}

function getNode (node: AsarNode, ...path: string[]): AsarNode | null {
  if (!path.length) return null
  let p = join(...path)

  if (p[0] === '/' || p[0] === '\\') p = p.substring(1)
  if (p === '' || p === '.') return node || null

  const paths = p.split(sep)
  let pointer = node.files

  for (let i = 0; i < paths.length - 1; i++) {
    if (pointer === void 0) return null
    if (pointer[paths[i]] !== void 0) {
      pointer = pointer[paths[i]].files
    }
  }

  if (!pointer || pointer[paths[paths.length - 1]] === void 0) return null
  return pointer[paths[paths.length - 1]]
}
