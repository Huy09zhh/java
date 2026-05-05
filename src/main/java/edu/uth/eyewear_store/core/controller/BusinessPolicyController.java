package edu.uth.eyewear_store.core.controller;

import edu.uth.eyewear_store.core.entity.BusinessPolicy;
import edu.uth.eyewear_store.core.service.BusinessPolicyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/policies")
@CrossOrigin(origins = "*")
public class BusinessPolicyController {
    @Autowired
    private BusinessPolicyService businessPolicyService;

    // Khách hàng hoặc ai cũng có thể xem chính sách
    @GetMapping
    public List<BusinessPolicy> getAllPolicies() {
        return businessPolicyService.getAllPolicies();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusinessPolicy> getById(@PathVariable Long id) {
        return ResponseEntity.ok(businessPolicyService.getPolicy(id));
    }

    // Chỉ Quản lý và Admin mới được phép tạo/sửa chính sách
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<BusinessPolicy> upsert(@RequestBody BusinessPolicy policy) {
        return ResponseEntity.ok(businessPolicyService.upsert(policy));
    }

    // Chỉ Quản lý và Admin mới được phép xóa chính sách
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        businessPolicyService.deletePolicy(id);
        return ResponseEntity.ok().build();
    }
}