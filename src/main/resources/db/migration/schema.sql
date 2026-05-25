-- =============================================================================
-- schema.sql
-- =============================================================================

-- ── PostgreSQL ENUM Types ─────────────────────────────────────────────────────
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- ── events ────────────────────────────────────────────────────────────────────
CREATE TABLE events (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT
);

-- ── shows ─────────────────────────────────────────────────────────────────────
CREATE TABLE shows (
    id             BIGSERIAL    PRIMARY KEY,
    event_id       BIGINT       NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue          VARCHAR(255) NOT NULL,
    start_time     TIMESTAMPTZ  NOT NULL,
    end_time       TIMESTAMPTZ  NOT NULL,
    total_capacity INT          NOT NULL CHECK (total_capacity > 0)
);

-- ── seats ─────────────────────────────────────────────────────────────────────
CREATE TABLE seats (
    id             BIGSERIAL      PRIMARY KEY,
    show_id        BIGINT         NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_number    VARCHAR(20)    NOT NULL,
    row_identifier VARCHAR(10)    NOT NULL,
    price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    status         seat_status    NOT NULL DEFAULT 'AVAILABLE'
);

-- ── COMPOSITE INDEX: Optimizing Cache Warmup & Expiration Reconciliation ──────
CREATE INDEX idx_seat_show_status ON seats(show_id, status);

-- ── bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
    id                BIGSERIAL      PRIMARY KEY,
    booking_reference VARCHAR(255)   NOT NULL UNIQUE, -- Kafka tracking reference UUID
    user_id           BIGINT         NOT NULL,
    show_id           BIGINT         NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id           BIGINT         NOT NULL REFERENCES seats(id) ON DELETE CASCADE, -- Direct high-performance relation
    status            booking_status NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    version           BIGINT         NOT NULL DEFAULT 0
);

-- ── UNIQUE INDEX: Last-Resort Idempotency Guard ──────────────────────────────
CREATE UNIQUE INDEX idx_booking_user_show ON bookings(user_id, show_id)
    WHERE status != 'CANCELLED';