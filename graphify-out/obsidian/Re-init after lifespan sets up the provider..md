---
source_file: "ai-service\main.py"
type: "rationale"
community: "AI Service - Comparison & Risk"
location: "L231"
tags:
  - graphify/rationale
  - graphify/INFERRED
  - community/AI_Service_-_Comparison_&_Risk
---

# Re-init after lifespan sets up the provider.

## Connections
- [[ComparisonRequest]] - `uses` [INFERRED]
- [[ComparisonResponse]] - `uses` [INFERRED]
- [[EmailNotifier]] - `uses` [INFERRED]
- [[HealthResponse]] - `uses` [INFERRED]
- [[NginxConfigurator]] - `uses` [INFERRED]
- [[PIIMasker]] - `uses` [INFERRED]
- [[ProxyConfigurator]] - `uses` [INFERRED]
- [[RiskScorer]] - `uses` [INFERRED]
- [[SemanticComparator]] - `uses` [INFERRED]
- [[SlackNotifier]] - `uses` [INFERRED]
- [[WebhookNotifier]] - `uses` [INFERRED]
- [[_init_configurator()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/INFERRED #community/AI_Service_-_Comparison_&_Risk