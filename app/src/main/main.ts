declare module 'electron' {
  interface BrowserWindow {
    removeMenu? (): void
  }
}

import { app, BrowserWindow, BrowserWindowConstructorOptions, nativeImage } from 'electron'
import { format } from 'url'
import { join } from 'path'
import { existsSync } from 'fs'

import initIpc from './ipc'

let mainWindow: BrowserWindow | null

async function createWindow () {
  const browerWindowOptions: BrowserWindowConstructorOptions = {
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  }

  if ((process as any).isLinux) {
    let linuxIcon: string
    try {
      linuxIcon = require(`../res/icon/1024x1024.png`)
    } catch (_) {
      linuxIcon = ''
    }
    if (linuxIcon) {
      browerWindowOptions.icon = nativeImage.createFromPath(join(__dirname, linuxIcon))
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      let icon: string = ''

      const iconPath = join(__dirname, `../res/icon/app.${process.platform === 'win32' ? 'ico' : 'icns'}`)
      if (existsSync(iconPath)) icon = iconPath

      if (icon) {
        browerWindowOptions.icon = nativeImage.createFromPath(icon)
      }
    }
  }

  mainWindow = new BrowserWindow(browerWindowOptions)

  mainWindow.on('ready-to-show', function () {
    if (!mainWindow) return
    mainWindow.show()
    mainWindow.focus()
    if (process.env.NODE_ENV !== 'production') mainWindow.webContents.openDevTools()
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  if (process.env.NODE_ENV !== 'production') {
    const config = require('../../script/config').default
    return mainWindow.loadURL(`http://${config.devServerHost}:${config.devServerPort}${config.publicPath}`)
  } else {
    typeof mainWindow.removeMenu === 'function' ? mainWindow.removeMenu() : mainWindow.setMenu(null)
    return mainWindow.loadURL(format({
      pathname: join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    }))
  }
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow().catch(err => {
      console.error(err)
      app.quit()
    })
  }
})

// tslint:disable-next-line: strict-type-predicates
typeof app.whenReady === 'function' ? app.whenReady().then(main).catch(err => {
  console.log(err)
  app.quit()
}) : app.on('ready', main)

function main (): void {
  initIpc()
  if (!mainWindow) {
    createWindow().catch(err => {
      console.error(err)
      process.exit(0)
    })
  }
}
