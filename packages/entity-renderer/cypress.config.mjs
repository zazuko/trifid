// eslint-disable-next-line import/no-extraneous-dependencies
import { defineConfig } from 'cypress'

export default defineConfig({
  viewportWidth: 1366,
  viewportHeight: 768,
  chromeWebSecurity: false,
  e2e: {
    baseUrl: 'http://localhost:3000',
    experimentalStudio: true,
  },
})
