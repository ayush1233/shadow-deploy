---
source_file: "ai-service\main.py"
type: "rationale"
community: "AI Service - Comparison & Risk"
location: "L246"
tags:
  - graphify/rationale
  - graphify/INFERRED
  - community/AI_Service_-_Comparison_&_Risk
---

# Accepts a natural language instruction and dynamically updates the NGINX proxy p

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
- [[configure_proxy()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/INFERRED #community/AI_Service_-_Comparison_&_Risk