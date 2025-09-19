// @ts-check

import { NodeSDK } from '@opentelemetry/sdk-node'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { FastifyOtelInstrumentation } from '@fastify/otel'

const configMetricsInterval = process.env.OTEL_METRIC_EXPORT_INTERVAL
  ? parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL, 10)
  : 30000

const traceExporter = new OTLPTraceExporter()
const metricExporter = new OTLPMetricExporter()
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
  exportIntervalMillis: configMetricsInterval,
})

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'trifid',
  }),
  traceExporter,
  metricReaders: [metricReader],
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
