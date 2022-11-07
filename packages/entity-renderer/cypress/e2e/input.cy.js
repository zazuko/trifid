/* eslint-disable */
describe('Mounts the renderer', () => {
  it('Loads one resource', () => {
    cy.visit('/data/person/amy-farrah-fowler')
  })

  // it('minimal', function () {
  //   cy.visit('localhost:8080')
  //   cy.get(':nth-child(2) > a').click()
  //   cy.get('h3 > div').click()
  //   cy.get(
  //     '#http\\:\\/\\/localhost\\:8080\\/data\\/person\\/amy-farrah-fowler').
  //     should('have.text', 'person/amy-farrah-fowler')
  // })
})
