import callMain from './ipc'

export function readAsarHeader (path: string): Promise<any> {
  return callMain('readAsarHeader', path)
}
