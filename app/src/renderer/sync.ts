import { ipcRenderer } from 'electron'
import generateObjectId from '../common/id'

const classMap: Map<string, any> = new Map<string, any>()

export function getClass (className: string) {
  if (classMap.has(className)) return classMap.get(className)

  const classMember: any = ipcRenderer.sendSync('__syncClass__', className)
  console.log(classMember)
  if (!classMember) return null

  class Clazz {
    private _id: string = generateObjectId()

    constructor (...args: any[]) {
      const oid = this._id
      ipcRenderer.sendSync(className + '#constructor', oid, ...args)
      classMember.publicProperties.forEach((name: string) => {
        Object.defineProperty(this, name, {
          configurable: true,
          enumerable: true,
          get () {
            return getMainSync(className + '#' + name, oid)
          },
          set (value) {
            setMainSync(className + '#' + name, oid, value)
          }
        })
      })
    }

    destroy () {
      ipcRenderer.sendSync(className + '#destructor', this._id)
    }
  }

  classMember.publicStaticProperties.forEach((name: string) => {
    Object.defineProperty(Clazz, name, {
      configurable: true,
      enumerable: true,
      get () {
        return getMainSync(className + '$' + name, null)
      },
      set (value) {
        setMainSync(className + '$' + name, null, value)
      }
    })
  })

  classMember.publicMethods.forEach((methodName: string) => {
    (Clazz.prototype as any)[methodName] = function (...args: any[]) {
      return methodName.endsWith('Sync') ? callMainSync(className + '#' + methodName, this._id, ...args) : callMain(className + '#' + methodName, this._id, ...args)
    }
  })

  classMember.publicStaticMethods.forEach((methodName: string) => {
    (Clazz as any)[methodName] = function (...args: any[]) {
      return methodName.endsWith('Sync') ? callMainSync(className + '$' + methodName, null, ...args) : callMain(className + '$' + methodName, null, ...args)
    }
  })

  classMap.set(className, Clazz)
  return Clazz
}

function callMain <T = any> (methodName: string, oid: string | null, ...args: any[]): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let _callId: string | null = generateObjectId()

    ipcRenderer.once(methodName, (_e: Event, callId: string, res: IPCCallResult<T>) => {
      if (callId === _callId) {
        _callId = null
        if (res.err) {
          reject(createError(res.err))
        } else {
          resolve(res.data)
        }
      }
    })

    if (oid === null) {
      ipcRenderer.send(methodName, _callId, ...args)
    } else {
      ipcRenderer.send(methodName, _callId, oid, ...args)
    }
  })
}

function callMainSync<T = any> (methodName: string, oid: string | null, ...args: any[]): T {
  const res: IPCCallResult<T> = oid === null ? ipcRenderer.sendSync(methodName, ...args) : ipcRenderer.sendSync(methodName, oid, ...args)
  if (res.err) {
    throw createError(res.err)
  }
  return res.data
}

function getMainSync<T> (propertyName: string, oid: string | null): T {
  const res: IPCCallResult<T> = oid === null ? ipcRenderer.sendSync(propertyName) : ipcRenderer.sendSync(propertyName, oid)
  if (res.err) {
    throw createError(res.err)
  }
  return res.data
}

function setMainSync (propertyName: string, oid: string | null, value: any): boolean {
  const res: IPCCallResult<boolean> = oid === null ? ipcRenderer.sendSync(propertyName, value) : ipcRenderer.sendSync(propertyName, oid, value)
  if (res.err) {
    throw createError(res.err)
  }
  return res.data
}

function createError (obj: ErrorObject): Error {
  // tslint:disable-next-line: strict-type-predicates
  const g: any = typeof window === 'undefined' ? global : window
  const err = g[obj._constructor] ? new g[obj._constructor]() : new Error()
  delete obj._constructor

  for (let key in obj) {
    err[key] = obj[key]
  }

  return err
}
