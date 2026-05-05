package edu.uth.eyewear_store.core.service;

import edu.uth.eyewear_store.core.entity.Product;
import edu.uth.eyewear_store.core.repository.ProductRepository;
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

    public Product createProduct(@NonNull Product product) {
        if (productRepository.existsBySku(product.getSku())) {
            throw new RuntimeException("SKU already exists");
        }
        Product saved = productRepository.save(product);
        auditLogService.logAction("CREATE", "PRODUCT", saved.getId().toString(), "Thêm sản phẩm: " + saved.getName());
        return saved;
    }

    public Product updateProduct(@NonNull Long id, Product productDetails) {
        Product product = getProductById(id);
        product.setName(productDetails.getName());
        product.setSku(productDetails.getSku());
        product.setDescription(productDetails.getDescription());
        product.setBasePrice(productDetails.getBasePrice());
        product.setType(productDetails.getType());
        product.setAvailable(productDetails.isAvailable());
        product.setPreOrder(productDetails.isPreOrder());
        product.setAllowPrescription(productDetails.getAllowPrescription());
        product.setShowPrescriptionForm(productDetails.getShowPrescriptionForm());
        product.setDiscountPercentage(productDetails.getDiscountPercentage());

        Product updated = productRepository.save(product);
        auditLogService.logAction("UPDATE", "PRODUCT", id.toString(), "Cập nhật thông tin sản phẩm: " + updated.getName());
        return updated;
    }

    public void deleteProduct(@NonNull Long id) {
        Product product = getProductById(id);
        String productName = product.getName();
        productRepository.deleteById(id);
        auditLogService.logAction("DELETE", "PRODUCT", id.toString(), "Xóa sản phẩm: " + productName);
    }
}