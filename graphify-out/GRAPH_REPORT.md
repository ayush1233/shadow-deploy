# Graph Report - .  (2026-04-18)

## Corpus Check
- 133 files · ~64,360 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 716 nodes · 1166 edges · 63 communities detected
- Extraction: 64% EXTRACTED · 36% INFERRED · 0% AMBIGUOUS · INFERRED: 416 edges (avg confidence: 0.73)
- Token cost: 1,000 input · 500 output

## Community Hubs (Navigation)
- [[_COMMUNITY_AI Comparison Client|AI Comparison Client]]
- [[_COMMUNITY_AI Service - Comparison & Risk|AI Service - Comparison & Risk]]
- [[_COMMUNITY_API Gateway & Auth Controllers|API Gateway & Auth Controllers]]
- [[_COMMUNITY_Kafka Ingestion Service|Kafka Ingestion Service]]
- [[_COMMUNITY_API Configuration & Topology|API Configuration & Topology]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]

## God Nodes (most connected - your core abstractions)
1. `ComparisonResult` - 61 edges
2. `TrafficEvent` - 35 edges
3. `SemanticComparator` - 19 edges
4. `ComparisonRepository` - 19 edges
5. `Builder` - 19 edges
6. `PIIMasker` - 16 edges
7. `ProxyConfigurator` - 15 edges
8. `RiskScorer` - 14 edges
9. `SlackNotifier` - 14 edges
10. `WebhookNotifier` - 14 edges

## Surprising Connections (you probably didn't know these)
- `ProxyConfigurator` --uses--> `LLMProvider`  [INFERRED]
  ai-service\configurator.py → ai-service\comparison\llm_provider.py
- `configurator.py  Uses LLM provider to parse natural language instructions into` --uses--> `LLMProvider`  [INFERRED]
  ai-service\configurator.py → ai-service\comparison\llm_provider.py
- `NotificationConfigRecord` --uses--> `SemanticComparator`  [INFERRED]
  ai-service\main.py → ai-service\comparison\semantic_comparator.py
- `lifespan()` --calls--> `create_provider()`  [INFERRED]
  ai-service\main.py → ai-service\comparison\llm_provider.py
- `lifespan()` --calls--> `SemanticComparator`  [INFERRED]
  ai-service\main.py → ai-service\comparison\semantic_comparator.py

## Communities

### Community 0 - "AI Comparison Client"
Cohesion: 0.04
Nodes (8): AIComparisonClient, ComparisonConsumer, ComparisonController, ComparisonResult, DeterministicComparator, async(), DeploymentStats, RiskScoreCalculator

### Community 1 - "AI Service - Comparison & Risk"
Cohesion: 0.06
Nodes (44): ABC, BaseModel, ProxyConfigurator, EmailNotifier, compare(), configure_proxy(), ConfigureRequest, health() (+36 more)

### Community 2 - "API Gateway & Auth Controllers"
Cohesion: 0.05
Nodes (9): ApiKeyController, ApiKeyEntity, ApiKeyRepository, ApiKeySyncService, AuthController, DeploymentController, TenantAccess, TenantAccessTest (+1 more)

### Community 3 - "Kafka Ingestion Service"
Cohesion: 0.06
Nodes (4): IngestionController, KafkaProducerService, TenantFilter, TrafficEvent

### Community 4 - "API Configuration & Topology"
Cohesion: 0.06
Nodes (8): FPDF, ThesisPDF, HealthController, KafkaConfig, ResponseFetcher, SecurityConfig, ShadowApiInterceptor, TopologyController

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (26): configureNotifications(), configureProxy(), createEndpointTag(), deleteEndpointTag(), getComparison(), getEndpointTags(), getMetricsSummary(), getNotificationConfig() (+18 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (9): ApiServiceApplication, ComparisonEngineApplication, CorrelationService, DefaultAdminSeeder, IngestionServiceApplication, Builder, TrafficConsumer, UsageMeteringInterceptor (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (17): configurator.py  Uses LLM provider to parse natural language instructions into, create_provider(), GeminiProvider, LLMProvider, OllamaProvider, LLM Provider abstraction for the AI Comparison Service.  Supports multiple bac, Verify Ollama is reachable (cached after first call)., Extract JSON from LLM response, handling markdown fences. (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.09
Nodes (3): AIExplanationService, AIExplanation, FieldDiff

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (20): AnimatedNumber(), esc(), exportComparisonCsv(), exportCsv(), exportEndpointAnalysisCsv(), exportOverviewCsv(), triggerDownload(), addCodeBlock() (+12 more)

### Community 10 - "Community 10"
Cohesion: 0.13
Nodes (2): ComparisonRepository, MetricsController

### Community 11 - "Community 11"
Cohesion: 0.16
Nodes (2): NoiseDetectionService, NoiseFieldController

### Community 12 - "Community 12"
Cohesion: 0.17
Nodes (5): BaseHTTPRequestHandler, Shadow API — new schema with breaking changes and additions., Production API — stable, established schema., V1Handler, V2Handler

### Community 13 - "Community 13"
Cohesion: 0.26
Nodes (13): banner(), c(), check_http(), check_service(), check_tcp(), cmd_configure(), cmd_deployment_status(), cmd_health() (+5 more)

### Community 14 - "Community 14"
Cohesion: 0.2
Nodes (2): ApiKeyAuthFilter, JwtAuthFilter

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (2): shadowMiddleware(), ShadowSDK

### Community 16 - "Community 16"
Cohesion: 0.43
Nodes (6): fetch(), main(), Fetch from an API and return status, body, and timing., Send a traffic event to the ingestion service., run_traffic(), send_to_ingestion()

### Community 17 - "Community 17"
Cohesion: 0.48
Nodes (6): check_http(), check_tcp(), main(), print_results(), Run health checks on all services. If wait=True, retry until all critical servic, run_checks()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (2): Show-Banner(), Write-Color()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (1): WebMvcConfig

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (1): UserEntity

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (1): UsageEventRepository

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (0): 

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (1): ComparisonResultEntity

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (1): UsageEventEntity

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (0): 

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (0): 

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (0): 

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (0): 

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (0): 

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (0): 

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (2): Comparison Engine, Shadow Deployment

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): Send a prompt and return parsed JSON response.

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): Synchronous version for non-async contexts (e.g. configurator).

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (0): 

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (0): 

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (0): 

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (0): 

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (0): 

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (0): 

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (0): 

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (0): 

### Community 53 - "Community 53"
Cohesion: 1.0
Nodes (0): 

### Community 54 - "Community 54"
Cohesion: 1.0
Nodes (0): 

### Community 55 - "Community 55"
Cohesion: 1.0
Nodes (0): 

### Community 56 - "Community 56"
Cohesion: 1.0
Nodes (0): 

### Community 57 - "Community 57"
Cohesion: 1.0
Nodes (0): 

### Community 58 - "Community 58"
Cohesion: 1.0
Nodes (0): 

### Community 59 - "Community 59"
Cohesion: 1.0
Nodes (0): 

### Community 60 - "Community 60"
Cohesion: 1.0
Nodes (0): 

### Community 61 - "Community 61"
Cohesion: 1.0
Nodes (1): SaaS Readiness Roadmap

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Ollama Setup

## Knowledge Gaps
- **34 isolated node(s):** `Pydantic models for the AI Comparison Service.`, `Updates the upstream blocks in nginx.conf with new ports and restarts the contai`, `Executes docker-compose restart on the nginx proxy container.`, `LLM Provider abstraction for the AI Comparison Service.  Supports multiple bac`, `Base class for LLM providers.` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 25`** (2 nodes): `configure-proxy.py`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `demo.py`, `main()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `LatencyBar.tsx`, `shortenEndpoint()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `SeverityDonut.tsx`, `SeverityDonut()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `TrendChart.tsx`, `TrendChart()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `PageHeader.tsx`, `PageHeader()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `EmptyState.tsx`, `EmptyState()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `GlassCard.tsx`, `GlassCard()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `RiskGauge.tsx`, `RiskGauge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `SearchInput.tsx`, `handleChange()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `SeverityBadge.tsx`, `SeverityBadge()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `SkeletonLoader.tsx`, `getClass()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `Toast.tsx`, `useToast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `useMouseParallax.ts`, `useMouseParallax()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `QuickConfigurePage.tsx`, `QuickConfigurePage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `WebsiteTestPage.tsx`, `WebsiteTestPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `target_test_traffic.py`, `send_traffic()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `Comparison Engine`, `Shadow Deployment`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `Send a prompt and return parsed JSON response.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Synchronous version for non-async contexts (e.g. configurator).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `__init__.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `start-shadow.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `main.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `vite-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `ProtectedRoute.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `Sidebar.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `MethodBadge.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 53`** (1 nodes): `StatCard.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 54`** (1 nodes): `supabase.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 55`** (1 nodes): `server.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (1 nodes): `server.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 57`** (1 nodes): `check_db.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (1 nodes): `check_db.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (1 nodes): `migrate.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (1 nodes): `test-platform.ps1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 61`** (1 nodes): `SaaS Readiness Roadmap`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Ollama Setup`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ComparisonResult` connect `AI Comparison Client` to `Community 8`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Why does `Number()` connect `Community 9` to `Community 5`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `SemanticComparator` (e.g. with `NotificationConfigRecord` and `ConfigureRequest`) actually correct?**
  _`SemanticComparator` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `Builder` (e.g. with `.createDefaultAdmin()` and `.createKey()`) actually correct?**
  _`Builder` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Pydantic models for the AI Comparison Service.`, `Updates the upstream blocks in nginx.conf with new ports and restarts the contai`, `Executes docker-compose restart on the nginx proxy container.` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Comparison Client` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `AI Service - Comparison & Risk` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._