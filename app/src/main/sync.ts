import { ipcMain, Event } from 'electron'

interface ClassMember {
  publicStaticProperties: string[]
  publicStaticMethods: string[]
  publicProperties: string[]
  publicMethods: string[]
}

const objMap: Map<string, any> = new Map<string, any>()
const classMap: Map<string, ClassMember> = new Map<string, ClassMember>()

export function addClass (className: string, ClassConstructor: any) {
  if (classMap.has(className)) return

  const publicMethods = Object.getOwnPropertyNames(ClassConstructor.prototype).filter((name) => typeof ClassConstructor.prototype[name] === 'function' && !(name === 'constructor' || name.startsWith('_')))
  const statics = Object.getOwnPropertyNames(ClassConstructor)
  const publicStaticMethods = statics.filter((name) => typeof ClassConstructor[name] === 'function' && !(name.startsWith('_') || ['name', 'length', 'prototype'].includes(name)))
  const publicStaticProperties = statics.filter((name) => typeof ClassConstructor[name] !== 'function' && !(name.startsWith('_') || ['name', 'length', 'prototype'].includes(name)))
  const publicProperties = Object.keys(new ClassConstructor()).filter((name) => !name.startsWith('_'))

  ipcMain.on(className + '#constructor', (event: Event, oid: string, ...args: any[]) => {
    objMap.set(oid, new ClassConstructor(...args))
    event.returnValue = true
  })

  ipcMain.on(className + '#destructor', (event: Event, oid: string) => {
    objMap.delete(oid)
    event.returnValue = true
  })

  publicMethods.forEach(methodName => {
    ipcMain.on(className + '#' + methodName, (event: Event, ...args: any[]) => {
      if (methodName.endsWith('Sync')) {
        const [oid, ...argv] = args
        if (!objMap.has(oid)) {
          event.returnValue = createResult(new Error(`Object ${oid} has been destroyed.`))
          return
        }
        try {
          const res = objMap.get(oid)[methodName](...argv)
          if (Object.prototype.toString.call(res) === '[object Promise]' || (typeof res === 'object' && res !== null && typeof res.then === 'function')) {
            const p = res.then((value: any) => event.returnValue = createResult(null, value))
            if (typeof p.catch === 'function') {
              p.catch((err: Error) => event.returnValue = createResult(err))
            }
          } else {
            event.returnValue = createResult(null, res)
          }
        } catch (err) {
          event.returnValue = createResult(err)
        }
      } else {
        const [callId, oid, ...argv] = args
        if (!objMap.has(oid)) {
          event.sender.send(className + '#' + methodName, callId, createResult(new Error(`Object ${oid} has been destroyed.`)))
          return
        }
        try {
          const res = objMap.get(oid)[methodName](...argv)
          if (Object.prototype.toString.call(res) === '[object Promise]' || (typeof res === 'object' && res !== null && typeof res.then === 'function')) {
            const p = res.then((value: any) => event.sender.send(className + '#' + methodName, callId, createResult(null, value)))
            if (typeof p.catch === 'function') {
              p.catch((err: Error) => event.sender.send(className + '#' + methodName, callId, createResult(err)))
            }
          } else {
            event.sender.send(className + '#' + methodName, callId, createResult(null, res))
          }
        } catch (err) {
          event.sender.send(className + '#' + methodName, callId, createResult(err))
        }
      }
    })
  })

  publicStaticMethods.forEach(methodName => {
    ipcMain.on(className + '$' + methodName, (event: Event, ...args: any[]) => {
      if (methodName.endsWith('Sync')) {
        try {
          const res = ClassConstructor[methodName](...args)
          if (Object.prototype.toString.call(res) === '[object Promise]' || (typeof res === 'object' && res !== null && typeof res.then === 'function')) {
            const p = res.then((value: any) => event.returnValue = createResult(null, value))
            if (typeof p.catch === 'function') {
              p.catch((err: Error) => event.returnValue = createResult(err))
            }
          } else {
            event.returnValue = createResult(null, res)
          }
        } catch (err) {
          event.returnValue = createResult(err)
        }
      } else {
        const [callId, ...argv] = args
        try {
          const res = ClassConstructor[methodName](...argv)
          if (Object.prototype.toString.call(res) === '[object Promise]' || (typeof res === 'object' && res !== null && typeof res.then === 'function')) {
            const p = res.then((value: any) => event.sender.send(className + '$' + methodName, callId, createResult(null, value)))
            if (typeof p.catch === 'function') {
              p.catch((err: Error) => event.sender.send(className + '$' + methodName, callId, createResult(err)))
            }
          } else {
            event.sender.send(className + '$' + methodName, callId, createResult(null, res))
          }
        } catch (err) {
          event.sender.send(className + '$' + methodName, callId, createResult(err))
        }
      }
    })
  })

  publicProperties.forEach(propertyName => {
    ipcMain.on(className + '#' + propertyName, (event: Event, oid: string, value?: any) => {
      if (!objMap.has(oid)) {
        event.returnValue = createResult(new Error(`Object ${oid} has been destroyed.`))
        return
      }
      if (value) {
        objMap.get(oid)[propertyName] = value
        event.returnValue = createResult(null, true)
      } else {
        event.returnValue = createResult(null, objMap.get(oid)[propertyName])
      }
    })
  })

  publicStaticProperties.forEach(propertyName => {
    ipcMain.on(className + '$' + propertyName, (event: Event, value?: any) => {
      if (value) {
        ClassConstructor[propertyName] = value
        event.returnValue = createResult(null, true)
      } else {
        event.returnValue = createResult(null, ClassConstructor[propertyName])
      }
    })
  })

  classMap.set(className, {
    publicStaticProperties,
    publicStaticMethods,
    publicProperties,
    publicMethods
  })

  ipcMain.on('__syncClass__', (event: Event, className: string) => {
    event.returnValue = classMap.get(className) || null
  })
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

function createResult (e: Error, data?: null): IPCCallFailed
function createResult<T = any> (e: null, data: T): IPCCallSuccess<T>

function createResult (e: any, data: any = null) {
  return {
    err: e && parseError(e),
    data
  }
}
