import { ipcMain, Event } from 'electron'

import Api from './api'

let initialized = false

export default function initIpc (): void {
  if (initialized) return
  const fun = Object.getOwnPropertyNames(Api.prototype)
  const api: any = new Api()

  fun.forEach(methodName => {
    if (methodName === 'constructor') return
    ipcMain.on(methodName, ({ sender }: Event, id: string, ...args: any[]) => {
      try {
        const res = api[methodName](...args)
        if (Object.prototype.toString.call(res) === '[object Promise]' || typeof res.then === 'function') {
          const p = res.then(() => sender.send(methodName, id, null, res === undefined ? null : res))
          if (typeof p.catch === 'function') {
            p.catch((err: Error) => sender.send(methodName, id, parseError(err), null))
          }
        } else {
          sender.send(methodName, id, null, res === undefined ? null : res)
        }
      } catch (err) {
        sender.send(methodName, id, parseError(err), null)
      }
    })
  })

  initialized = true
}

function parseError (err: Error) {
  const keys = Object.getOwnPropertyNames(err)
  let obj: any = {}
  for (let i = 0; i < keys.length; i++) {
    obj[keys[i]] = err[keys[i] as keyof Error]
  }
  obj._constructor = err.constructor.name
  return obj
}
