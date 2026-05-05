package edu.uth.eyewear_store.core.repository;

import edu.uth.eyewear_store.core.entity.BusinessPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BusinessPolicyRepository extends JpaRepository<BusinessPolicy, Long> {
    Optional<BusinessPolicy> findByCode(String code);
}