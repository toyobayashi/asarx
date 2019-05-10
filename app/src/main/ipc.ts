// import { ipcMain, Event } from 'electron'

import Api from './api'
import { addClass } from './sync'
// import { ipcMain, Event, nativeImage } from 'electron'
// import { join } from 'path'
// import { tmpdir } from 'os'
// import generateObjectId from '../common/id'
// import { remove } from 'fs-extra'

let initialized = false

export default function initIpc (): void {
  if (initialized) return
  addClass('Api', Api)
  initialized = true

  // ipcMain.on('start-drag', async (ev: Event, asar: IAsar, selected: ListItem[]) => {
  //   const tmpDir = join(tmpdir(), generateObjectId())
  //   const files = selected.map((item) => join(tmpDir, item.path.slice(1)))
  //   console.log(files)
  //   await Api.extractAsarItem(asar, selected.map((item) => item.path), tmpDir)

  //   ev.sender.startDrag({
  //     files,
  //     icon: nativeImage.createFromPath(join(__dirname, require('../../res/img/drag.png')))
  //   } as any)
  //   await remove(tmpDir)
  // })
}

export interface ListItem {
  node: AsarNode | null
  path: string
  focused?: boolean
}
