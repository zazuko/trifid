/* global Yasr, YasguiMapPluginDefaultOptions */

// Get some custom options from the global scope
if (!YasguiMapPluginDefaultOptions) {
  // eslint-disable-next-line no-global-assign
  YasguiMapPluginDefaultOptions = {};
}
if (!YasguiMapPluginDefaultOptions.mapKind) {
  YasguiMapPluginDefaultOptions.mapKind = 'default';
}

const WKT_DATATYPE = 'http://www.opengis.net/ont/geosparql#wktLiteral';

const FEATURE_COLOR = '#ff441c';
const featureStyle = {
  color: FEATURE_COLOR,
  weight: 3,
  fillColor: FEATURE_COLOR,
  fillOpacity: 0.2,
};
const highlightStyle = {
  color: FEATURE_COLOR,
  weight: 4,
  fillColor: FEATURE_COLOR,
  fillOpacity: 0.6,
};

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer noopener">OpenStreetMap</a> contributors';
const SWISSTOPO_ATTRIBUTION = '&copy; <a href="https://www.swisstopo.admin.ch/" target="_blank" rel="noreferrer noopener">swisstopo</a>';

// Swisstopo publishes its WMTS tiles in Web Mercator (EPSG:3857), which is the
// projection Leaflet uses by default, so they can be used as plain XYZ tiles.
const swisstopoUrl = (layerName) => `https://wmts.geo.admin.ch/1.0.0/${layerName}/default/current/3857/{z}/{x}/{y}.jpeg`;

// Base layers, keyed by the `mapKind` option. The first one is the default, and
// a layer switcher is only shown when a kind offers more than one.
const baseLayers = {
  default: [
    {
      name: 'Street map',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: { maxZoom: 19, attribution: OSM_ATTRIBUTION },
    },
  ],
  swisstopo: [
    {
      name: 'National map',
      url: swisstopoUrl('ch.swisstopo.pixelkarte-farbe'),
      options: { maxZoom: 19, attribution: SWISSTOPO_ATTRIBUTION },
    },
    {
      name: 'Aerial imagery',
      url: swisstopoUrl('ch.swisstopo.swissimage'),
      options: { maxZoom: 19, attribution: SWISSTOPO_ATTRIBUTION },
    },
  ],
};

/**
 * GeoSPARQL WKT literals may carry a CRS URI prefix, for example
 * `<http://www.opengis.net/def/crs/OGC/1.3/CRS84> POINT(7.44 46.94)`.
 * Coordinates are always interpreted as WGS84, like the previous OpenLayers
 * based implementation did, so the prefix is simply removed.
 *
 * @param {string} wkt Raw WKT literal.
 * @returns {string} WKT literal without its optional CRS prefix.
 */
const stripCrsPrefix = (wkt) => wkt.replace(/^\s*<[^>]*>\s*/, '');

/**
 * Build the popup shown when a geometry is clicked. Besides the label, it lists
 * the other values of the row the geometry comes from, which makes the map
 * usable to explore the result set and not only to locate it.
 *
 * @param {string|undefined} label Label of the feature, if any.
 * @param {Array<[string, string]>} properties Other values of the row.
 * @returns {HTMLElement} Popup content.
 */
const buildPopup = (label, properties) => {
  const content = document.createElement('div');

  if (label) {
    const title = document.createElement('div');
    title.className = 'trifid-map-popup-title';
    title.textContent = label;
    content.appendChild(title);
  }

  if (properties.length > 0) {
    const table = document.createElement('table');
    table.className = 'trifid-map-popup-table';
    properties.forEach(([name, value]) => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('th');
      nameCell.textContent = name;
      const valueCell = document.createElement('td');
      valueCell.textContent = value;
      row.appendChild(nameCell);
      row.appendChild(valueCell);
      table.appendChild(row);
    });
    content.appendChild(table);
  }

  return content;
};

/**
 * A Leaflet control toggling the fullscreen mode of the map container, so that
 * a result set can be inspected on more than the 500px the plugin gets.
 *
 * @param {object} L Leaflet module.
 * @returns {object} The control instance.
 */
const buildFullscreenControl = (L) => {
  const control = L.control({ position: 'topleft' });

  control.onAdd = (map) => {
    const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    const button = L.DomUtil.create('a', '', container);
    button.href = '#';
    button.title = 'Toggle fullscreen';
    button.setAttribute('role', 'button');
    button.style.fontSize = '16px';
    button.style.textDecoration = 'none';
    button.textContent = '⛶';

    L.DomEvent.on(button, 'click', (event) => {
      L.DomEvent.stop(event);
      const target = map.getContainer();
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if (target.requestFullscreen) {
        target.requestFullscreen();
      }
    });

    // Leaflet needs to re-measure the container after the transition
    document.addEventListener('fullscreenchange', () => {
      setTimeout(() => map.invalidateSize(), 100);
    });

    return container;
  };

  return control;
};

class YasguiMap {
  priority = 10;

  hideFromSelection = false;
  map = undefined;

  constructor(yasr) {
    this.yasr = yasr;
  }

  getResults() {
    if (
      !this.yasr
      || !this.yasr.results
      || !this.yasr.results.json
      || !this.yasr.results.json.results
      || !this.yasr.results.json.results.bindings
    ) {
      return [];
    }

    const results = this.yasr.results.json.results.bindings;

    if (results.length < 1) {
      return [];
    }

    const wktData = [];

    results.forEach((result) => {
      if (!result) {
        return null;
      }

      const wktEntries = Object.entries(result).filter((entry) => {
        const value = entry[1];
        if (!value) {
          return false;
        }
        if (!value.type || value.type !== 'literal') {
          return false;
        }
        if (!value.datatype || value.datatype !== WKT_DATATYPE) {
          return false;
        }
        if (!value.value) {
          return false;
        }
        return true;
      });

      if (wktEntries.length === 0) {
        return null;
      }

      const geometryColumns = wktEntries.map((entry) => entry[0]);

      wktEntries.forEach((entry) => {
        const columnName = entry[0];
        const wktEntry = entry[1];

        // A `<column>Label` column, if any, is used as the feature label
        const labelField = result[`${columnName}Label`];
        const label = labelField && labelField.type === 'literal'
          ? labelField.value
          : undefined;

        // The remaining columns of the row are shown in the popup. Geometries
        // and the label itself would only be noise there.
        const properties = Object.entries(result)
          .filter(([name, value]) => {
            if (geometryColumns.includes(name) || name === `${columnName}Label`) {
              return false;
            }
            return Boolean(value && value.value);
          })
          .map(([name, value]) => [name, value.value]);

        wktData.push({
          wkt: wktEntry.value,
          label,
          properties,
        });
      });
    });

    return wktData;
  }

  async draw() {
    const { L, wktToGeoJSON } = await import('./deps.js');

    const results = this.getResults();

    const features = [];
    results.forEach((result) => {
      let geometry;
      try {
        geometry = wktToGeoJSON(stripCrsPrefix(result.wkt));
      } catch {
        // Ignore geometries that cannot be parsed, so that a single invalid
        // value does not prevent the other ones from being displayed.
        return;
      }
      if (!geometry) {
        return;
      }
      features.push({
        type: 'Feature',
        geometry,
        properties: { label: result.label, values: result.properties },
      });
    });

    // Leaflet cannot reuse a container that already holds a map
    if (this.map) {
      this.map.remove();
      this.map = undefined;
    }

    const el = document.createElement('div');
    el.style.height = '500px';
    el.style.width = '100%';

    // Clear the results element and append the map
    this.yasr.resultsEl.textContent = '';
    this.yasr.resultsEl.appendChild(el);

    const map = L.map(el);
    this.map = map;

    const kinds = baseLayers[YasguiMapPluginDefaultOptions.mapKind] || baseLayers.default;
    const tileLayers = {};
    kinds.forEach((kind, index) => {
      const tileLayer = L.tileLayer(kind.url, kind.options);
      tileLayers[kind.name] = tileLayer;
      // The first one is the default
      if (index === 0) {
        tileLayer.addTo(map);
      }
    });
    if (kinds.length > 1) {
      L.control.layers(tileLayers, undefined, { collapsed: false }).addTo(map);
    }

    L.control.scale({ imperial: false }).addTo(map);
    buildFullscreenControl(L).addTo(map);

    const markerIcon = L.icon({
      iconUrl: '/yasgui-public/marker-icon.svg',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });

    const layer = L.geoJSON(features, {
      style: () => featureStyle,
      pointToLayer: (_feature, latlng) => L.marker(latlng, { icon: markerIcon }),
      onEachFeature: (feature, featureLayer) => {
        const { label, values } = feature.properties || {};
        if (label || (values && values.length > 0)) {
          featureLayer.bindPopup(() => buildPopup(label, values || []));
        }

        // Markers already have their own hover behaviour
        if (typeof featureLayer.setStyle !== 'function') {
          return;
        }
        featureLayer.on('mouseover', () => featureLayer.setStyle(highlightStyle));
        featureLayer.on('mouseout', () => featureLayer.setStyle(featureStyle));
      },
    }).addTo(map);

    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 18 });
    } else {
      // Fall back to a view of Switzerland when there is nothing to fit
      map.setView([46.8, 8.2], 7);
    }

    // The plugin may be drawn while its tab is still hidden, in which case
    // Leaflet cannot measure the container yet.
    setTimeout(() => map.invalidateSize(), 200);
  }

  canHandleResults() {
    const results = this.getResults();
    return results.length > 0;
  }

  getIcon() {
    const textIcon = document.createElement('div');
    textIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>';
    return textIcon;
  }
}

Yasr.registerPlugin('Map', YasguiMap);
