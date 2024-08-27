import { Transform } from 'node:stream'

class ReplaceStream extends Transform {
  constructor(searchStr, replaceStr, options = {}) {
    super(options)
    this.searchStr = searchStr
    this.replaceStr = replaceStr
    this.tailPiece = '' // Holds trailing data from previous chunk
  }

  _transform (chunk, encoding, callback) {
    const data = this.tailPiece + chunk.toString() // Combine previous tail with new chunk
    let lastIndex = 0

    // Array to hold the processed pieces
    const processedPieces = []

    let index
    // Search for the searchStr in the data
    while ((index = data.indexOf(this.searchStr, lastIndex)) !== -1) {
      // Push the data before the match and the replacement string
      processedPieces.push(data.slice(lastIndex, index))
      processedPieces.push(this.replaceStr)
      lastIndex = index + this.searchStr.length
    }

    // Save the remaining data in tailPiece
    this.tailPiece = data.slice(lastIndex)

    // Push the processed pieces
    this.push(processedPieces.join(''))

    callback()
  }

  _flush (callback) {
    // Handle any remaining data in tailPiece
    if (this.tailPiece.includes(this.searchStr)) {
      this.push(this.tailPiece.replace(this.searchStr, this.replaceStr))
    } else {
      this.push(this.tailPiece)
    }
    callback()
  }
}

export default ReplaceStream
