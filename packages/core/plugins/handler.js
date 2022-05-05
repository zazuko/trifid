import path from 'path'
import debugLib from 'debug'

const debug = debugLib('trifid:core')

async function handler (router, config) {
  await this.middleware.mountAll(router, config, async options => {
    debug(' mount handler: %s %o', path.basename(options.module), JSON.stringify(options.options))
    const Handler = await this.moduleLoader(options.module)
    const instance = new Handler(options.options)

    return (req, res, next) => {
      instance.handle(req, res, next)
    }
  })
}

export default handler
