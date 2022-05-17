import fs from 'fs/promises'
import Handlebars from 'handlebars'
import merge from 'lodash/merge.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))

const defaultConfig = {
  templates: {
    main: `${currentDir}/../views/layouts/main.hbs`,
    header: `${currentDir}/../views/partials/header.hbs`,
    footer: `${currentDir}/../views/partials/footer.hbs`
  },
  title: 'Trifid',
  scripts: [],
  styles: [],
  body: '',
  disableHeader: false,
  disableFooter: false
}

const templateEngine = async (defaultOptions = {}, forceRefresh = false) => {
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

  if (!templateOptions?.templates) {
    throw new Error('no base template found')
  }

  if (!templateOptions?.templates?.main) {
    throw new Error("no 'main' template was defined")
  }

  const templates = Object.fromEntries(
    await Promise.all(
      Object.entries(templateOptions.templates).map(async (t) => [t[0], await resolveTemplate(t[1])])
    )
  )
  const templatesWithoutMain = Object.fromEntries(Object.entries(templates).filter((t) => t[0] !== 'main'))
  const mainTemplate = templates.main

  /**
   * Render the full page.
   *
   * @param {string} templatePath Handlebars template path.
   * @param {Record<string, any>} context Context for the rendered view.
   * @param {Record<string, any>} options Options to pass for the main view.
   * @returns {string} The rendered view
   */
  const render = async (templatePath, context, options = {}) => {
    const template = await resolveTemplate(templatePath)
    const body = template(context)

    const renderedOptions = merge({}, templateOptions, options)
    const renderedPartials = Object.fromEntries(
      Object.entries(templatesWithoutMain).map(t => [t[0], t[1](renderedOptions)])
    )

    return mainTemplate({
      ...renderedOptions,
      ...renderedPartials,
      body
    })
  }

  return render
}

export default templateEngine
