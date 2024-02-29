// @ts-check

/** @type {import('../types/index.js').TrifidMiddleware} */
const factory = async (trifid) => {
  const { logger, server } = trifid

  const locals = server.locals

  const defaultLanguage = 'en'
  const supportedLanguages = ['en', 'fr', 'de', 'it']

  const oneMonthMilliseconds = 60 * 60 * 24 * 30 * 1000

  /**
   * Hook to configure the language in the locals.
   *
   * @param {import('fastify').FastifyRequest<{ Querystring: { lang: string }}> & { session: Map<string, any> }} request Request.
   * @param {import('fastify').FastifyReply} reply Reply.
   * @param {import('fastify').DoneFuncWithErrOrRes} done Done function.
   */
  const onRequestHookHandler = (request, reply, done) => {
    const currentLanguage = request.cookies.i18n || defaultLanguage
    request.session.set('defaultLanguage', defaultLanguage)
    request.session.set('currentLanguage', currentLanguage)

    const langQuery = request.query.lang || ''
    if (langQuery && supportedLanguages.includes(langQuery)) {
      logger.debug(`set default language to '${langQuery}'`)
      reply.setCookie('i18n', langQuery, { maxAge: oneMonthMilliseconds })
      request.session.set('currentLanguage', langQuery)
    }

    if (!locals.has('t') || typeof locals.get('t') !== 'function') {
      /**
       * Dummy translation function.
       * @param {string} x Translation key.
       * @returns {string} Translation value.
       */
      const t = (x) => {
        const translation = x.substring(x.indexOf(':') + 1)
        logger.debug(`translation value: ${translation}`)
        return translation
      }
      locals.set('t', t)
    }

    done()
  }
  server.addHook('onRequest', onRequestHookHandler)
}

export default factory
