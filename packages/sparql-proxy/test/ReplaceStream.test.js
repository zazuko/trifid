import { PassThrough } from 'node:stream'
import { expect } from 'chai'
import { describe, it } from 'mocha'
import ReplaceStream from '../lib/ReplaceStream.js'

describe('ReplaceStream', () => {
  it('should replace a single occurrence of a string', (done) => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    const receivedData = []

    input.pipe(replaceStream).pipe(output)

    output.setEncoding('utf8')
    output.on('data', (data) => {
      receivedData.push(data)
    })

    output.on('end', () => {
      expect(receivedData.join('')).to.equal('new string')
      done()
    })

    input.write('old string')
    input.end()
  })

  it('should replace multiple occurrences of a string', (done) => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    const receivedData = []

    input.pipe(replaceStream).pipe(output)

    output.setEncoding('utf8')
    output.on('data', (data) => {
      receivedData.push(data)
    })

    output.on('end', () => {
      expect(receivedData.join('')).to.equal('new string with new value')
      done()
    })

    input.write('old string with old value')
    input.end()
  })

  it('should replace strings that span across chunks', (done) => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    const receivedData = []

    input.pipe(replaceStream).pipe(output)

    output.setEncoding('utf8')
    output.on('data', (data) => {
      receivedData.push(data)
    })

    output.on('end', () => {
      expect(receivedData.join('')).to.equal('new and new')
      done()
    })

    input.write('ol')
    input.write('d and ol')
    input.write('d')
    input.end()
  })

  it('should handle no occurrences of the string', (done) => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    input.pipe(replaceStream).pipe(output)

    output.setEncoding('utf8')
    output.on('data', (data) => {
      expect(data).to.equal('no match here')
    })

    output.on('end', done)

    input.write('no match here')
    input.end()
  })

  it('should handle empty input', (done) => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    input.pipe(replaceStream).pipe(output)

    output.setEncoding('utf8')
    output.on('data', (data) => {
      expect(data).to.equal('')
    })

    output.on('end', done)

    input.end()
  })

  it('should handle large input with multiple replacements', (done) => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    const largeInput = 'old '.repeat(1000)
    const expectedOutput = 'new '.repeat(1000)

    input.pipe(replaceStream).pipe(output)

    let result = ''
    output.setEncoding('utf8')
    output.on('data', (data) => {
      result += data
    })

    output.on('end', () => {
      expect(result).to.equal(expectedOutput)
      done()
    })

    input.write(largeInput)
    input.end()
  })
})
