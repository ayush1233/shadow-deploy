--[[
  Shadow API Validation — Kong Gateway Plugin
  Captures request/response lifecycle and forwards to ingestion API.

  Install:
    1. Copy this directory to Kong's plugin path
    2. Add to kong.conf: plugins = bundled,shadow-api-validator
    3. Enable per-service: POST /services/{id}/plugins
       { "name": "shadow-api-validator", "config": { "ingestion_url": "...", "api_key": "..." } }
]]

local http = require "resty.http"
local cjson = require "cjson.safe"

local ShadowApiHandler = {
  PRIORITY = 800,
  VERSION = "1.0.0",
}

-- ── Schema ──
local schema = {
  name = "shadow-api-validator",
  fields = {
    { config = {
      type = "record",
      fields = {
        { ingestion_url = { type = "string", required = true, default = "http://shadow-ingestion:8081/api/v1/ingest/event" } },
        { api_key = { type = "string", required = true } },
        { tenant_id = { type = "string", required = true, default = "default" } },
        { traffic_type = { type = "string", required = false, default = "production" } },
        { timeout_ms = { type = "number", required = false, default = 5000 } },
        { enabled = { type = "boolean", required = false, default = true } },
      },
    }},
  },
}

function ShadowApiHandler:access(conf)
  if not conf.enabled then return end

  -- Generate request ID if not present
  local request_id = kong.request.get_header("X-Request-ID")
  if not request_id then
    request_id = kong.tools.uuid()
    kong.service.request.set_header("X-Request-ID", request_id)
  end

  -- Store start time for latency measurement
  kong.ctx.plugin.start_time = ngx.now()
  kong.ctx.plugin.request_id = request_id

  -- Capture request data
  kong.ctx.plugin.request_data = {
    method = kong.request.get_method(),
    endpoint = kong.request.get_path(),
    headers = kong.request.get_headers(),
    body = kong.request.get_raw_body(),
  }
end

function ShadowApiHandler:header_filter(conf)
  -- Add request ID to response
  kong.response.set_header("X-Request-ID", kong.ctx.plugin.request_id or "")
end

function ShadowApiHandler:log(conf)
  if not conf.enabled then return end

  local start_time = kong.ctx.plugin.start_time or ngx.now()
  local response_time_ms = math.floor((ngx.now() - start_time) * 1000)
  local request_data = kong.ctx.plugin.request_data or {}

  local event = {
    request_id = kong.ctx.plugin.request_id,
    tenant_id = conf.tenant_id,
    timestamp = ngx.utctime(),
    traffic_type = conf.traffic_type,
    method = request_data.method,
    endpoint = request_data.endpoint,
    request_headers = request_data.headers,
    request_body = request_data.body,
    response_status = kong.response.get_status(),
    response_headers = kong.response.get_headers(),
    response_time_ms = response_time_ms,
    ingestion_mode = "gateway-plugin-kong",
  }

  -- Async fire-and-forget
  local ok, err = ngx.timer.at(0, function()
    local httpc = http.new()
    httpc:set_timeout(conf.timeout_ms)

    local body = cjson.encode(event)
    if not body then return end

    local res, err = httpc:request_uri(conf.ingestion_url, {
      method = "POST",
      body = body,
      headers = {
        ["Content-Type"] = "application/json",
        ["X-API-Key"] = conf.api_key,
        ["X-Tenant-ID"] = conf.tenant_id,
      },
    })

    if not res then
      kong.log.warn("[shadow-api] Ingestion failed: ", err)
    end
  end)

  if not ok then
    kong.log.err("[shadow-api] Failed to schedule async send: ", err)
  end
end

return ShadowApiHandler
