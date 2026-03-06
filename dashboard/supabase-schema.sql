-- ============================================================
-- Shadow API Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- Table: comparisons
-- Stores every shadow vs production API comparison result
CREATE TABLE IF NOT EXISTS comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT UNIQUE NOT NULL,
    tenant_id TEXT DEFAULT 'default',
    endpoint TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    
    -- Production response
    prod_status_code INTEGER DEFAULT 200,
    prod_response_time_ms INTEGER DEFAULT 0,
    prod_body JSONB DEFAULT '{}'::jsonb,
    
    -- Shadow response
    shadow_status_code INTEGER DEFAULT 200,
    shadow_response_time_ms INTEGER DEFAULT 0,
    shadow_body JSONB DEFAULT '{}'::jsonb,
    
    -- Comparison results
    status_match BOOLEAN DEFAULT true,
    body_match BOOLEAN DEFAULT true,
    structure_match BOOLEAN DEFAULT true,
    latency_delta_ms INTEGER DEFAULT 0,
    similarity_score NUMERIC(4,3) DEFAULT 1.000,
    risk_score NUMERIC(4,1) DEFAULT 0.0,
    severity TEXT DEFAULT 'low' CHECK (severity IN ('none', 'low', 'medium', 'high', 'critical')),
    deterministic_pass BOOLEAN DEFAULT true,
    
    -- AI analysis
    ai_compared BOOLEAN DEFAULT false,
    ai_explanation TEXT,
    recommended_action TEXT DEFAULT 'SAFE_TO_PROCEED',
    
    -- Field-level diffs stored as JSON array
    field_diffs JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_comparisons_endpoint ON comparisons(endpoint);
CREATE INDEX IF NOT EXISTS idx_comparisons_severity ON comparisons(severity);
CREATE INDEX IF NOT EXISTS idx_comparisons_created ON comparisons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comparisons_request_id ON comparisons(request_id);

-- Enable Row Level Security (RLS) but allow anon access for demo
ALTER TABLE comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access" ON comparisons FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- NOTE: No seed data is inserted.
-- Real comparison data will be generated automatically when you
-- run shadow deployments through the NGINX proxy.
-- The Network Topology page auto-detects services from 
-- nginx.conf and docker-compose.yml — no database table needed.
-- ============================================================
