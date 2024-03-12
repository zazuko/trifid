// @ts-check

import i18n from 'i18n'

const I18n = i18n.I18n

/** @type {i18n.ConfigurationOptions} */
const defaults = {
  queryParameter: 'lang',
  directory: 'locales',
  indent: '  ',
  extension: '.json',
  objectNotation: true,
  logDebugFn: (_msg) => { },
  logWarnFn: (_msg) => { },
  logErrorFn: (_msg) => { },
}

/** @type {import('../core/types/index.js').TrifidPlugin} */
const factory = async (trifid) => {
  const { config, registerTemplateHelper, server } = trifid

  // Force user to define the `directory` parameter
  if (!config.directory || typeof config.directory !== 'string') {
    throw new Error(
      "The 'directory' configuration field should be a non-empty string.",
    )
  }

  const i18nInstance = new I18n({
    ...defaults,
    ...config,
  })

  /**
   * Hook to configure the language in the locals.
   *
   * @param {import('fastify').FastifyRequest<{ Querystring: { lang: string }}> & { session: Map<string, any> }} request Request.
   * @param {import('fastify').FastifyReply} _reply Reply.
   * @param {import('fastify').DoneFuncWithErrOrRes} done Done function.
   */
  const onRequestHookHandler = (request, _reply, done) => {
    const session = request.session
    const currentLanguage = session.get('currentLanguage') || session.get('defaultLanguage') || 'en'
    i18nInstance.setLocale(currentLanguage)
    const t = (/** @type {string} **/ phrase) => i18nInstance.__({
      phrase,
      locale: currentLanguage,
    })
    session.set('t', t)

    registerTemplateHelper('i18n', (/** @type {string} **/ value) => {
      return t(value)
    })

    done()
  }
  server.addHook('onRequest', onRequestHookHandler)
}

export default factory
