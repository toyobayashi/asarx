import { getClass } from './sync'
import { join, sep } from 'path'

const Api: Api = getClass('Api')

export default class Asar implements IAsar {
  public header: AsarNode = { files: {} }
  public src: string = ''
  public headerSize: number = 0

  constructor (src?: string) {
    if (src) {
      this.load(src)
    }
  }

  public load (src: string): void {
    this.src = src
    if (this.src) {
      const res = Api.readAsarHeaderSync(this.src)
      this.header = res.header
      this.headerSize = res.headerSize
    }
  }

  public extractItems (filenames: string | string[], dest: string, onData?: (info: any) => void): Promise<void> {
    return Api.extractAsarItem(this, filenames, dest, onData)
  }

  public getNode (...path: string[]): AsarNode | null {
    return Asar.getNode(this.header, ...path)
  }

  public each (callback: (node: AsarNode, path: string) => boolean | void, path: string = ''): void {
    return Asar.each(this.header, callback, path)
  }

  public static getNode (node: AsarNode, ...path: string[]): AsarNode | null {
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

  public static each (node: AsarNode, callback: (node: AsarNode, path: string) => boolean | void, path: string = ''): void {
    if (!callback(node, path)) {
      if (node.files) {
        for (let name in node.files) {
          Asar.each(node.files[name], callback, join(path, name))
        }
      }
    }
  }

  public static totalSize (node: AsarNode): number {
    let res = 0
    if (node.files) {
      for (let name in node.files) {
        res += Asar.totalSize(node.files[name])
      }
    } else {
      res += (node.size || 0)
    }
    return res
  }
}
