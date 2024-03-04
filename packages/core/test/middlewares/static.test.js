// // @ts-check

// import { dirname } from 'path'
// import { fileURLToPath } from 'url'
// import express from 'express'
// import request from 'supertest'
// import { describe, expect, test } from '@jest/globals'

// import staticPlugin from '../../plugins/static.js'

// describe('static plugin', () => {
//   test('should throw if the directory parameter is not set', () => {
//     expect(() => staticPlugin({ config: {} })).toThrow()
//   })

//   test('should not throw if the directory parameter is set', () => {
//     const currentDir = dirname(fileURLToPath(import.meta.url))
//     expect(() =>
//       staticPlugin({
//         config: {
//           directory: `${currentDir}/../support/`,
//         },
//       }),
//     ).not.toThrow()
//   })

//   test('should serve the specified resource', () => {
//     const currentDir = dirname(fileURLToPath(import.meta.url))
//     const app = express()

//     app.use(
//       staticPlugin({
//         config: {
//           directory: `${currentDir}/../support`,
//         },
//       }),
//     )

//     return request(app)
//       .get('/test.txt')
//       .expect(200)
//       .expect('Content-Type', /text\/plain/)
//       .expect(/some text/)
//   })

//   test('should return a 404 on non-existant resources', () => {
//     const currentDir = dirname(fileURLToPath(import.meta.url))
//     const app = express()

//     app.use(
//       staticPlugin({
//         config: {
//           directory: `${currentDir}/../support/`,
//         },
//       }),
//     )

//     return request(app).get('/test-not-exist.txt').expect(404)
//   })
// })
