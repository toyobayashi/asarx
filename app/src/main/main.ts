declare module 'electron' {
  interface BrowserWindow {
    removeMenu? (): void
  }
}

import 'electron-function-ipc/main'
import { app, BrowserWindow, BrowserWindowConstructorOptions, nativeImage, dialog, ipcMain, WebContents } from 'electron'
import { format } from 'url'
import { join, extname } from 'path'
import { existsSync } from 'original-fs'

import initIpc from './ipc'

let mainWindow: BrowserWindow | null

async function createWindow () {
  const browerWindowOptions: BrowserWindowConstructorOptions = {
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
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

  ipcMain.once('ready-to-show', function () {
    if (!mainWindow) return
    mainWindow.show()
    mainWindow.focus()
    if (process.env.NODE_ENV !== 'production') mainWindow.webContents.openDevTools()
  })

  mainWindow.on('closed', function () {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', function (this: WebContents, _e: Event) {
    const args = process.argv.slice(1).filter(arg => !arg.startsWith('-'))
    let readyToShow = false
    for (let i = 0; i < args.length; i++) {
      console.log(args[i])
      if (extname(args[i]) === '.asar') {
        if (existsSync(args[i])) {
          this.send('open-asar', args[i])
        } else {
          dialog.showErrorBox('Error', `File not found: ${args[i]}`)
          this.send('open-asar', '')
        }
        readyToShow = true
        break
      }
    }
    if (!readyToShow) {
      this.send('open-asar', '')
    }
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
