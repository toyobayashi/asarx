import { getClass } from './sync'
import { join, sep } from 'path'

export default class Asar {

  private _header: AsarNode = { files: {} }
  private _src: string = ''

  constructor (src?: string) {
    if (src) {
      this.load(src)
    }
  }

  public load (src: string): void {
    this._src = src
    if (this._src) {
      const Api: Api = getClass('Api')
      const api = new Api()
      this._header = api.readAsarHeaderSync(this._src)
      api.destroy()
    }
  }

  public getNode (...path: string[]): AsarNode | null {
    return Asar.getNode(this._header, ...path)
  }

  public each (callback: (node: AsarNode, path: string) => boolean | void, path: string = ''): void {
    return Asar.each(this._header, callback, path)
  }

  public static getNode (node: AsarNode, ...path: string[]): AsarNode | null {
    if (!path.length) return null
    let p = join(...path)

    if (p[0] === '/' || p[0] === '\\') p = p.substring(1)

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

  public get header (): AsarNode {
    return this._header
  }
}
