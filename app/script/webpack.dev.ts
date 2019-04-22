import * as webpack from 'webpack'
import { mainConfig, rendererConfig } from './webpack.config.dev'
import config from './config'
import * as DevServer from 'webpack-dev-server'

if (require.main === module) {
  main()
}

export default function main () {
  return Promise.all([watchMain(), startDevServer()])
}

function startDevServer () {
  return new Promise((resolve, reject) => {
    const devServerOptions = rendererConfig.devServer as DevServer.Configuration
    DevServer.addDevServerEntrypoints(rendererConfig, devServerOptions)
    const server = new DevServer(webpack(rendererConfig), devServerOptions)

    server.listen(config.devServerPort || 6080, config.devServerHost || 'localhost', (err) => {
      if (err) {
        console.log(err)
        process.exit(0)
        reject(err)
        return
      }

      console.log(`Server running at http://localhost:${config.devServerPort || 6080}`)
      resolve()
    })
  })
}

function watchMain () {
  let first = false
  return new Promise<void>((resolve, reject) => {
    const mainCompiler = webpack(mainConfig)
    mainCompiler.watch({
      aggregateTimeout: 200,
      poll: undefined
    }, (err, stats) => {
      console.log(err || (stats.toString(config.statsOptions) + '\n'))
      if (!first) {
        first = true
        err ? reject(err) : resolve()
      }
    })
  })
}
