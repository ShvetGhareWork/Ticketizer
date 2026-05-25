# Ticketizer

A production-grade, distributed ticket allocation engine engineered to handle extreme concurrency spikes (e.g., flash-sale ticket drops) without data drift, inventory overselling, or database deadlocks.

The architecture decouples immediate, low-latency reservation state management from asynchronous relational storage convergence using a hybrid memory/event-driven design.

## 🚀 Core Architecture Highlights

* **Fast-Path Inventory Locks:** Uses **Redis Set/Hash** structures managed via atomic **Lua Scripts** to validate and secure seat locks in <10ms, dropping excess traffic before it hits the database.
* **Asynchronous Ingestion Bus:** Leverages **Apache Kafka** to stream secured memory reservations into an idempotent transactional consumer lane, smoothing massive ingestion spikes.
* **Durable Relational Baseline:** Integrates **PostgreSQL** for final state persistence, hardened with database-level constraints (`idx_booking_user_show`) to eliminate duplicate active bookings.
* **Fail-Fast Error Boundaries:** Configured with a Kafka **Dead Letter Queue (DLQ)** handler that separates transient infrastructure issues from deterministic data violations without stalling log partitions.
* **Asynchronous Janitor Loop:** Runs an optimized Spring Task Scheduler to reclaim abandoned `PENDING` booking leases, utilizing transactional database isolation and matching Redis Lua release paths.
* **Race-Condition Hardening:** Implements **Optimistic Concurrency Locking** (`@Version`) to resolve real-time race conditions between the background Janitor loop and incoming webhook checkout completions.
