import { html } from 'lit'

function Term (entity, options, context, renderedAsRoot) {
  if (renderedAsRoot) {
    const url = entity.term.termType === 'BlankNode' ? '' : entity.term.value

    return html`<a href="${url}" id="${entity.term.value}" title=" ${entity.term.value}">${entity.label.string ? entity.label.string : entity.term.value}</a>`
  }

  if (entity.renderAs === 'Image') {
    return html`<img alt="${entity.term.value}" src="${entity.term.value}">`
  }

  function resolveUrl () {
    if (options?.urlRewrite && options.urlRewrite(entity)) {
      return options.urlRewrite(entity)
    }
    if (context.primaryNodes.has(entity.term)) {
      return `#${entity.term.value}`
    }
    return entity.term.value
  }

  const url = resolveUrl()

  if (entity.term.termType === 'NamedNode') {
    return html`<a href="${url}" title="${entity.term.value}">${entity.label.string ? entity.label.string : entity.term.value}</a>`
  }

  if (entity.term.termType === 'BlankNode') {
    return html`<a href="${url}" title="${entity.term.value}">${entity.label.string ? entity.label.string : entity.term.value}</a>`
  }

  return html`<span>${entity.label.string ? entity.label.string : entity.term.value}</span>`
}

function TermWithCues (entity, options, context, renderedAsRoot) {
  const spans = []
  if (entity.label.vocab && options?.technicalCues) {
    spans.push(html`<span class="vocab">${entity.label.vocab}</span>`)
  }
  spans.push(Term(entity, options, context, renderedAsRoot))

  if (entity.label.language && options?.technicalCues) {
    spans.push(html`<span class="language">${entity.label.language}</span>`)
  }
  if (entity.label.datatype && options?.technicalCues) {
    spans.push(html`<span class="datatype">${entity.label.datatype.vocab}:${entity.label.datatype.string}</span>`)
  }

  if (options?.highLightLanguage && entity.label.language) {
    const isHighLight = entity.label.language === options.highLightLanguage
    return isHighLight
      ? html`
        <div>${spans}</div>`
      : html`
        <div class="bringDown">${spans}</div>`
  }

  return html`
      <div>${spans}</div>`
}

function Row (row, options, context) {
  const predicatesList = html`
      <ul> ${row.properties.map(property => html`
          <li>${TermWithCues(property, options, context)}</li>`)}
      </ul>`

  const valuesList = row.renderAs === 'List'
    ? html`
      <ol>${row.values.map(value => html`
          <li>${TermWithCues(value, options, context)}</li>`)}
      </ol>`
    : html`
      <ul>${row.values.map(value => html`
          <li>${Entity(value, options, context)}</li>`)}
      </ul>`

  return html`
      <div class="row">
          ${predicatesList}
          ${valuesList}
      </div>`
}

function Entity (item, options, context, renderedAsRoot) {
  const rows = item.rows ? item.rows.map(row => Row(row, options, context)) : []

  const term = TermWithCues(item, options, context, renderedAsRoot)

  if (item.rows) {
    return html`
        <div class="entity">
            <div class="header ${item.term.termType}"><h3>${term}</h3></div>
            <div class="rows">
                ${rows}
            </div>
        </div>`
  } else {
    return term
  }
}

export { Entity }
