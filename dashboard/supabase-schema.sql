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
-- Seed data: Insert some realistic comparison results so the
-- dashboard has data to display immediately
-- ============================================================
INSERT INTO comparisons (request_id, endpoint, method, prod_status_code, prod_response_time_ms, prod_body, shadow_status_code, shadow_response_time_ms, shadow_body, status_match, body_match, structure_match, latency_delta_ms, similarity_score, risk_score, severity, deterministic_pass, ai_compared, ai_explanation, recommended_action, field_diffs)
VALUES
(
    'req-001', '/api/users/123', 'GET', 200, 45,
    '{"id":123,"name":"John Doe","email":"john@example.com"}'::jsonb,
    200, 52,
    '{"id":123,"name":"John Doe","email":"john@example.com","role":"user"}'::jsonb,
    true, false, false, 7, 0.920, 2.1, 'low', false,
    true,
    'Shadow response includes an additional "role" field. This is a non-breaking additive change that extends the API response.',
    'SAFE_TO_PROCEED',
    '[{"path":"/role","prod_value":"(missing)","shadow_value":"\"user\"","diff_type":"ADDED"}]'::jsonb
),
(
    'req-002', '/api/orders', 'POST', 201, 120,
    '{"orderId":"ORD-789","status":"created","total":99.99}'::jsonb,
    201, 165,
    '{"orderId":"ORD-789","status":"pending","total":99.99,"estimatedDelivery":"2026-03-10"}'::jsonb,
    true, false, false, 45, 0.650, 6.8, 'high', false,
    true,
    'The shadow response changed the status field from "created" to "pending" which is a semantic change. Also added estimatedDelivery field. The status change could break downstream consumers.',
    'MANUAL_REVIEW_REQUIRED',
    '[{"path":"/status","prod_value":"\"created\"","shadow_value":"\"pending\"","diff_type":"CHANGED"},{"path":"/estimatedDelivery","prod_value":"(missing)","shadow_value":"\"2026-03-10\"","diff_type":"ADDED"}]'::jsonb
),
(
    'req-003', '/api/products', 'GET', 200, 35,
    '{"products":[{"id":1,"name":"Widget","price":29.99}],"total":1}'::jsonb,
    200, 47,
    '{"products":[{"id":1,"name":"Widget","price":29.99,"stock":150}],"total":1,"cached":true}'::jsonb,
    true, false, false, 12, 0.820, 3.5, 'medium', false,
    true,
    'Shadow adds stock count to products and a cached flag at root. Both are additive non-breaking changes but the stock field could expose internal inventory data.',
    'REVIEW_RECOMMENDED',
    '[{"path":"/products/0/stock","prod_value":"(missing)","shadow_value":"150","diff_type":"ADDED"},{"path":"/cached","prod_value":"(missing)","shadow_value":"true","diff_type":"ADDED"}]'::jsonb
),
(
    'req-004', '/api/users/456', 'PUT', 200, 55,
    '{"id":456,"name":"Jane Smith","email":"jane@example.com","updatedAt":"2026-02-27T10:00:00Z"}'::jsonb,
    500, 285,
    '{"error":"Internal Server Error","message":"NullPointerException at UserService.java:142"}'::jsonb,
    false, false, false, 230, 0.150, 9.2, 'critical', false,
    true,
    'CRITICAL: Shadow returns 500 Internal Server Error while production returns 200. The shadow service crashes on user update operations. This is a breaking regression that must be investigated before deployment.',
    'BLOCK_DEPLOYMENT',
    '[{"path":"/error","prod_value":"(missing)","shadow_value":"\"Internal Server Error\"","diff_type":"ADDED"},{"path":"/id","prod_value":"456","shadow_value":"(missing)","diff_type":"REMOVED"}]'::jsonb
),
(
    'req-005', '/api/inventory', 'GET', 200, 22,
    '{"warehouse":"US-EAST","items":42,"lastSync":"2026-02-27T22:00:00Z"}'::jsonb,
    200, 25,
    '{"warehouse":"US-EAST","items":42,"lastSync":"2026-02-27T22:00:00Z"}'::jsonb,
    true, true, true, 3, 0.980, 0.5, 'none', true,
    false, null, 'SAFE_TO_PROCEED', '[]'::jsonb
),
(
    'req-006', '/api/sessions', 'DELETE', 204, 15,
    '{}'::jsonb,
    204, 16,
    '{}'::jsonb,
    true, true, true, 1, 1.000, 0.0, 'none', true,
    false, null, 'SAFE_TO_PROCEED', '[]'::jsonb
),
(
    'req-007', '/api/orders/789', 'GET', 200, 68,
    '{"orderId":"ORD-789","items":[{"sku":"WDG-001","qty":2}],"total":59.98}'::jsonb,
    200, 96,
    '{"orderId":"ORD-789","items":[{"sku":"WDG-001","qty":2,"unitPrice":29.99}],"total":59.98,"tax":5.40}'::jsonb,
    true, false, false, 28, 0.780, 4.2, 'medium', false,
    true,
    'Shadow adds unitPrice to line items and tax at root level. These are additive fields that provide more detail. No fields were removed or modified.',
    'SAFE_TO_PROCEED',
    '[{"path":"/items/0/unitPrice","prod_value":"(missing)","shadow_value":"29.99","diff_type":"ADDED"},{"path":"/tax","prod_value":"(missing)","shadow_value":"5.40","diff_type":"ADDED"}]'::jsonb
),
(
    'req-008', '/api/payments', 'POST', 200, 145,
    '{"paymentId":"PAY-555","status":"processed","amount":159.97}'::jsonb,
    200, 160,
    '{"paymentId":"PAY-555","status":"processed","amount":159.97,"processorRef":"stripe_ch_abc123"}'::jsonb,
    true, false, false, 15, 0.880, 2.8, 'low', false,
    true,
    'Shadow adds processor reference ID. This is a helpful additive field for debugging but may expose internal payment processor details.',
    'REVIEW_RECOMMENDED',
    '[{"path":"/processorRef","prod_value":"(missing)","shadow_value":"\"stripe_ch_abc123\"","diff_type":"ADDED"}]'::jsonb
);
