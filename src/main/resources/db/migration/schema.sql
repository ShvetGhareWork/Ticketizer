-- =============================================================================
-- schema.sql
-- =============================================================================

-- ── Idempotency Clean Slate Drops ─────────────────────────────────────────────
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS seat_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;

-- ── PostgreSQL ENUM Types ─────────────────────────────────────────────────────
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id        BIGSERIAL    PRIMARY KEY,
    full_name VARCHAR(255),
    email     VARCHAR(255) NOT NULL UNIQUE,
    password  VARCHAR(255),
    provider  VARCHAR(50)  NOT NULL DEFAULT 'LOCAL'
);

-- ── events ────────────────────────────────────────────────────────────────────
CREATE TABLE events (
    id               BIGSERIAL    PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    genre            VARCHAR(255),
    duration_minutes INT
);

-- ── shows ─────────────────────────────────────────────────────────────────────
CREATE TABLE shows (
    id             BIGSERIAL      PRIMARY KEY,
    event_id       BIGINT         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue          VARCHAR(255)   NOT NULL,
    start_time     TIMESTAMPTZ    NOT NULL,
    end_time       TIMESTAMPTZ    NOT NULL,
    total_capacity INT            NOT NULL CHECK (total_capacity > 0),
    price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    hall_name      VARCHAR(255)
);

-- ── seats ─────────────────────────────────────────────────────────────────────
CREATE TABLE seats (
    id          BIGSERIAL   PRIMARY KEY,
    show_id     BIGINT      NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_number VARCHAR(20) NOT NULL,
    status      seat_status NOT NULL DEFAULT 'AVAILABLE',
    CONSTRAINT uq_show_seat UNIQUE (show_id, seat_number)
);

-- ── COMPOSITE INDEX: Optimizing Cache Warmup & Expiration Reconciliation ──────
CREATE INDEX idx_seat_show_status ON seats(show_id, status);

-- ── bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE bookings (
    id                BIGSERIAL      PRIMARY KEY,
    booking_reference VARCHAR(255)   NOT NULL UNIQUE, -- Kafka tracking reference UUID
    user_id           BIGINT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    show_id           BIGINT         NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id           BIGINT         NOT NULL REFERENCES seats(id) ON DELETE CASCADE, -- Direct high-performance relation
    status            booking_status NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    version           BIGINT         NOT NULL DEFAULT 0
);

-- ── INDEX: Fast User Query Performance Guard ──────────────────────────────────
CREATE INDEX idx_booking_user_show ON bookings(user_id, show_id);