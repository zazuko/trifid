import Handlebars from 'handlebars'
import merge from 'lodash/merge.js'

const templateEngine = async (defaultOptions = {}) => {
  // TODO: load this dynamically from file
  const main = Handlebars.compile(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>{{#if title}}{{ title }}{{else}}Trifid{{/if}}</title>
      </head>
      <body>
        {{#unless noHeader}}
          {{{ header }}}
        {{/unless}}

        {{{ body }}}

        {{#unless noFooter}}
          {{{ footer }}}
        {{/unless}}
      </body>
    </html>
  `)

  /**
   * Render the full page.
   *
   * @param {string} template Handlebars template path.
   * @param {Record<string, any>} context Context for the rendered view.
   * @param {Record<string, any>} options Options to pass for the main view.
   * @returns {string} The rendered view
   */
  const render = (templatePath, context, options = {}) => {
    const template = templatePath
    const body = Handlebars.compile(template)(context)
    const renderedOptions = merge({}, defaultOptions, options)

    return main({
      ...renderedOptions,
      body
    })
  }

  return render
}

export default templateEngine
