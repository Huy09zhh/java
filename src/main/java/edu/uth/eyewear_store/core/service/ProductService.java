package edu.uth.eyewear_store.core.service;

import edu.uth.eyewear_store.core.entity.Product;
import edu.uth.eyewear_store.core.repository.ProductRepository;
import edu.uth.eyewear_store.core.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AuditLogService auditLogService;

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public List<Product> searchProducts(String keyword, String type, Boolean available, Boolean preOrder, Boolean allowPrescription) {
        return productRepository.search(keyword, type, available, preOrder, allowPrescription);
    }

    public Product getProductById(@NonNull Long id) {
        return productRepository.findById(id).orElseThrow(() -> new RuntimeException("Product not found"));
    }

    // Các hàm Create, Update, Delete được TV2 phát triển thêm ở các bước sau...
}