/**
 * Shadow API Node.js SDK
 *
 * Express middleware for capturing API traffic and forwarding
 * it to the Shadow API platform for comparison analysis.
 *
 * Usage:
 *   const { shadowMiddleware } = require('@shadow-api/node-sdk');
 *
 *   app.use(shadowMiddleware({
 *     ingestionUrl: 'http://shadow-proxy:8080/ingest/event',
 *     apiKey: 'sk-shadow-your-key',
 *     tenantId: 'your-tenant',
 *     trafficType: 'production',  // or 'shadow'
 *   }));
 */

const https = require('https');
const http = require('http');
const { randomUUID } = require('crypto');

class ShadowSDK {
    constructor(options = {}) {
        this.ingestionUrl = options.ingestionUrl || 'http://localhost:8080/ingest/event';
        this.batchUrl = this.ingestionUrl.replace('/event', '/batch');
        this.apiKey = options.apiKey || '';
        this.tenantId = options.tenantId || 'default';
        this.trafficType = options.trafficType || 'production';
        this.batchSize = options.batchSize || 50;
        this.flushIntervalMs = options.flushIntervalMs || 5000;
        this.maxQueueSize = options.maxQueueSize || 10000;
        this.debug = options.debug || false;

        this.queue = [];
        this.flushTimer = null;

        this._startFlusher();
    }

    /**
     * Express middleware function
     */
    middleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = req.headers['x-request-id'] || randomUUID();

            // Capture request data
            const requestData = {
                method: req.method,
                endpoint: req.originalUrl || req.url,
                headers: { ...req.headers },
                body: '',
            };

            // Capture request body
            const chunks = [];
            const originalWrite = res.write;
            const originalEnd = res.end;
            const responseChunks = [];

            // Intercept response body
            res.write = function (chunk, ...args) {
                if (chunk) responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                return originalWrite.apply(res, [chunk, ...args]);
            };

            res.end = (chunk, ...args) => {
                if (chunk) responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                const responseBody = Buffer.concat(responseChunks).toString('utf8');
                const responseTime = Date.now() - startTime;

                // Async capture — non-blocking
                this._capture({
                    request_id: requestId,
                    tenant_id: this.tenantId,
                    timestamp: new Date().toISOString(),
                    traffic_type: this.trafficType,
                    method: requestData.method,
                    endpoint: requestData.endpoint,
                    request_headers: this._sanitizeHeaders(requestData.headers),
                    request_body: requestData.body,
                    response_status: res.statusCode,
                    response_headers: this._sanitizeHeaders(res.getHeaders()),
                    response_body: responseBody,
                    response_time_ms: responseTime,
                    ingestion_mode: 'sdk-node',
                });

                originalEnd.apply(res, [chunk, ...args]);
            };

            // Capture request body for POST/PUT/PATCH
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                req.on('data', chunk => chunks.push(chunk));
                req.on('end', () => {
                    requestData.body = Buffer.concat(chunks).toString('utf8');
                });
            }

            // Set request ID header on response
            res.setHeader('X-Request-ID', requestId);

            next();
        };
    }

    _capture(event) {
        if (this.queue.length >= this.maxQueueSize) {
            if (this.debug) console.warn('[ShadowSDK] Queue full, dropping event');
            return;
        }
        this.queue.push(event);

        if (this.queue.length >= this.batchSize) {
            this._flush();
        }
    }

    _startFlusher() {
        this.flushTimer = setInterval(() => this._flush(), this.flushIntervalMs);
    }

    async _flush() {
        if (this.queue.length === 0) return;

        const batch = this.queue.splice(0, this.batchSize);
        const body = JSON.stringify(batch);

        try {
            const url = new URL(this.batchUrl);
            const client = url.protocol === 'https:' ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body),
                    'X-API-Key': this.apiKey,
                    'X-Tenant-ID': this.tenantId,
                },
                timeout: 10000,
            };

            const req = client.request(options, (res) => {
                if (this.debug) {
                    console.log(`[ShadowSDK] Batch sent [count=${batch.length}, status=${res.statusCode}]`);
                }
                res.resume(); // Consume response
            });

            req.on('error', (err) => {
                if (this.debug) console.warn(`[ShadowSDK] Batch send error: ${err.message}`);
            });

            req.write(body);
            req.end();
        } catch (err) {
            if (this.debug) console.warn(`[ShadowSDK] Flush error: ${err.message}`);
        }
    }

    _sanitizeHeaders(headers) {
        const sanitized = {};
        const skipHeaders = new Set(['authorization', 'cookie', 'x-api-key']);
        for (const [key, value] of Object.entries(headers || {})) {
            if (!skipHeaders.has(key.toLowerCase())) {
                sanitized[key] = String(value);
            }
        }
        return sanitized;
    }

    shutdown() {
        if (this.flushTimer) clearInterval(this.flushTimer);
        this._flush();
    }
}

// Convenience factory
function shadowMiddleware(options) {
    const sdk = new ShadowSDK(options);

    // Cleanup on process exit
    process.on('beforeExit', () => sdk.shutdown());
    process.on('SIGINT', () => { sdk.shutdown(); process.exit(0); });

    return sdk.middleware();
}

module.exports = { ShadowSDK, shadowMiddleware };
