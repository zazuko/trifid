// @ts-check

import { strictEqual } from 'node:assert'
import { readFile } from 'node:fs/promises'
import { describe, it, beforeEach, afterEach } from 'node:test'
import { expect } from 'chai'
import * as chai from 'chai'
import chaiSubset from 'chai-subset'
import * as xml from 'xml2js'
import xpath from 'xml2js-xpath'
import { convertLegacyFrequency } from '../src/xml.js'
import { createTrifidInstance, getListenerURL } from './support/utils.js'

chai.use(chaiSubset)

/**
 * Remove prefixes from the body.
 *
 * @param {string} body The body to remove prefixes from.
 * @returns {string} The body with prefixes removed.
 */
const removePrefixesFromBody = (body) => {
  return body.replace(/<rdf:RDF.*>/g, '<rdf:RDF>')
}

describe('@zazuko/trifid-plugin-ckan', () => {
  let trifidListener
  const parser = new xml.Parser({
    explicitArray: false,
  })

  beforeEach(async () => {
    const trifidInstance = await createTrifidInstance({ logLevel: 'warn' })
    trifidListener = await trifidInstance.start()
  })

  afterEach(async () => {
    await trifidListener.close()
  })

  describe('basic tests', () => {
    it('should answer with a 400 status code if the organization parameter is missing', async () => {
      const ckanUrl = `${getListenerURL(trifidListener)}/ckan`
      const res = await fetch(ckanUrl)
      strictEqual(res.status, 400)
    })

    it('should get an empty result for an unknown organization', async () => {
      const ckanUrl = `${getListenerURL(trifidListener)}/ckan?organization=http://example.com/unkown-org`

      const res = await fetch(ckanUrl)
      const body = await res.text()
      const expectedResult = await readFile(new URL('./support/empty-result.xml', import.meta.url), 'utf8')

      strictEqual(res.status, 200)
      strictEqual(removePrefixesFromBody(body), expectedResult)
    })

    describe('example organization', () => {
      let res
      let xmlText
      let xmlBody

      beforeEach(async () => {
        const ckanUrl = `${getListenerURL(trifidListener)}/ckan?organization=http://example.com/my-org`
        res = await fetch(ckanUrl)
        xmlText = await res.text()
        xmlBody = await parser.parseStringPromise(xmlText)
      })

      it('should get a basic result for a known organization', async () => {
        const expectedResult = await readFile(new URL('./support/basic-result.xml', import.meta.url), 'utf8')

        strictEqual(res.status, 200)
        strictEqual(removePrefixesFromBody(xmlText), expectedResult)
      })

      it('should take publisher at face value', async () => {
        const publisher = xpath.evalFirst(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcterms:publisher')

        const expected = await parser.parseStringPromise(`
        <foaf:Organization>
          <foaf:name>http://example.com/my-org</foaf:name>
        </foaf:Organization>`)
        expect(publisher).to.containSubset(expected)
      })

      it('should get landing page resource', () => {
        const landingPage = xpath.evalFirst(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcat:landingPage')

        expect(landingPage.$['rdf:resource']).to.eq('https://example.com/')
      })
    })

    it('should convert legacy frequency to EU frequency if possible', async () => {
      const legacyFreqPrefix = 'http://purl.org/cld/freq'
      const euFreqPrefix = 'http://publications.europa.eu/resource/authority/frequency'

      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/annual`), `${euFreqPrefix}/ANNUAL`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/semiannual`), `${euFreqPrefix}/ANNUAL_2`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/threeTimesAYear`), `${euFreqPrefix}/ANNUAL_3`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/biennial`), `${euFreqPrefix}/BIENNIAL`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/bimonthly`), `${euFreqPrefix}/BIMONTHLY`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/biweekly`), `${euFreqPrefix}/BIWEEKLY`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/continuous`), `${euFreqPrefix}/CONT`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/daily`), `${euFreqPrefix}/DAILY`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/irregular`), `${euFreqPrefix}/IRREG`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/monthly`), `${euFreqPrefix}/MONTHLY`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/semimonthly`), `${euFreqPrefix}/MONTHLY_2`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/threeTimesAMonth`), `${euFreqPrefix}/MONTHLY_3`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/quarterly`), `${euFreqPrefix}/QUARTERLY`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/triennial`), `${euFreqPrefix}/TRIENNIAL`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/weekly`), `${euFreqPrefix}/WEEKLY`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/semiweekly`), `${euFreqPrefix}/WEEKLY_2`)
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/threeTimesAWeek`), `${euFreqPrefix}/WEEKLY_3`)

      // Should not convert unknown frequencies
      strictEqual(convertLegacyFrequency(`${legacyFreqPrefix}/unknown`), `${legacyFreqPrefix}/unknown`)

      // Should not convert EU frequencies
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/ANNUAL`), `${euFreqPrefix}/ANNUAL`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/ANNUAL_2`), `${euFreqPrefix}/ANNUAL_2`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/ANNUAL_3`), `${euFreqPrefix}/ANNUAL_3`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/BIENNIAL`), `${euFreqPrefix}/BIENNIAL`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/BIMONTHLY`), `${euFreqPrefix}/BIMONTHLY`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/BIWEEKLY`), `${euFreqPrefix}/BIWEEKLY`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/CONT`), `${euFreqPrefix}/CONT`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/DAILY`), `${euFreqPrefix}/DAILY`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/IRREG`), `${euFreqPrefix}/IRREG`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/MONTHLY`), `${euFreqPrefix}/MONTHLY`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/MONTHLY_2`), `${euFreqPrefix}/MONTHLY_2`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/MONTHLY_3`), `${euFreqPrefix}/MONTHLY_3`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/QUARTERLY`), `${euFreqPrefix}/QUARTERLY`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/TRIENNIAL`), `${euFreqPrefix}/TRIENNIAL`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/WEEKLY`), `${euFreqPrefix}/WEEKLY`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/WEEKLY_2`), `${euFreqPrefix}/WEEKLY_2`)
      strictEqual(convertLegacyFrequency(`${euFreqPrefix}/WEEKLY_3`), `${euFreqPrefix}/WEEKLY_3`)
    })
  })

  describe('BLW tests', () => {
    let xmlBody

    beforeEach(async () => {
      const ckanUrl = `${getListenerURL(trifidListener)}/ckan?organization=https://register.ld.admin.ch/opendataswiss/org/bundesamt-fur-landwirtschaft-blw`
      const res = await fetch(ckanUrl)
      xmlBody = await parser.parseStringPromise(await res.text())
    })

    it('should get a correct contactPoint', async () => {
      const contactPoint = xpath.evalFirst(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcat:contactPoint')

      const expected = await parser.parseStringPromise(`
        <vcard:Organization>
          <vcard:fn>Bundesamt für Landwirtschaft, Fachbereich Marktanalysen</vcard:fn>
          <vcard:hasEmail rdf:resource="mailto:marktanalysen@blw.admin.ch"/>
        </vcard:Organization>`)
      expect(contactPoint).to.containSubset(expected)
    })

    it('should get structured publisher', async () => {
      const publisher = xpath.evalFirst(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcterms:publisher')

      const expected = await parser.parseStringPromise(`
        <foaf:Organization rdf:about="https://register.ld.admin.ch/opendataswiss/org/bundesamt-fur-landwirtschaft-blw">
          <foaf:name>Bundesamt für Landwirtschaft</foaf:name>
        </foaf:Organization>`)
      expect(publisher).to.containSubset(expected)
    })

    it('should get landing page resource', () => {
      const landingPage = xpath.evalFirst(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcat:landingPage')

      expect(landingPage.$['rdf:resource']).to.eq('https://agrarmarktdaten.admin.ch')
    })

    it('should use mapped themes', () => {
      const themes = xpath.find(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcat:theme')
        .map(theme => theme.$['rdf:resource'])

      expect(themes).to.contain.all.members([
        'http://publications.europa.eu/resource/authority/data-theme/AGRI',
        'http://publications.europa.eu/resource/authority/data-theme/GOVE',
        'http://publications.europa.eu/resource/authority/data-theme/ECON',
      ])
      expect(themes).to.have.length(3)
    })

    it('should get temporal PeriodOfTime', async () => {
      const themes = xpath.evalFirst(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcterms:temporal')

      const expected = await parser.parseStringPromise(`
        <dcterms:PeriodOfTime>
          <schema:startDate rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2024-01-01</schema:startDate>
          <schema:endDate rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2024-12-31</schema:endDate>
        </dcterms:PeriodOfTime>`)
      expect(themes).to.containSubset(expected)
    })

    it('should build correct distribution format', async () => {
      const format = xpath.evalFirst(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcat:distribution/dcat:Distribution/dcterms:format')

      expect(format.$['rdf:resource']).to.eq('http://publications.europa.eu/resource/authority/file-type/SPARQLQ')
    })

    it('should copy existing distributions', async () => {
      const distributions = xpath.find(xmlBody, '//rdf:RDF/dcat:Catalog/dcat:dataset/dcat:Dataset/dcat:distribution')

      expect(distributions).to.have.length(2)
      const expected = await parser.parseStringPromise(`
        <dcat:Distribution rdf:about="https://agriculture.ld.admin.ch/foag/cube/MilkDairyProducts/Production_Quantity_Month/distribution/1">
          <dcterms:issued rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2024-02-01</dcterms:issued>
          <dcterms:format rdf:resource="http://publications.europa.eu/resource/authority/file-type/CSV"/>
          <dcat:accessURL rdf:resource="http://foo.bar/"/>
          <dcat:downloadURL rdf:resource="http://foo.bar/download.csv"/>
          <dcterms:title xml:lang="en">Source table</dcterms:title>
          <dcterms:description xml:lang="en">Comma-separated cude data</dcterms:description>
          <dcat:byteSize rdf:datatype="http://www.w3.org/2001/XMLSchema#decimal">1013</dcat:byteSize>
          <dcat:mediaType rdf:resource="https://www.iana.org/assignments/media-types/text/csv"></dcat:mediaType>
        </dcat:Distribution>`)
      expect(distributions[1]).to.containSubset(expected)
    })
  })
})
