/* global Yasr, YasguiMapPluginDefaultOptions */

// Get some custom options from the global scope
if (!YasguiMapPluginDefaultOptions) {
  // eslint-disable-next-line no-global-assign
  YasguiMapPluginDefaultOptions = {}
}
if (!YasguiMapPluginDefaultOptions.mapKind) {
  YasguiMapPluginDefaultOptions.mapKind = 'default'
}

class YasguiMap {
  priority = 10

  hideFromSelection = false
  wktLabels = new Map()

  // eslint-disable-next-line space-before-function-paren
  constructor(yasr) {
    this.yasr = yasr
  }

  getResults () {
    this.wktLabels.clear()
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

    results.forEach((result, rowIndex) => {
      if (!result) {
        return null
      }

      let wktLabel = null
      const wktLabelItem = result.wktLabel || result.xLabel
      if (wktLabelItem && wktLabelItem.type === 'literal') {
        wktLabel = wktLabelItem.value
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

        const id = `results-map-wkt-${entry[0]}-${rowIndex}`
        this.wktLabels.set(id, wktLabel)

        wktData.push({
          id,
          wkt: value.value,
        })
      })
    })

    return wktData
  }

  async draw () {
    await import('./deps.js')
    const { Style, Stroke, Fill } = await import('./style.js')

    const results = this.getResults()
    const el = document.createElement('ol-map')
    el.style.height = '500px'
    el.style.width = '100%'

    // The overlay is used to display the WKT label when a feature is selected
    const overlay = document.createElement('div')
    overlay.style.position = 'absolute'
    overlay.style.bottom = '0px'
    overlay.style.left = '0px'
    overlay.style.background = 'rgb(255, 255, 255)'
    overlay.style.padding = '8px'
    overlay.style.display = 'none'
    overlay.style.zIndex = '10'
    overlay.style.borderTopRightRadius = '5px'
    overlay.style.borderTop = '1px solid #000'
    overlay.style.borderRight = '1px solid #000'
    el.appendChild(overlay)

    let mapLayer = document.createElement('div')
    switch (YasguiMapPluginDefaultOptions?.mapKind) {
      case 'swisstopo':
        mapLayer = document.createElement('swisstopo-wmts')
        mapLayer.setAttribute('layer-name', 'ch.swisstopo.pixelkarte-farbe')
        mapLayer.setAttribute('z-index', '-1')
        break
      default:
        mapLayer = document.createElement('ol-layer-openstreetmap')
        break
    }

    const wkt = document.createElement('ol-layer-wkt')
    const select = document.createElement('ol-select')
    select.style = new Style({
      fill: new Fill({
        color: 'rgba(200,200,255,0.6)',
      }),
      stroke: new Stroke({
        color: '#ffb15e',
        width: 5,
      }),
    })

    mapLayer.appendChild(wkt)
    mapLayer.appendChild(select)
    el.appendChild(mapLayer)
    this.yasr.resultsEl.appendChild(el)

    const editStyle = new Style({
      fill: new Fill({
        color: 'rgba(255,255,255,0.4)',
      }),
      stroke: new Stroke({
        color: '#ffb15e',
        width: 5,
      }),
    })

    select.addEventListener('feature-selected', (e) => {
      const feature = e.detail.feature
      feature.setStyle(editStyle)
      const id = feature.getId()
      if (!this.wktLabels.has(id)) {
        return
      }
      const wktLabel = this.wktLabels.get(id)

      if (wktLabel) {
        overlay.innerText = wktLabel
        overlay.style.display = 'block'
      } else {
        overlay.style.display = 'none'
      }
    })

    select.addEventListener('feature-unselected', () => {
      overlay.style.display = 'none'
    })

    wkt.featureData = results
    wkt.featureStyle = new Style({
      fill: new Fill({
        color: 'rgba(200,200,150,0.6)',
      }),
      stroke: new Stroke({
        color: '#ffb15e',
        width: 5,
      }),
    })

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
