// import withServer from 'express-as-promise/withServer.js'
// import { describe, it } from 'mocha'
// import trifidFactory from '../index.js'

// const createTrifidConfig = (config, server = {}) => {
//   const loggerSpy = []

//   return {
//     logger: (str) => loggerSpy.push(str),
//     server,
//     config,
//   }
// }

// describe('trifid-plugin-graph-explorer', () => {
//   describe('trifid factory', () => {
//     it('should create a middleware with factory and default options', async () => {
//       await withServer(async (server) => {
//         const trifid = createTrifidConfig({}, server.app)
//         trifidFactory(trifid)
//       })
//     })
//   })
// })
