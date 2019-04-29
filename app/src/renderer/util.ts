export function deepCopy<T> (obj: T): T {
  if (typeof obj !== 'object' || obj === null) return obj

  if (obj instanceof Date) return new Date(obj) as any

  if (Array.isArray(obj)) {
    let res: any = []
    for (let i = 0; i < obj.length; i++) {
      res.push(deepCopy(obj[i]))
    }
    return res
  }

  let res: any = {}

  for (let key in obj) {
    res[key] = deepCopy(obj[key])
  }
  return res
}
