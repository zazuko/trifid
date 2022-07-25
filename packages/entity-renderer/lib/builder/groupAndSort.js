import rdf from 'rdf-ext'
import { ns } from '../namespaces.js'

function sortProperties (a, b) {
  if (!b.properties) {
    return 0
  }
  if (!a.properties) {
    return 0
  }

  if ((a.properties.length === 1) && (b.properties.length === 1)) {
    if (ns.rdf.type.equals(b.properties[0].term)) {
      return 1
    }
    if (ns.rdf.type.equals(a.properties[0].term)) {
      return -1
    }
    const idA = a.properties[0].term.value.toUpperCase()
    const idB = b.properties[0].term.value.toUpperCase()
    if (idA < idB) {
      return -1
    }
    if (idA > idB) {
      return 1
    }
    return 0
  }

  return b.properties.length < a.properties.length
}


function groupByValue (rows) {
  const rowsByObject = new Map()
  const eqSet = (a, b) => a.size === b.size && [...a].every(value => b.has(value))

  function hasKey (key1) {
    for (const [key2] of rowsByObject) {
      if (eqSet(key1, key2)) {
        return true
      }
    }
  }

  function get (key1) {
    for (const [key2, value] of rowsByObject) {
      if (eqSet(key1, key2)) {
        return value
      }
    }
  }

  for (const row of rows) {
    const objectTarget = rdf.termSet(row.values.map(value => value.term))
    if (hasKey(objectTarget)) {
      const currentTarget = get(objectTarget)
      currentTarget.properties = [...currentTarget.properties, ...row.properties]
    } else {
      rowsByObject.set(objectTarget, row)
    }
  }
  return [...rowsByObject.values()]
}

export { groupByValue, sortProperties }
