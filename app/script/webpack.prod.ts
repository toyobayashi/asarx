import * as webpack from 'webpack'
import { mainConfig, rendererConfig } from './webpack.config.prod'
import config from './config'

if (require.main === module) {
  main()
}

export default function main () {
  return Promise.all([
    webpackPromise(mainConfig),
    webpackPromise(rendererConfig)
  ])
}

function webpackPromise (option: webpack.Configuration) {
  return new Promise<void>((resolve, reject) => {
    webpack(option, (err, stats) => {
      if (err) {
        console.log(err)
        return reject(err)
      }
      console.log(stats.toString(config.statsOptions) + '\n')
      resolve()
    })
  })
}
