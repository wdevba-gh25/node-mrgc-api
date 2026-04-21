# Architecture-API

## Emergency Surge Demo, Backend / API Architecture

This diagram focuses on the **backend application architecture**, not on Terraform, AKS, or Azure DevOps infrastructure.

The purpose of this view is to show how the Node.js API was structured around:
- compact but meaningful simulation behavior
- queue/outcome clarity
- middleware and structured logging
- outage/recovery behavior
- a clear path toward future growth

```text
+----------------------------------------------------------------------------------+
|                          Emergency Surge Node API                                |
|----------------------------------------------------------------------------------|
| Express Application                                                               |
+-------------------------------------------+--------------------------------------+
                                            |
                                            v
+----------------------------------------------------------------------------------+
|                            Incoming HTTP Requests                                |
|----------------------------------------------------------------------------------|
| GET /health                                                                       |
| POST /simulate/dispatch                                                           |
| POST /simulate/collapse                                                           |
+-------------------------------------------+--------------------------------------+
                                            |
                                            v
+----------------------------------------------------------------------------------+
|                           Middleware Pipeline                                     |
|----------------------------------------------------------------------------------|
| Request logging                                                                    |
| Correlation / request ID                                                           |
| JSON parsing                                                                       |
| Route handling                                                                     |
| Not-found handling                                                                 |
| Global error handling                                                              |
+-------------------------------------------+--------------------------------------+
                                            |
                                            v
+-------------------------------+     +--------------------------------------------+
|      Health Endpoint          |     |         Simulation Route Layer             |
|-------------------------------|     |--------------------------------------------|
| Liveness / availability       |     | Dispatch simulation endpoint               |
| Used by frontend and DevOps   |     | Collapse scheduling endpoint               |
+-------------------------------+     +----------------------+---------------------+
                                                            |
                                                            v
+----------------------------------------------------------------------------------+
|                          Simulation / Domain Logic                               |
|----------------------------------------------------------------------------------|
| Planned outcomes                                                                  |
| Completed                                                                         |
| Failed                                                                            |
| Timed out                                                                         |
| Delay simulation                                                                   |
| Collapse scheduling                                                                |
| Scenario-specific behavior                                                         |
+-------------------------------------------+--------------------------------------+
                                            |
                                            v
+----------------------------------------------------------------------------------+
|                       Structured Event / Logging Layer                            |
|----------------------------------------------------------------------------------|
| CallStatusChanged                                                                  |
| fromStage                                                                          |
| toOutcome                                                                          |
| reason                                                                             |
| Correlation IDs                                                                    |
| Startup / shutdown / collapse events                                               |
+-------------------------------------------+--------------------------------------+
                                            |
                                            v
+-----------------------------+            +----------------------------------------+
|      Response Builder       |            |       Process-Level Error Hooks        |
|-----------------------------|            |----------------------------------------|
| requestId                   |            | unhandledRejection                     |
| startedAt                   |            | uncaughtException                      |
| finishedAt                  |            | graceful-ish failure visibility        |
| durationMs                  |            +----------------------------------------+
| status                      |
| correlationId               |
| notes                       |
+-------------+---------------+
              |
              v
+----------------------------------------------------------------------------------+
|                          Consumer / Integration Layer                             |
|----------------------------------------------------------------------------------|
| Frontend supervisor console                                                       |
| Future Azure Monitor / App Insights                                               |
| Future support/admin tooling                                                      |
| Future real platform integrations                                                 |
+----------------------------------------------------------------------------------+
```

## Main API Design Decisions

### Compact backend on purpose
This backend is intentionally small. It was designed to support the MVP narrative without overbuilding the system into premature distributed complexity.

### Queue / outcome clarity
The backend supports a clear outcome model:
- Completed
- Failed
- Timed out

A call belongs to one final outcome only.
That mutual exclusivity keeps counters, history, and telemetry consistent.

### Middleware matters
The backend was intentionally upgraded beyond a minimal Express demo to include:
- request logging
- correlation IDs
- not-found handling
- global error handling
- safer async behavior
- process-level failure handling

This improves observability, deployment readiness, and later cloud-hosting credibility.

### Structured event semantics
The API was shaped to emit structured event meaning, especially around:
- stage transitions
- final outcomes
- reason codes

That is much more useful for later telemetry than loose text logging.

### Collapse / outage as part of the product story
The backend includes deliberate collapse behavior because the product story includes:
- degraded conditions
- backend loss
- retry loops
- recovery after restart

That makes failure handling part of the architecture, not an afterthought.

## Relationship to IaC

This backend architecture is separate from infrastructure-as-code.

- **Architecture-API.md** explains how the application behaves internally.
- **Architecture-IaC.md** explains how the application is provisioned, deployed, and promoted through Azure infrastructure.

Both are related, but they answer different questions.

## Growth Path

This API architecture can later evolve toward:
- persistence
- real operator/staffing data
- dispatch integrations
- CRM-linked incident context
- richer audit trails
- real-time push infrastructure
- stronger observability and support surfaces
- more distributed service boundaries if the product truly needs them
