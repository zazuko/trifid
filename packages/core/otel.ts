import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { FastifyOtelInstrumentation } from '@fastify/otel';

const SHUTDOWN_TIMEOUT_MS = 5000;

// Only start OTel when an endpoint is explicitly configured; otherwise the
// PeriodicExportingMetricReader timer keeps the event loop alive and the
// export attempts on shutdown block process exit for several seconds.
const otelEndpoint
  = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    || process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    || process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT;
const otelDisabled = process.env.OTEL_SDK_DISABLED === 'true';

if (!otelEndpoint || otelDisabled) {
  const exitHandler = () => process.exit(0);
  process.on('SIGTERM', exitHandler);
  process.on('SIGINT', exitHandler);
} else {
  const configMetricsInterval = process.env.OTEL_METRIC_EXPORT_INTERVAL
    ? parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL, 10)
    : 30000;

  const traceExporter = new OTLPTraceExporter();
  const metricExporter = new OTLPMetricExporter();
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: configMetricsInterval,
  });

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
  });

  try {
    sdk.start();
  } catch (error) {
    // Telemetry is best-effort: a failure to start it must never prevent the
    // server itself from starting.
    // eslint-disable-next-line no-console
    console.error('Failed to start the OpenTelemetry SDK', error);
  }

  const shutdown = async () => {
    try {
      await Promise.race([
        sdk.shutdown(),
        new Promise<void>((resolve) =>
          setTimeout(resolve, SHUTDOWN_TIMEOUT_MS),
        ),
      ]);
    } catch {
      // ignore shutdown errors, we are exiting anyway
    } finally {
      process.exit(0);
    }
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
