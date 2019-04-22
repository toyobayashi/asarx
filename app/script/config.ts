import getPath from './get-path'

export default {
  devServerHost: 'localhost',
  devServerPort: 6080,
  outputPath: getPath('out'),
  contentBase: getPath('..'),
  publicPath: '/app/out/',

  distPath: getPath('..', 'dist'),
  iconOutDir: 'img',
  iconSrcDir: getPath('res'),

  statsOptions: {
    colors: true,
    children: false,
    modules: false,
    entrypoints: false
  }
}
