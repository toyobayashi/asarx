// MongoDB ObjectId String Generator
const generateObjectId = (function () {
  let processUnique = ''
  for (let i = 0; i < 5; i++) {
    processUnique += toHex(Math.floor(Math.random() * 256))
  }
  let index = ~~(Math.random() * 0xffffff)

  function toHex (num: number) {
    let hex = num.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  function generateObjectId () {
    let time = ~~(Date.now() / 1000)
    let timeString = ''
    let indexString = ''
    timeString += toHex((time >> 24) & 0xff)
    timeString += toHex((time >> 16) & 0xff)
    timeString += toHex((time >> 8) & 0xff)
    timeString += toHex((time) & 0xff)

    indexString += toHex((index >> 16) & 0xff)
    indexString += toHex((index >> 8) & 0xff)
    indexString += toHex((index) & 0xff)
    index++
    return timeString + processUnique + indexString
  }

  generateObjectId.isObjectId = function (str: string) {
    return /^[0123456789abcdef]{24}$/.test(str)
  }

  return generateObjectId
})()

export default generateObjectId
