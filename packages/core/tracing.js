import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import FastifyOtelInstrumentation from '@fastify/otel'

const traceExporter = new OTLPTraceExporter()

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'trifid',
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations(),
    new FastifyOtelInstrumentation({
      registerOnInitialization: true,
    }),
  ],
})

sdk.start()

const shutdown = async () => {
  try {
    await sdk.shutdown()
  } finally {
    process.exit(0)
  }
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
