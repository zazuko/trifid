import { Transform } from 'node:stream';
import type { TransformCallback, TransformOptions } from 'node:stream';

class ReplaceStream extends Transform {
  searchStr: string;
  replaceStr: string;
  tailPiece: string;
  searchStrLen: number;

  constructor(searchStr: string, replaceStr: string, options: TransformOptions = {}) {
    super(options);
    this.searchStr = searchStr;
    this.replaceStr = replaceStr;
    this.tailPiece = ''; // Holds trailing data from previous chunk
    this.searchStrLen = searchStr.length;
  }

  _transform(chunk: Buffer | string, _encoding: BufferEncoding, callback: TransformCallback) {
    const data = this.tailPiece + chunk.toString(); // Combine previous tail with new chunk
    let lastIndex = 0;
    let index;

    const pieces = [];

    // Search for occurrences of searchStr
    while ((index = data.indexOf(this.searchStr, lastIndex)) !== -1) {
      pieces.push(data.slice(lastIndex, index)); // Push the data before the match
      pieces.push(this.replaceStr); // Push the replacement string
      lastIndex = index + this.searchStrLen; // Move the index past the match
    }

    // Save the remaining data after the last match as tailPiece
    this.tailPiece = data.slice(lastIndex);

    // Push the processed data
    this.push(pieces.join(''));

    callback();
  }

  _flush(callback: TransformCallback) {
    // Push out any remaining data in tailPiece, processing any matches in it
    this.push(this.tailPiece.replace(new RegExp(this.searchStr, 'g'), this.replaceStr));
    callback();
  }
}

export default ReplaceStream;
