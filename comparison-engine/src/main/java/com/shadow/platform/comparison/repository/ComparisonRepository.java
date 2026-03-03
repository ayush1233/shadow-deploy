package com.shadow.platform.comparison.repository;

import com.shadow.platform.comparison.model.ComparisonResultEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComparisonRepository extends JpaRepository<ComparisonResultEntity, String> {
}
