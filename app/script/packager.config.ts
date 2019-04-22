import { arch as packagerArch, Options } from 'electron-packager'
import getPath from './get-path'
import { join } from 'path'
import { execSync } from 'child_process'
import * as pkg from '../package.json'
import { existsSync } from 'fs'
import config from './config'

if (process.argv.slice(2)[0] !== 'ia32' && process.argv.slice(2)[0] !== 'x64') {
  throw new Error('ARCH requrie "ia32" or "x64"')
}

export const arch = process.argv.slice(2)[0] as packagerArch

interface ProductionPackage {
  name: string
  version: string
  main: string
  author: string
  license: string
  dependencies?: { [module: string]: string }
  _commit?: string
  _commitDate?: string
}

export const productionPackage: ProductionPackage = {
  name: pkg.name,
  version: pkg.version,
  main: pkg.main,
  author: typeof pkg.author === 'object' ? (pkg.author as any).name as string : pkg.author,
  license: pkg.license
}

if ((pkg as any).dependencies) {
  productionPackage.dependencies = (pkg as any).dependencies
}

try {
  productionPackage._commit = execSync('git rev-parse HEAD').toString().replace(/[\r\n]/g, '')
  productionPackage._commitDate = new Date((execSync('git log -1').toString().match(/Date:\s*(.*?)\n/) as any)[1]).toISOString()
} catch (err) {
  console.log(require('chalk').yellowBright('\n  [WARN] Not a git repository.\n'))
}

const packagerOptions: Options = {
  dir: getPath(),
  out: config.distPath,
  arch: arch,
  ignore: /node_modules|res|src|script|README|tslint\.json|tsconfig|package-lock\.json|\.git|\.vscode|\.npmrc/,
  appCopyright: `Copyright (C) ${new Date().getFullYear()} ${productionPackage.author}`,
  download: {
    mirror: process.env.npm_config_electron_mirror || 'https://npm.taobao.org/mirrors/electron/'
  },
  overwrite: true
}

if (process.platform === 'win32') {
  const iconPath = join(config.iconSrcDir, 'app.ico')
  if (existsSync(iconPath)) {
    packagerOptions.icon = iconPath
  }
} else if (process.platform === 'darwin') {
  const iconPath = join(config.iconSrcDir, 'app.icns')
  if (existsSync(iconPath)) {
    packagerOptions.icon = iconPath
  }
}

export { packagerOptions }
