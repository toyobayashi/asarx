import { getClass } from './sync'

export default class Asar {

  private _header: AsarNode = { files: {} }
  private _src: string = ''

  constructor (src?: string) {
    this._src = src || ''

    if (this._src) {
      const Api: Api = getClass('Api')
      const api = new Api()
      this._header = api.readAsarHeaderSync(this._src)
      api.destroy()
    }
  }

  public load (src: string) {
    this._src = src
    if (this._src) {
      const Api: Api = getClass('Api')
      const api = new Api()
      this._header = api.readAsarHeaderSync(this._src)
      api.destroy()
    }
  }

  public get header () {
    return this._header
  }
}
