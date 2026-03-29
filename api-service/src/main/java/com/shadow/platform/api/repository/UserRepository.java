package com.shadow.platform.api.repository;

import com.shadow.platform.api.model.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByUsername(String username);

    Optional<UserEntity> findByEmail(String email);

    List<UserEntity> findByTenantId(String tenantId);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
