package edu.uth.eyewear_store.core.service;

import edu.uth.eyewear_store.core.entity.BusinessPolicy;
import edu.uth.eyewear_store.core.repository.BusinessPolicyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Objects;

@Service
public class BusinessPolicyService {
    @Autowired
    private BusinessPolicyRepository businessPolicyRepository;

    public List<BusinessPolicy> getAllPolicies() {
        return businessPolicyRepository.findAll();
    }

    public BusinessPolicy getPolicy(Long id) {
        Long policyId = Objects.requireNonNull(id, "Policy id is required");
        return businessPolicyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));
    }

    // Hàm Upsert: Cập nhật nếu đã có code này, hoặc tạo mới nếu chưa có
    public BusinessPolicy upsert(BusinessPolicy policy) {
        businessPolicyRepository.findByCode(policy.getCode())
                .ifPresent(existing -> policy.setId(existing.getId()));
        return businessPolicyRepository.save(policy);
    }

    public void deletePolicy(Long id) {
        businessPolicyRepository.deleteById(id);
    }
}