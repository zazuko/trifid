// @ts-check

import fs from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Handlebars from 'handlebars'
import merge from 'lodash/merge.js'

const currentDir = dirname(fileURLToPath(import.meta.url))

const defaultConfig = {
  files: {
    main: `${currentDir}/../views/layouts/main.hbs`,
    header: `${currentDir}/../views/partials/header.hbs`,
    footer: `${currentDir}/../views/partials/footer.hbs`,
  },
  partials: {},
  title: 'Trifid',
  scripts: [],
  styles: [],
  body: '',
  disableHeader: false,
  disableFooter: false,
}

const forceRefresh = false

/**
 * Register a new helper.
 *  - name: Name of the helper.
 *  - fn: Helper function.
 *
 * @typedef {(name: string, fn: import('handlebars').HelperDelegate) => void} RegisterHelperFunction
 */

/**
 * Render a view.
 *
 * @typedef {(request: import('fastify').FastifyRequest & { session: Map<string, any> }, templatePath: string, context: Record<string, any>, options: Record<string, any>) => Promise<string>} RenderFunction
 */

/**
 * Create a new template engine instance.
 *
 * @param {Object} defaultOptions Default optioons for the template engine.
 * @param {Map<string, any>} locals Trifid locals.
 * @returns {Promise<{ render: RenderFunction, registerHelper: RegisterHelperFunction }>} Template engine instance.
 */
const templateEngine = async (defaultOptions, locals) => {
  /**
   * @type {RegisterHelperFunction}
   */
  const registerHelper = (name, fn) => {
    Handlebars.registerHelper(name, fn)
  }

  registerHelper('ifEquals', (arg1, arg2, options) => {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this)
  })

  const templateOptions = merge({}, defaultConfig, defaultOptions)

  const resolvedTemplates = new Map()

  const resolveTemplate = async (path) => {
    if (!resolvedTemplates.has(path) || forceRefresh) {
      const template = await fs.readFile(path)
      const compiled = Handlebars.compile(`${template}`)
      resolvedTemplates.set(path, compiled)
    }
    return resolvedTemplates.get(path)
  }

  if (!templateOptions?.files) {
    throw new Error('no files defined')
  }

  if (!templateOptions?.files?.main) {
    throw new Error("no 'main' template was defined")
  }

  // Register all partials
  Object.entries(templateOptions.partials).map(async (t) => {
    const partialName = t[0]
    const partialPath = t[1]
    const resolvedPartial = await resolveTemplate(partialPath)
    Handlebars.registerPartial(partialName, resolvedPartial)
  })

  const templates = Object.fromEntries(
    await Promise.all(
      Object.entries(templateOptions.files).map(async (t) => [
        t[0],
        await resolveTemplate(t[1]),
      ]),
    ),
  )
  const templatesWithoutMain = Object.fromEntries(
    Object.entries(templates).filter((t) => t[0] !== 'main'),
  )
  const mainTemplate = templates.main

  /**
   * @type {RenderFunction}
   */
  const render = async (request, templatePath, context, options = {}) => {
    const session = request ? Object.fromEntries(request.session.entries()) : {}
    const template = await resolveTemplate(templatePath)
    const localsObject = Object.fromEntries(locals.entries())
    const mergedSession = merge(session, context.session)
    const mergedLocals = merge(localsObject, context.locals)
    const mergedContext = merge({}, context)
    mergedContext.locals = mergedLocals
    mergedContext.session = mergedSession
    const body = template(mergedContext)

    const renderedOptions = merge({}, mergedContext, templateOptions, options)
    const renderedPartials = Object.fromEntries(
      Object.entries(templatesWithoutMain).map((t) => [
        t[0],
        t[1](renderedOptions),
      ]),
    )

    return mainTemplate({
      ...renderedOptions,
      ...renderedPartials,
      body,
    })
  }

  return { render, registerHelper }
}

export default templateEngine
