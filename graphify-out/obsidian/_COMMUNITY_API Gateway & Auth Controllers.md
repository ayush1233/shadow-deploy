---
type: community
cohesion: 0.05
members: 55
---

# API Gateway & Auth Controllers

**Cohesion:** 0.05 - loosely connected
**Members:** 55 nodes

## Members
- [[.ApiKeyController()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[.ApiKeySyncService()]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[.AuthController()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\AuthController.java
- [[.TenantAccess()]] - code - api-service\src\main\java\com\shadow\platform\api\security\TenantAccess.java
- [[.approveDeployment()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\DeploymentController.java
- [[.bytesToHex()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[.createKey()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[.existsByEmail()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\UserRepository.java
- [[.existsByUsername()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\UserRepository.java
- [[.findByEmail()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\UserRepository.java
- [[.findByIsActiveTrue()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\ApiKeyRepository.java
- [[.findByKeyHash()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\ApiKeyRepository.java
- [[.findByTenantId()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\ApiKeyRepository.java
- [[.findByTenantId()_1]] - code - api-service\src\main\java\com\shadow\platform\api\repository\UserRepository.java
- [[.findByTenantIdAndIsActiveTrue()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\ApiKeyRepository.java
- [[.findByUsername()]] - code - api-service\src\main\java\com\shadow\platform\api\repository\UserRepository.java
- [[.generateApiKey()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[.getDeploymentReport()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\DeploymentController.java
- [[.initialSync()]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[.isExpired()]] - code - api-service\src\main\java\com\shadow\platform\api\model\ApiKeyEntity.java
- [[.listKeys()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[.listUsers()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\AuthController.java
- [[.login()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\AuthController.java
- [[.onCreate()]] - code - api-service\src\main\java\com\shadow\platform\api\model\ApiKeyEntity.java
- [[.periodicSync()]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[.rejectDeployment()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\DeploymentController.java
- [[.removeKeyFromRedis()]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[.requireTenantId()]] - code - api-service\src\main\java\com\shadow\platform\api\security\TenantAccess.java
- [[.requireTenantIdRejectsMissingTenant()]] - code - api-service\src\test\java\com\shadow\platform\api\security\TenantAccessTest.java
- [[.requireTenantIdReturnsRequestTenant()]] - code - api-service\src\test\java\com\shadow\platform\api\security\TenantAccessTest.java
- [[.revokeKey()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[.sha256()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[.signup()]] - code - api-service\src\main\java\com\shadow\platform\api\controller\AuthController.java
- [[.syncAllKeysToRedis()]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[.syncKeyToRedis()]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[.validateTenantOverride()]] - code - api-service\src\main\java\com\shadow\platform\api\security\TenantAccess.java
- [[.validateTenantOverrideRejectsCrossTenantRequests()]] - code - api-service\src\test\java\com\shadow\platform\api\security\TenantAccessTest.java
- [[ApiKeyController]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[ApiKeyController.java]] - code - api-service\src\main\java\com\shadow\platform\api\controller\ApiKeyController.java
- [[ApiKeyEntity]] - code - api-service\src\main\java\com\shadow\platform\api\model\ApiKeyEntity.java
- [[ApiKeyEntity.java]] - code - api-service\src\main\java\com\shadow\platform\api\model\ApiKeyEntity.java
- [[ApiKeyRepository]] - code - api-service\src\main\java\com\shadow\platform\api\repository\ApiKeyRepository.java
- [[ApiKeyRepository.java]] - code - api-service\src\main\java\com\shadow\platform\api\repository\ApiKeyRepository.java
- [[ApiKeySyncService]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[ApiKeySyncService.java]] - code - api-service\src\main\java\com\shadow\platform\api\service\ApiKeySyncService.java
- [[AuthController]] - code - api-service\src\main\java\com\shadow\platform\api\controller\AuthController.java
- [[AuthController.java]] - code - api-service\src\main\java\com\shadow\platform\api\controller\AuthController.java
- [[DeploymentController]] - code - api-service\src\main\java\com\shadow\platform\api\controller\DeploymentController.java
- [[DeploymentController.java]] - code - api-service\src\main\java\com\shadow\platform\api\controller\DeploymentController.java
- [[TenantAccess]] - code - api-service\src\main\java\com\shadow\platform\api\security\TenantAccess.java
- [[TenantAccess.java]] - code - api-service\src\main\java\com\shadow\platform\api\security\TenantAccess.java
- [[TenantAccessTest]] - code - api-service\src\test\java\com\shadow\platform\api\security\TenantAccessTest.java
- [[TenantAccessTest.java]] - code - api-service\src\test\java\com\shadow\platform\api\security\TenantAccessTest.java
- [[UserRepository]] - code - api-service\src\main\java\com\shadow\platform\api\repository\UserRepository.java
- [[UserRepository.java]] - code - api-service\src\main\java\com\shadow\platform\api\repository\UserRepository.java

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/API_Gateway_&_Auth_Controllers
SORT file.name ASC
```

## Connections to other communities
- 5 edges to [[_COMMUNITY_Community 6]]
- 4 edges to [[_COMMUNITY_Kafka Ingestion Service]]
- 3 edges to [[_COMMUNITY_API Configuration & Topology]]
- 2 edges to [[_COMMUNITY_AI Comparison Client]]
- 2 edges to [[_COMMUNITY_Community 10]]

## Top bridge nodes
- [[.signup()]] - degree 8, connects to 3 communities
- [[.requireTenantId()]] - degree 14, connects to 2 communities
- [[.createKey()]] - degree 8, connects to 2 communities
- [[.revokeKey()]] - degree 5, connects to 2 communities
- [[.syncAllKeysToRedis()]] - degree 7, connects to 1 community