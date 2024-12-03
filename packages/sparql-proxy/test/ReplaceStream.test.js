import { PassThrough } from 'node:stream'
import { describe, it } from 'node:test'
import { equal } from 'node:assert'

import ReplaceStream from '../lib/ReplaceStream.js'

describe('ReplaceStream', () => {
  it('should replace a single occurrence of a string', async () => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()
    const receivedData = []

    input.pipe(replaceStream).pipe(output)
    output.setEncoding('utf8')
    output.on('data', (data) => {
      receivedData.push(data)
    })

    await new Promise((resolve) => {
      output.on('end', () => {
        equal(receivedData.join(''), 'new string')
        resolve()
      })
      input.write('old string')
      input.end()
    })
  })

  it('should replace multiple occurrences of a string', async () => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()
    const receivedData = []

    input.pipe(replaceStream).pipe(output)
    output.setEncoding('utf8')
    output.on('data', (data) => {
      receivedData.push(data)
    })

    await new Promise((resolve) => {
      output.on('end', () => {
        equal(receivedData.join(''), 'new string with new value')
        resolve()
      })
      input.write('old string with old value')
      input.end()
    })
  })

  it('should replace strings that span across chunks', async () => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()
    const receivedData = []

    input.pipe(replaceStream).pipe(output)
    output.setEncoding('utf8')
    output.on('data', (data) => {
      receivedData.push(data)
    })

    await new Promise((resolve) => {
      output.on('end', () => {
        equal(receivedData.join(''), 'new and new')
        resolve()
      })
      input.write('ol')
      input.write('d and ol')
      input.write('d')
      input.end()
    })
  })

  it('should handle no occurrences of the string', async () => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    input.pipe(replaceStream).pipe(output)
    output.setEncoding('utf8')
    output.on('data', (data) => {
      equal(data, 'no match here')
    })

    await new Promise((resolve) => {
      output.on('end', resolve)
      input.write('no match here')
      input.end()
    })
  })

  it('should handle empty input', async () => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()

    input.pipe(replaceStream).pipe(output)
    output.setEncoding('utf8')
    output.on('data', (data) => {
      equal(data, '')
    })

    await new Promise((resolve) => {
      output.on('end', resolve)
      input.end()
    })
  })

  it('should handle large input with multiple replacements', async () => {
    const replaceStream = new ReplaceStream('old', 'new')
    const input = new PassThrough()
    const output = new PassThrough()
    let result = ''

    const largeInput = 'old '.repeat(1000)
    const expectedOutput = 'new '.repeat(1000)

    input.pipe(replaceStream).pipe(output)
    output.setEncoding('utf8')
    output.on('data', (data) => {
      result += data
    })

    await new Promise((resolve) => {
      output.on('end', () => {
        equal(result, expectedOutput)
        resolve()
      })
      input.write(largeInput)
      input.end()
    })
  })
})
