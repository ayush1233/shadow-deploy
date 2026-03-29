package com.shadow.platform.api.repository;

import com.shadow.platform.api.model.ApiKeyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKeyEntity, Long> {

    Optional<ApiKeyEntity> findByKeyHash(String keyHash);

    List<ApiKeyEntity> findByTenantId(String tenantId);

    List<ApiKeyEntity> findByTenantIdAndIsActiveTrue(String tenantId);

    List<ApiKeyEntity> findByIsActiveTrue();
}
