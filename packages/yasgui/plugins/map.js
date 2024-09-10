/* global Yasr */

class YasguiMap {
  priority = 10

  hideFromSelection = false

  // eslint-disable-next-line space-before-function-paren
  constructor(yasr) {
    this.yasr = yasr
  }

  getResults () {
    if (
      !this.yasr ||
      !this.yasr.results ||
      !this.yasr.results.json ||
      !this.yasr.results.json.results ||
      !this.yasr.results.json.results.bindings
    ) {
      return []
    }

    const results = this.yasr.results.json.results.bindings

    if (results.length < 1) {
      return []
    }

    const wktData = []

    // eslint-disable-next-line array-callback-return
    results.map((result, rowIndex) => {
      if (!result) {
        return null
      }

      Object.entries(result).forEach((entry) => {
        if (!entry[1]) {
          return
        }
        const value = entry[1]
        if (!value.type || value.type !== 'literal') {
          return
        }
        if (
          !value.datatype ||
          value.datatype !== 'http://www.opengis.net/ont/geosparql#wktLiteral'
        ) {
          return
        }
        if (!value.value) {
          return
        }

        wktData.push({
          id: `results-map-wkt-${entry[0]}-${rowIndex}`,
          wkt: value.value,
        })
      })
    })

    return wktData
  }

  draw () {
    import('./deps.js')

    const results = this.getResults()
    const el = document.createElement('ol-map')
    el.style.height = '500px'
    el.style.width = '100%'
    const osm = document.createElement('ol-layer-openstreetmap')
    const wkt = document.createElement('ol-layer-wkt')
    osm.appendChild(wkt)
    el.appendChild(osm)
    this.yasr.resultsEl.appendChild(el)

    wkt.featureData = results

    setTimeout(() => {
      wkt.fit()
    }, 200)
  }

  canHandleResults () {
    const results = this.getResults()
    return results.length > 0
  }

  getIcon () {
    const textIcon = document.createElement('div')
    textIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>'
    return textIcon
  }
}

Yasr.registerPlugin('Map', YasguiMap)
