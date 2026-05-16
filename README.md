# Emergency Surge Node API, Backend

## Overview

This backend is a compact Node.js simulation service built to support the **Emergency Surge Demo**.

Its purpose is not to be a full production backend. Its purpose is to provide a believable operational companion to the supervisor dashboard by simulating:

- emergency call intake
- call progression support
- degraded conditions
- failed calls
- timed-out calls
- backend outage/collapse
- recovery after restart
- structured logging and event hooks

This service was intentionally kept small so the MVP could remain understandable, testable, and easy to extend.

---

## Azure Runtime, Load Testing, and Observability Context

This backend is also the runtime target used in the broader Azure delivery evidence package.

The backend was not only used locally. It was later:

- containerized with Docker
- published to Azure Container Registry
- deployed to Azure Kubernetes Service
- exposed through a Dev LoadBalancer endpoint
- validated through `/health`
- exercised through `/loadtest/ping`
- observed through AKS/container logs
- instrumented with Azure Monitor / Application Insights using OpenTelemetry
- queried through KQL for request telemetry, P50/P95 duration, and failure count

That Azure layer does not change the original backend design philosophy. The service remains intentionally compact and MVP-focused. The Azure work proves that this compact backend can still participate in a realistic delivery pipeline with runtime validation, observability, and operational evidence.

---

## Why `/loadtest/ping` Was Added

The backend includes a dedicated lightweight endpoint:

```text
GET /loadtest/ping
```

This endpoint was added specifically for Azure Load Testing and SRE-style runtime validation.

The main dispatch/simulation flow is useful for the product scenario, but it includes domain behavior that is not ideal for clean latency testing. The load-test endpoint provides a stable backend target that avoids:

- frontend/browser timing noise
- simulator lifecycle complexity
- unrelated UI behavior
- unnecessary dependency on the main product flow

The endpoint returns a tiny deterministic JSON response with:

- status
- target name
- timestamp
- uptime
- correlation ID

This allowed Azure Load Testing to exercise the deployed Node.js backend directly while AKS logs confirmed that the backend pod processed the traffic.

---

## Why This Backend Is Intentionally Compact

This backend was not designed as a distributed system.

That was intentional.

The demo needed a backend strong enough to support:

- a clear emergency-intake story
- realistic operational outcomes
- offline and recovery behavior
- structured logs
- future observability integration

But it did **not** need the complexity of a production-scale multi-service architecture on day one.

For that reason, this project intentionally avoids introducing heavyweight infrastructure too early, such as:

- RabbitMQ
- MassTransit
- event-bus/pub-sub infrastructure
- distributed orchestration
- persistent message brokers
- multiple service boundaries without product need

The current scope is an MVP, and the backend reflects that.

While this is not a distributed application today, the architecture leaves room to evolve in that direction if the use case truly demands it.

---

## Why a Queue-Based Dispatch Model Was Chosen

A queue-oriented model was chosen because it provides the clearest and most consistent way to represent:

- incoming calls
- active processing
- final outcomes

This choice was made for clarity, not luxury.

As the supervisor narrative became more precise, it became obvious that calls needed to preserve continuity through their lifecycle rather than being replaced arbitrarily.

The queue-based model makes it easier to reason about:

- how calls enter the system
- how they become active
- how they stay visible until final state
- how they end as Completed, Failed, or Timed Out
- how counters stay mathematically consistent

This is one of the most important design decisions in the backend and frontend together.

---

## Outcome Model

The system uses business-oriented final outcomes rather than only raw transport statuses.

### Completed
The call was successfully handled and emergency assistance was dispatched.

### Failed
The call was actively handled, but the communication was interrupted before successful completion.

### Timed Out
The call reached the system, but no operator became available before the timeout threshold.

### Total Requests
The total number of emergency calls received by the intake layer, regardless of final result.

A call can belong to **one and only one** final outcome category.

That mutual exclusivity is intentional and is part of the integrity of the simulation.

---

## Why Outcomes Are Planned Instead of Decided Arbitrarily Mid-Flight

For the current demo, call outcomes are planned in a controlled way rather than left entirely to uncontrolled randomness.

This makes it possible to keep the simulation believable while preserving consistency across:

- header counters
- active lifecycle behavior
- final history
- backend responses
- telemetry events

Failed and timed-out calls are assigned without overlap, and completed calls are everything not assigned to those two categories.

This lets the frontend and backend tell the same story without contradiction.

---

## Middleware and Logging Choices

As the project became more serious, the backend moved beyond a minimal Express proof of concept and added more structured behavior.

The backend includes:

- request logging
- correlation/request ID handling
- not-found handling
- global error-handling middleware
- safer async route patterns
- process-level handling for uncaught exceptions and unhandled rejections
- structured JSON-style logging/events

This matters because the backend is not only returning simulated data, it is also preparing the system for later:

- Azure/App Insights work
- AKS deployment
- CI/CD verification
- Terraform-driven hosting
- outage and recovery analysis

---

## Structured Event Intent

The backend also supports structured status/event semantics so the simulation can later connect more naturally to observability tooling.

A key example is the approved event shape:

- `CallStatusChanged`
- `fromStage`
- `toOutcome`
- `reason`

This structure was chosen because it is better for analysis than loose text logs.

It gives the project a clearer path toward:

- Azure Monitor / Application Insights
- technical audit trails
- KQL querying
- support-oriented dashboards
- future richer telemetry

---

## Outage / Collapse Behavior

This backend intentionally supports simulated collapse behavior.

That is not a gimmick. It exists because the product story includes:

- degraded communications
- backend unavailability
- critical operational state
- recovery after restart

The purpose is to show that the command dashboard does not only work under healthy conditions. It also has to react meaningfully to backend instability and full service loss.

That makes the demo much more credible.

---

## Why Real-Time Infrastructure Was Left Out

This project simulates a 911-like emergency operations system that attends real-time calls, and for this scenario it attempts to demonstrate how such a system could behave under extreme operational pressure.

However, to keep the MVP focused and shippable within the available time, several production-oriented capabilities were intentionally left out, including:

- SignalR or similar real-time push infrastructure
- Redis/distributed caching
- persistent storage
- advanced background processing
- distributed messaging infrastructure
- more advanced API integration layers

Those features are valuable in a real product, but including them here would have significantly increased implementation complexity and reduced the clarity of the MVP.

The goal of this version is not to claim production-readiness. The goal is to present a compact backend whose responsibilities and growth path are easy to understand.

---

## Azure Monitor / Application Insights Instrumentation

The backend supports optional Azure Monitor / Application Insights telemetry through a separate startup bootstrap file:

```text
src/instrumentation.js
```

This instrumentation is intentionally separated from `server.js`.

`server.js` remains focused on:

- Express startup
- middleware registration
- route creation
- request logging
- not-found handling
- global error handling
- graceful shutdown
- simulated collapse/recovery behavior

The telemetry bootstrap is loaded before the server starts through Node's `--import` option in `package.json`.

### Instrumentation Behavior

The instrumentation checks for:

```text
APPLICATIONINSIGHTS_CONNECTION_STRING
```

When the variable exists, the backend initializes Azure Monitor OpenTelemetry export and enables Live Metrics.

When the variable does not exist, the backend still starts normally and logs that Application Insights was not initialized.

This makes the backend safe to run locally without Azure configuration, while still allowing full telemetry when deployed to AKS or another configured environment.

### Instrumentation Pattern

The telemetry bootstrap follows this pattern:

```js
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
```

### Startup Script

The backend startup script was updated so instrumentation loads before the Express server:

```json
"start": "node --import ./src/instrumentation.js src/server.js"
```

This matters because telemetry should be initialized before the application begins handling requests.

### Dockerfile Mitigation

One of the most important delivery findings was not in the application logic itself, but in the container startup path.

The backend initialized Application Insights correctly in local testing, but AKS telemetry did not appear at first.

The root cause was the Dockerfile.

The Dockerfile was originally starting the application directly:

```dockerfile
CMD ["node", "src/server.js"]
```

That bypassed `npm start`, so `src/instrumentation.js` was never preloaded inside the container.

The fix was:

```dockerfile
CMD ["npm", "start"]
```

After that change, the container used the package startup script and loaded the instrumentation bootstrap correctly.

### Kubernetes Secret Configuration

The Application Insights connection string was stored as a Kubernetes Secret and injected into the backend deployment through the environment variable:

```text
APPLICATIONINSIGHTS_CONNECTION_STRING
```

This kept the telemetry connection string out of source code and allowed the same backend image to run with or without Azure telemetry depending on the deployment environment.

### AKS and KQL Evidence

After the Dockerfile and Kubernetes Secret wiring were fixed, the backend image was rebuilt, pushed to Azure Container Registry, and redeployed to AKS Dev.

The AKS pod logs confirmed:

```text
Azure Monitor Application Insights initialized
Emergency surge API listening on port 4001
```

Fresh traffic was generated against:

```text
/health
/loadtest/ping
```

Application Insights then showed request telemetry from the AKS backend, including:

- AKS pod role instance
- `GET /loadtest/ping`
- public backend URL
- HTTP 200 result code
- success = true
- request duration
- KQL request table output
- P50/P95 duration summary
- failure count

This completed the backend observability proof.

---

## Growth Path

If the concept were approved as a future product direction, this backend could evolve into a more robust architecture by integrating with additional services such as:

- real operator/staffing APIs from the existing platform
- incident persistence and audit storage
- real routing/assignment services
- CRM-linked emergency case services
- notification or dispatch integrations
- real-time infrastructure for supervisor updates
- richer health, observability, and support tooling

That is why this backend should be viewed as a **pluggable MVP backend**, not as an isolated toy.

Its value is not only in what it does today, but in how clearly it suggests what can be built around it.

---

## Code Highlights

These are the areas most worth reviewing in the backend code:

- health endpoint behavior
- dispatch simulation endpoint behavior
- `/loadtest/ping` endpoint for Azure Load Testing
- queue/outcome support
- collapse scheduling and outage behavior
- middleware/error handling
- structured logging/event shape
- request logging and correlation/request ID handling
- optional Azure Monitor / Application Insights bootstrap through `src/instrumentation.js`
- Kubernetes Secret-based `APPLICATIONINSIGHTS_CONNECTION_STRING` configuration
- process-level error handling

---

## Running the Backend

Typical local workflow:

```bash
npm install
npm start
```

If `APPLICATIONINSIGHTS_CONNECTION_STRING` is not present, the backend still starts normally and logs that Application Insights was not initialized.

If the connection string is present, the backend initializes Azure Monitor / Application Insights through the startup bootstrap before the Express server starts.

If the project includes a development watch mode, that can be used while iterating locally.

The frontend demo expects this backend to be reachable locally for the full simulation experience.
