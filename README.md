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
- queue/outcome support
- collapse scheduling and outage behavior
- middleware/error handling
- structured logging/event shape
- process-level error handling

---

## Running the Backend

Typical local workflow:

```bash
npm install
npm start
```

If the project includes a development watch mode, that can be used while iterating locally.

The frontend demo expects this backend to be reachable locally for the full simulation experience.
