import { useAzureMonitor } from '@azure/monitor-opentelemetry';

const connectionString = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;

if (connectionString) {
  useAzureMonitor({
    azureMonitorExporterOptions: {
      connectionString
    },
    enableLiveMetrics: true
  });

  console.log('Azure Monitor Application Insights initialized');
} else {
  console.log('Azure Monitor Application Insights not initialized: connection string not found');
}
