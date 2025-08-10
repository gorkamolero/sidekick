import { NodeTracerProvider } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export async function register() {
  // Configure OpenTelemetry
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'sidekick-sidecar',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
    }),
  });

  // Use console exporter for development
  provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  
  provider.register();
  
  console.log('🔍 Telemetry initialized for Sidekick Sidecar');
}