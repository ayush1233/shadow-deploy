---
type: community
cohesion: 0.06
members: 78
---

# AI Service - Comparison & Risk

**Cohesion:** 0.06 - loosely connected
**Members:** 78 nodes

## Members
- [[.__init__()]] - code - ai-service\configurator.py
- [[.__init__()_6]] - code - ai-service\notifications\email_notifier.py
- [[.__init__()_1]] - code - ai-service\nginx_updater.py
- [[.__init__()_7]] - code - ai-service\notifications\notifier.py
- [[.__init__()_4]] - code - ai-service\comparison\pii_masker.py
- [[.__init__()_8]] - code - ai-service\notifications\slack_notifier.py
- [[.__init__()_9]] - code - ai-service\notifications\webhook_notifier.py
- [[._is_sensitive_key()]] - code - ai-service\comparison\pii_masker.py
- [[._mask_json()]] - code - ai-service\comparison\pii_masker.py
- [[._mask_text()]] - code - ai-service\comparison\pii_masker.py
- [[._parse_with_heuristics()]] - code - ai-service\configurator.py
- [[._parse_with_llm()]] - code - ai-service\configurator.py
- [[.calculate()]] - code - ai-service\comparison\risk_scorer.py
- [[.classify_severity()]] - code - ai-service\comparison\risk_scorer.py
- [[.mask()]] - code - ai-service\comparison\pii_masker.py
- [[.parse_instruction()]] - code - ai-service\configurator.py
- [[.recommend_action()]] - code - ai-service\comparison\risk_scorer.py
- [[.restart_nginx()]] - code - ai-service\nginx_updater.py
- [[.send()]] - code - ai-service\notifications\email_notifier.py
- [[.send()_1]] - code - ai-service\notifications\slack_notifier.py
- [[.send()_2]] - code - ai-service\notifications\webhook_notifier.py
- [[.update_ports()]] - code - ai-service\nginx_updater.py
- [[ABC]] - code
- [[Accepts a natural language instruction and dynamically updates the NGINX proxy p]] - rationale - ai-service\main.py
- [[Apply regex-based PII masking to plain text.]] - rationale - ai-service\comparison\pii_masker.py
- [[BaseModel]] - code
- [[Calculates a deployment risk score (0-10) based on     - Semantic similarity s]] - rationale - ai-service\comparison\risk_scorer.py
- [[Check if a field name indicates sensitive data.]] - rationale - ai-service\comparison\pii_masker.py
- [[Classify risk score into severity level.]] - rationale - ai-service\comparison\risk_scorer.py
- [[ComparisonRequest]] - code - ai-service\models.py
- [[ComparisonResponse]] - code - ai-service\models.py
- [[Compute risk score (0-10).          Weights         - Similarity inverse]] - rationale - ai-service\comparison\risk_scorer.py
- [[ConfigureRequest]] - code - ai-service\main.py
- [[EmailNotifier]] - code - ai-service\notifications\email_notifier.py
- [[Executes docker-compose restart on the nginx proxy container.]] - rationale - ai-service\nginx_updater.py
- [[FieldDiff]] - code - ai-service\models.py
- [[Generate recommended action based on risk score and severity.]] - rationale - ai-service\comparison\risk_scorer.py
- [[HealthResponse]] - code - ai-service\models.py
- [[Mask PII in the given response body.         Handles both JSON and plain text.]] - rationale - ai-service\comparison\pii_masker.py
- [[Masks personally identifiable information and sensitive data     from API respo]] - rationale - ai-service\comparison\pii_masker.py
- [[NginxConfigurator]] - code - ai-service\nginx_updater.py
- [[NotificationConfigModel]] - code - ai-service\main.py
- [[NotificationConfigRecord]] - code - ai-service\main.py
- [[Notifier]] - code
- [[Notifier_1]] - code - ai-service\notifications\notifier.py
- [[PII Masker — Masks sensitive fields before sending data to AI models.]] - rationale - ai-service\comparison\pii_masker.py
- [[PIIMasker]] - code - ai-service\comparison\pii_masker.py
- [[Perform AI-powered semantic comparison between production and shadow responses.]] - rationale - ai-service\main.py
- [[ProxyConfigurator]] - code - ai-service\configurator.py
- [[Pydantic models for the AI Comparison Service.]] - rationale - ai-service\models.py
- [[Re-init after lifespan sets up the provider.]] - rationale - ai-service\main.py
- [[Recursively mask sensitive fields in JSON data.]] - rationale - ai-service\comparison\pii_masker.py
- [[Risk Scorer — Computes deployment risk score (0-10) and classifies severity bas]] - rationale - ai-service\comparison\risk_scorer.py
- [[RiskScorer]] - code - ai-service\comparison\risk_scorer.py
- [[Shadow API Validation Platform — AI Comparison Service FastAPI application with]] - rationale - ai-service\main.py
- [[SlackNotifier]] - code - ai-service\notifications\slack_notifier.py
- [[Updates the upstream blocks in nginx.conf with new ports and restarts the contai]] - rationale - ai-service\nginx_updater.py
- [[WebhookNotifier]] - code - ai-service\notifications\webhook_notifier.py
- [[WebsiteTestRequest]] - code - ai-service\main.py
- [[_init_configurator()]] - code - ai-service\main.py
- [[compare()]] - code - ai-service\main.py
- [[configure_notifications()]] - code - ai-service\main.py
- [[configure_proxy()]] - code - ai-service\main.py
- [[email_notifier.py]] - code - ai-service\notifications\email_notifier.py
- [[get_notification_config()]] - code - ai-service\main.py
- [[health()]] - code - ai-service\main.py
- [[lifespan()]] - code - ai-service\main.py
- [[main.py]] - code - ai-service\main.py
- [[models.py]] - code - ai-service\models.py
- [[nginx_updater.py]] - code - ai-service\nginx_updater.py
- [[notifier.py]] - code - ai-service\notifications\notifier.py
- [[pii_masker.py]] - code - ai-service\comparison\pii_masker.py
- [[risk_scorer.py]] - code - ai-service\comparison\risk_scorer.py
- [[send()]] - code - ai-service\notifications\notifier.py
- [[slack_notifier.py]] - code - ai-service\notifications\slack_notifier.py
- [[trigger_notifications()]] - code - ai-service\main.py
- [[webhook_notifier.py]] - code - ai-service\notifications\webhook_notifier.py
- [[website_test()]] - code - ai-service\main.py

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/AI_Service_-_Comparison_&_Risk
SORT file.name ASC
```

## Connections to other communities
- 17 edges to [[_COMMUNITY_Community 7]]
- 3 edges to [[_COMMUNITY_API Configuration & Topology]]
- 1 edge to [[_COMMUNITY_AI Comparison Client]]
- 1 edge to [[_COMMUNITY_Kafka Ingestion Service]]

## Top bridge nodes
- [[.send()_2]] - degree 7, connects to 3 communities
- [[main.py]] - degree 15, connects to 1 community
- [[ProxyConfigurator]] - degree 15, connects to 1 community
- [[ConfigureRequest]] - degree 13, connects to 1 community
- [[NotificationConfigModel]] - degree 13, connects to 1 community