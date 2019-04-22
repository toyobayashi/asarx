import { spawn } from 'child_process'
import getPath from './get-path'
import * as electron from 'electron'

function start () {
  let cp = spawn(electron as any, [getPath()], { stdio: 'inherit' })

  cp.on('exit', (code: number | null, signal: string | null) => {
    console.log('code: ' + code)
    console.log('signal: ' + signal)
    process.exit(code || 0)
  })
}

if (process.env.NODE_ENV === 'production') {
  import('./webpack.prod').then((main) => main.default()).then(start)
} else if (process.env.NODE_ENV === 'development') {
  import('./webpack.dev').then((main) => main.default()).then(start)
} else {
  start()
}
