import { ipcRenderer, Event } from 'electron'
import createObjectId from '../common/id'

export default function callMain <T = any> (apiName: string, ...args: any[]) {
  return new Promise<T>((resolve, reject) => {
    let _id: string | null = createObjectId()

    ipcRenderer.once(apiName, (_e: Event, id: string, err: any, res: T) => {
      if (id === _id) {
        _id = null
        if (err) {
          reject(createError(err))
        } else {
          resolve(res)
        }
      }
    })

    ipcRenderer.send(apiName, _id, ...args)
  })
}

function createError (obj: any) {
  const g: any = typeof window === 'undefined' ? global : window
  const err = new g[obj._constructor]()
  delete obj._constructor

  for (let key in obj) {
    err[key] = obj[key]
  }

  return err
}
