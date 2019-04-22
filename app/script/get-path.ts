import { join } from 'path'

export default function getPath (...relative: string[]) {
  return join(__dirname, '..', ...relative)
}
