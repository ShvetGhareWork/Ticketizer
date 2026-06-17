-- =============================================================================
-- schema.sql (Atlas Refactored)
-- =============================================================================

-- ── Idempotency Clean Slate Drops ─────────────────────────────────────────────
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS shows CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;

-- ── PostgreSQL ENUM Types ─────────────────────────────────────────────────────
-- Note: seat_status is removed. State is now derived from the bookings table.
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');

-- ── users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                  BIGSERIAL    PRIMARY KEY,
    full_name           VARCHAR(255),
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(255),
    provider            VARCHAR(50)  NOT NULL DEFAULT 'LOCAL',
    phone_number        VARCHAR(50),
    is_verified         BOOLEAN      NOT NULL DEFAULT FALSE,
    otp_code            VARCHAR(6),
    otp_expiry          TIMESTAMP,
    verification_method VARCHAR(20)
);

-- ── events (The overarching entity, e.g., "Aurora Festival") ──────────────────
CREATE TABLE events (
    id               BIGSERIAL    PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    genre            VARCHAR(255),
    duration_minutes INT
);

-- ── shows (Temporal Instances) ────────────────────────────────────────────────
CREATE TABLE shows (
    id             BIGSERIAL      PRIMARY KEY,
    event_id       BIGINT         NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue          VARCHAR(255)   NOT NULL,
    start_time     TIMESTAMPTZ    NOT NULL,
    end_time       TIMESTAMPTZ    NOT NULL,
    price          NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    hall_name      VARCHAR(255),
    total_capacity INT            NOT NULL CHECK (total_capacity > 0),
    
    CONSTRAINT chk_time_validity CHECK (end_time > start_time)
);

-- ── seats (Static Map) ────────────────────────────────────────────────────────
CREATE TABLE seats (
    id          BIGSERIAL   PRIMARY KEY,
    show_id     BIGINT      NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_number VARCHAR(20) NOT NULL,
    status      VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    
    -- Prevents duplicate seat identifiers within the same show
    CONSTRAINT uq_show_seat UNIQUE (show_id, seat_number)
);

-- ── bookings (Dynamic State & Source of Truth) ────────────────────────────────
CREATE TABLE bookings (
    id                BIGSERIAL      PRIMARY KEY,
    booking_reference VARCHAR(255)   NOT NULL UNIQUE, -- Kafka tracking reference UUID
    user_id           BIGINT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    show_id           BIGINT         NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id           BIGINT         NOT NULL REFERENCES seats(id) ON DELETE RESTRICT, 
    status            booking_status NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    version           BIGINT         NOT NULL DEFAULT 0, -- Optimistic locking for high concurrency
    
    -- CRITICAL: Prevents E12 from being double-booked for the exact same show instance
    CONSTRAINT uq_show_seat_booking UNIQUE (show_id, seat_id)
);

-- ── INDEXING: Query Performance Guards ────────────────────────────────────────
-- Optimizes availability aggregation lookups when building the UI seat map
CREATE INDEX idx_booking_show_status ON bookings(show_id, status);

-- Optimizes user dashboard lookups
CREATE INDEX idx_booking_user ON bookings(user_id);

-- ── notifications (In-app alerts) ──────────────────────────────────────────────
CREATE TABLE notifications (
    id         BIGSERIAL    PRIMARY KEY,
    user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    VARCHAR(255) NOT NULL,
    type       VARCHAR(50)  NOT NULL,
    is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_user ON notifications(user_id);