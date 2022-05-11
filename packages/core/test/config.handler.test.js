import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, expect, test } from '@jest/globals'

import handler from '../lib/config/handler.js'
import { fileCallback } from '../lib/resolvers.js'

describe('config handler', () => {
  test('should not throw when loading an empty configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(handler(fileCallback(currentDir)('./config/empty.json'))).resolves.not.toThrow()
  })

  test('should not throw when loading a basic configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(handler(fileCallback(currentDir)('./config/basic.json'))).resolves.not.toThrow()
  })

  test('should throw when trying to load a non-existant configuration file', async () => {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    await expect(handler(fileCallback(currentDir)('./config/non-existant.json'))).rejects.toThrow()
  })
})
