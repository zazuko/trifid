import fs from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import Handlebars from 'handlebars'
import merge from 'lodash/merge.js'

import type {
  ConfigRecord,
  RegisterTemplateHelper,
  RenderFunction,
  TemplateEngineInstance,
} from '../types/index.ts'

const currentDir = dirname(fileURLToPath(import.meta.url))

/**
 * Resolved template engine options (after merging the defaults with the
 * user-provided options).
 */
interface TemplateOptions {
  files: Record<string, string>
  partials: Record<string, string>
  title: string
  scripts: string[]
  styles: string[]
  body: string
  disableHeader: boolean
  disableFooter: boolean
  [key: string]: unknown
}

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
 * Create a new template engine instance.
 *
 * @param defaultOptions Default optioons for the template engine.
 * @param locals Trifid locals.
 * @returns Template engine instance.
 */
const templateEngine = async (
  defaultOptions: ConfigRecord,
  locals: Map<string, unknown>,
): Promise<TemplateEngineInstance> => {
  const registerHelper: RegisterTemplateHelper = (name, fn) => {
    Handlebars.registerHelper(name, fn)
  }

  registerHelper('ifEquals', (arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) => {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this)
  })

  const templateOptions = merge({}, defaultConfig, defaultOptions) as TemplateOptions

  const resolvedTemplates = new Map<string, Handlebars.TemplateDelegate>()

  const resolveTemplate = async (path: string): Promise<Handlebars.TemplateDelegate> => {
    const cached = resolvedTemplates.get(path)
    if (cached && !forceRefresh) {
      return cached
    }
    const template = await fs.readFile(path)
    const compiled = Handlebars.compile(`${template}`)
    resolvedTemplates.set(path, compiled)
    return compiled
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
      Object.entries(templateOptions.files).map(
        async (t): Promise<[string, Handlebars.TemplateDelegate]> => [
          t[0],
          await resolveTemplate(t[1]),
        ],
      ),
    ),
  )
  const templatesWithoutMain = Object.fromEntries(
    Object.entries(templates).filter((t) => t[0] !== 'main'),
  )
  const mainTemplate = templates.main
  if (!mainTemplate) {
    throw new Error("no 'main' template was defined")
  }

  const render: RenderFunction = async (request, templatePath, context, options = {}) => {
    const session = request ? Object.fromEntries(request.session.entries()) : {}
    const template = await resolveTemplate(templatePath)
    const localsObject = Object.fromEntries(locals.entries())
    const mergedSession = merge(session, context.session as ConfigRecord | undefined)
    const mergedLocals = merge(localsObject, context.locals as ConfigRecord | undefined)
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
