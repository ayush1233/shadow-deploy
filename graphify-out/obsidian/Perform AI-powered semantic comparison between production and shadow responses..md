---
source_file: "ai-service\main.py"
type: "rationale"
community: "AI Service - Comparison & Risk"
location: "L142"
tags:
  - graphify/rationale
  - graphify/INFERRED
  - community/AI_Service_-_Comparison_&_Risk
---

# Perform AI-powered semantic comparison between production and shadow responses.

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
- [[compare()]] - `rationale_for` [EXTRACTED]

#graphify/rationale #graphify/INFERRED #community/AI_Service_-_Comparison_&_Risk