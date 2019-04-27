// import { ipcMain, Event } from 'electron'

import Api from './api'
import { addClass } from './sync'

let initialized = false

export default function initIpc (): void {
  if (initialized) return
  addClass('Api', Api)
  initialized = true
}
