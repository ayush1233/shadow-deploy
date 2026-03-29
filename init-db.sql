-- Shadow Deploy - Database Schema
-- ═══════════════════════════════════════════════════════════════

-- ─── Users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(255) NOT NULL UNIQUE,
    email           VARCHAR(255) UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(50) NOT NULL DEFAULT 'viewer',  -- admin, editor, viewer
    tenant_id       VARCHAR(255) NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- ─── API Keys ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
    id              SERIAL PRIMARY KEY,
    key_hash        VARCHAR(255) NOT NULL UNIQUE,
    key_prefix      VARCHAR(12) NOT NULL,           -- first 8 chars for display (sk-sha-xxxx...)
    name            VARCHAR(255) NOT NULL,           -- human-readable label
    tenant_id       VARCHAR(255) NOT NULL,
    scopes          VARCHAR(255) NOT NULL DEFAULT 'ingest',  -- ingest, read, admin
    is_active       BOOLEAN NOT NULL DEFAULT true,
    last_used_at    TIMESTAMPTZ,
    expires_at      TIMESTAMPTZ,
    created_by      VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys (tenant_id);

-- ─── Usage Events ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_events (
    id              BIGSERIAL PRIMARY KEY,
    tenant_id       VARCHAR(255) NOT NULL,
    event_type      VARCHAR(50) NOT NULL,            -- ingestion, comparison, api_call, ai_analysis
    endpoint        VARCHAR(1024),
    count           INTEGER NOT NULL DEFAULT 1,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_id ON usage_events (tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_recorded_at ON usage_events (recorded_at);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events (event_type);

-- Aggregated monthly usage for billing
CREATE TABLE IF NOT EXISTS usage_monthly (
    id              SERIAL PRIMARY KEY,
    tenant_id       VARCHAR(255) NOT NULL,
    month           DATE NOT NULL,                   -- first day of month
    ingestion_count BIGINT NOT NULL DEFAULT 0,
    comparison_count BIGINT NOT NULL DEFAULT 0,
    api_call_count  BIGINT NOT NULL DEFAULT 0,
    ai_analysis_count BIGINT NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_monthly_tenant ON usage_monthly (tenant_id, month);

-- ─── Comparisons ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comparisons (
    request_id          VARCHAR(255) PRIMARY KEY,
    tenant_id           VARCHAR(255) NOT NULL,
    created_at          TIMESTAMPTZ,
    endpoint            VARCHAR(1024),
    method              VARCHAR(10),
    deployment_id       VARCHAR(255),

    -- Production Response
    prod_status_code    INTEGER,
    prod_response_time_ms BIGINT,
    prod_body_hash      VARCHAR(255),
    prod_body           JSONB,

    -- Shadow Response
    shadow_status_code  INTEGER,
    shadow_response_time_ms BIGINT,
    shadow_body_hash    VARCHAR(255),
    shadow_body         JSONB,

    -- Deterministic Comparison
    status_match        BOOLEAN,
    headers_match       BOOLEAN,
    body_match          BOOLEAN,
    structure_match     BOOLEAN,
    latency_delta_ms    BIGINT,
    field_diffs         JSONB,
    deterministic_pass  BOOLEAN,

    -- AI Comparison
    ai_compared         BOOLEAN,
    similarity_score    DOUBLE PRECISION,
    severity            VARCHAR(50),
    risk_score          DOUBLE PRECISION,
    ai_explanation      TEXT,
    recommended_action  TEXT,
    explanation_summary TEXT,
    explanation_details TEXT,
    explanation_impact  TEXT,
    explanation_confidence DOUBLE PRECISION,

    -- Metadata
    environment         VARCHAR(100),
    tags                JSONB
);

CREATE INDEX IF NOT EXISTS idx_comparisons_created_at ON comparisons (created_at);
CREATE INDEX IF NOT EXISTS idx_comparisons_tenant_id ON comparisons (tenant_id);
CREATE INDEX IF NOT EXISTS idx_comparisons_endpoint ON comparisons (endpoint);
CREATE INDEX IF NOT EXISTS idx_comparisons_severity ON comparisons (severity);
CREATE INDEX IF NOT EXISTS idx_comparisons_deterministic_pass ON comparisons (deterministic_pass);
-- Composite index for tenant-scoped queries (most common pattern)
CREATE INDEX IF NOT EXISTS idx_comparisons_tenant_created ON comparisons (tenant_id, created_at DESC);

-- ─── Seed default admin user ─────────────────────────────────
-- Password: shadow-admin
-- NOTE: The api-service DefaultAdminSeeder.java will create/fix this
-- user with a correct BCrypt hash on every startup. This SQL seed
-- is a fallback for direct-DB-only setups.
-- The hash below corresponds to 'shadow-admin' (BCrypt $2a$10$).
INSERT INTO users (username, email, password_hash, role, tenant_id)
VALUES ('admin', 'admin@shadow-deploy.local', '$2a$10$htxHPTEF/x4DfMAagiq.muf2JlB8rFVS2LoQCwAELlVuT8/53FiWC', 'admin', 'default')
ON CONFLICT (username) DO NOTHING;

-- ─── Seed default API key ────────────────────────────────────
-- Key: sk-shadow-default-key-change-me (SHA-256 hash)
INSERT INTO api_keys (key_hash, key_prefix, name, tenant_id, scopes, created_by)
VALUES ('a0f3285b07c26c0dcd2191447f391170d06035e8d57e31a048ba87074f3a9a15', 'sk-shado', 'Default Dev Key', 'default', 'ingest', 'system')
ON CONFLICT (key_hash) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security Policies (tenant isolation at DB level)
-- App must SET app.tenant_id = '<tenant>' before queries.
-- ═══════════════════════════════════════════════════════════════

-- ─── Users RLS ──────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = current_setting('app.tenant_id', true));

-- ─── API Keys RLS ───────────────────────────────────────────
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_api_keys ON api_keys
    USING (tenant_id = current_setting('app.tenant_id', true));

-- ─── Usage Events RLS ───────────────────────────────────────
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_usage_events ON usage_events
    USING (tenant_id = current_setting('app.tenant_id', true));

-- ─── Usage Monthly RLS ──────────────────────────────────────
ALTER TABLE usage_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_usage_monthly ON usage_monthly
    USING (tenant_id = current_setting('app.tenant_id', true));

-- ─── Comparisons RLS ────────────────────────────────────────
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_comparisons ON comparisons
    USING (tenant_id = current_setting('app.tenant_id', true));
