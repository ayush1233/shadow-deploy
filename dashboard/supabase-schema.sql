-- ============================================================
-- Shadow API Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- Drop existing tables to recreate cleanly
DROP TABLE IF EXISTS endpoint_tags CASCADE;
DROP TABLE IF EXISTS comparisons CASCADE;

-- Table: comparisons
-- Stores every shadow vs production API comparison result
CREATE TABLE comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT DEFAULT 'default',
    endpoint TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    deployment_id TEXT,

    -- Production response
    prod_status_code INTEGER DEFAULT 200,
    prod_response_time_ms BIGINT DEFAULT 0,
    prod_body_hash TEXT,
    prod_body JSONB DEFAULT '{}'::jsonb,

    -- Shadow response
    shadow_status_code INTEGER DEFAULT 200,
    shadow_response_time_ms BIGINT DEFAULT 0,
    shadow_body_hash TEXT,
    shadow_body JSONB DEFAULT '{}'::jsonb,

    -- Comparison results
    status_match BOOLEAN DEFAULT true,
    headers_match BOOLEAN DEFAULT true,
    body_match BOOLEAN DEFAULT true,
    structure_match BOOLEAN DEFAULT true,
    latency_delta_ms BIGINT DEFAULT 0,
    similarity_score NUMERIC(4,3) DEFAULT 1.000,
    risk_score NUMERIC(4,1) DEFAULT 0.0,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('none', 'low', 'medium', 'high', 'critical')),
    deterministic_pass BOOLEAN DEFAULT true,

    -- AI analysis
    ai_compared BOOLEAN DEFAULT false,
    ai_explanation TEXT,
    explanation JSONB DEFAULT NULL,
    explanation_summary TEXT,
    explanation_details TEXT,
    explanation_impact TEXT,
    explanation_confidence DOUBLE PRECISION,
    recommended_action TEXT DEFAULT 'SAFE_TO_PROCEED',

    -- Field-level diffs stored as JSON array
    field_diffs JSONB DEFAULT '[]'::jsonb,

    -- Metadata
    environment TEXT,
    tags JSONB DEFAULT '[]'::jsonb,

    -- The comparison-engine writes to "timestamp", api-service writes to "created_at"
    -- We use created_at as the real column and add timestamp as an alias
    created_at TIMESTAMPTZ DEFAULT now(),
    "timestamp" TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast filtering
CREATE INDEX idx_comparisons_endpoint ON comparisons(endpoint);
CREATE INDEX idx_comparisons_severity ON comparisons(severity);
CREATE INDEX idx_comparisons_created ON comparisons(created_at DESC);
CREATE INDEX idx_comparisons_request_id ON comparisons(request_id);
CREATE INDEX idx_comparisons_tenant ON comparisons(tenant_id);

-- Enable Row Level Security (RLS) but allow anon access for demo
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON comparisons FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- NOTE: No seed data is inserted.
-- Real comparison data will be generated automatically when you
-- run shadow deployments through the NGINX proxy.
-- ============================================================

-- Table: endpoint_tags
-- Stores custom tags and colors for URL patterns
CREATE TABLE endpoint_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint_pattern TEXT NOT NULL UNIQUE,
    tag TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#3b82f6',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS) but allow anon access for demo
ALTER TABLE endpoint_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access tags" ON endpoint_tags FOR ALL USING (true) WITH CHECK (true);
