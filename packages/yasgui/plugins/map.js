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
    textIcon.innerText = '🌐'
    return textIcon
  }
}

Yasr.registerPlugin('Map', YasguiMap)
