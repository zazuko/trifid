// // @ts-check

// import express from 'express'
// import request from 'supertest'
// import { describe, expect, test } from '@jest/globals'

// import redirectPlugin from '../../plugins/redirect.js'

// describe('redirect plugin', () => {
//   test('should throw if the target parameter is not set', () => {
//     expect(() => redirectPlugin({ config: {} })).toThrow()
//   })

//   test('should redirect request', async () => {
//     const app = express()

//     app.use(
//       '/redirect',
//       redirectPlugin({
//         config: {
//           target: '/',
//         },
//         logger: {
//           debug: (_) => { },
//         },
//       }),
//     )

//     return request(app).get('/redirect').expect(302)
//   })

//   test('should not redirect request', async () => {
//     const app = express()

//     app.use(
//       '/redirect',
//       redirectPlugin({
//         config: {
//           target: '/',
//         },
//         logger: {
//           debug: (_) => { },
//         },
//       }),
//     )

//     return request(app).get('/non-existant-route').expect(404)
//   })
// })
