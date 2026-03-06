/**
 * extract-topology.js
 * 
 * Run at build time to parse nginx.conf and docker-compose.yml
 * and generate a topology-config.json consumed by TopologyPage.
 * 
 * Usage:  node scripts/extract-topology.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');       // shadow-deploy/
const OUT = path.join(__dirname, '..', 'src', 'topology-config.json');

// ── Parse nginx.conf ──
function parseNginx() {
    const file = path.join(ROOT, 'nginx', 'nginx.conf');
    if (!fs.existsSync(file)) return { prodPort: null, shadowPort: null, proxyPort: 80 };
    const txt = fs.readFileSync(file, 'utf8');

    const prodMatch = txt.match(/upstream\s+production_backend\s*\{[^}]*server\s+[^:]+:(\d+)/s);
    const shadowMatch = txt.match(/upstream\s+shadow_backend\s*\{[^}]*server\s+[^:]+:(\d+)/s);
    const listenMatch = txt.match(/listen\s+(\d+);\s*\n\s*server_name/);

    return {
        prodPort: prodMatch ? Number(prodMatch[1]) : null,
        shadowPort: shadowMatch ? Number(shadowMatch[1]) : null,
        proxyPort: listenMatch ? Number(listenMatch[1]) : 80,
    };
}

// ── Parse docker-compose.yml (simple port extraction, no YAML lib needed) ──
function parseDockerCompose() {
    const file = path.join(ROOT, 'docker-compose.yml');
    if (!fs.existsSync(file)) return {};
    const txt = fs.readFileSync(file, 'utf8');

    const services = {};
    // Match service blocks and their published ports
    const serviceBlocks = txt.split(/^  (\w[\w-]*):/gm);
    for (let i = 1; i < serviceBlocks.length; i += 2) {
        const name = serviceBlocks[i];
        const block = serviceBlocks[i + 1] || '';
        const ports = [];
        const portMatches = block.matchAll(/-\s*"(\d+):(\d+)"/g);
        for (const m of portMatches) {
            ports.push({ host: Number(m[1]), container: Number(m[2]) });
        }
        if (ports.length > 0) {
            services[name] = ports;
        }
    }
    return services;
}

// ── Build topology config ──
function buildConfig() {
    const nginx = parseNginx();
    const compose = parseDockerCompose();

    // Find service ports from compose
    const getPort = (name, fallback) => {
        if (compose[name] && compose[name].length > 0) return compose[name][0].host;
        return fallback;
    };

    const config = {
        _generatedAt: new Date().toISOString(),
        _source: 'Extracted from nginx/nginx.conf and docker-compose.yml',
        prodPort: nginx.prodPort || 3000,
        shadowPort: nginx.shadowPort || 4000,
        proxyPort: nginx.proxyPort || 80,
        kafkaPort: getPort('kafka', 9092),
        zookeeperPort: getPort('zookeeper', 2181),
        ingestionPort: getPort('ingestion-service', 8081),
        comparisonPort: getPort('comparison-engine', 8082),
        apiServicePort: getPort('api-service', 8083),
        aiServicePort: getPort('ai-service', 8000),
        dashboardPort: getPort('dashboard', 3003),
        // Service names from compose
        services: Object.keys(compose),
    };

    fs.writeFileSync(OUT, JSON.stringify(config, null, 2));
    console.log('✅ topology-config.json generated:');
    console.log(JSON.stringify(config, null, 2));
}

buildConfig();
