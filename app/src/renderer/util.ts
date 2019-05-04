let show = false

import { ipcRenderer, remote } from 'electron'

export function deepCopy<T> (obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj

  if (obj instanceof Date) return new Date(obj) as any

  if (Array.isArray(obj)) {
    let res: any = []
    for (let i = 0; i < obj.length; i++) {
      res.push(deepCopy(obj[i]))
    }
    return res
  }

  let res: any = {}

  for (let key in obj) {
    res[key] = deepCopy(obj[key])
  }
  return res
}

export function showWindow (): void {
  if (!show) {
    ipcRenderer.send('ready-to-show')
    show = true
  }
}

export function openFile (): Promise<string> {
  return new Promise<string>((resolve) => {
    remote.dialog.showOpenDialog({
      properties: ['openFile', 'showHiddenFiles']
    }, (filePaths) => {
      if (filePaths && filePaths.length) {
        resolve(filePaths[0])
      } else {
        resolve('')
      }
    })
  })
}

export function formatSize (size: number): string {
  if (size < 1024) {
    return `${size} Byte`
  }

  if (size < 1024 * 1024) {
    return `${(Math.floor(100 * size / 1024) / 100).toFixed(2)} KB`
  }

  if (size < 1024 * 1024 * 1024) {
    return `${(Math.floor(100 * size / 1024 / 1024) / 100).toFixed(2)} MB`
  }

  if (size < Number.MAX_SAFE_INTEGER) {
    return `${(Math.floor(100 * size / 1024 / 1024 / 1024) / 100).toFixed(2)} GB`
  }

  return 'Out of Range'
}
