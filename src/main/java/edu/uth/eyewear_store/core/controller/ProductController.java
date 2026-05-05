package edu.uth.eyewear_store.core.controller;

import edu.uth.eyewear_store.core.entity.Product;
import edu.uth.eyewear_store.core.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService productService;
    
    @GetMapping
    public List<Product> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean available,
            @RequestParam(required = false) Boolean preOrder,
            @RequestParam(required = false) Boolean allowPrescription) {

        // Nếu có truyền lên bất kỳ tham số tìm kiếm nào
        if (keyword != null || type != null || available != null || preOrder != null || allowPrescription != null) {
            return productService.searchProducts(keyword, type, available, preOrder, allowPrescription);
        }

        // Nếu không có tham số, trả về toàn bộ
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @PostMapping
    public Product createProduct(@RequestBody @NonNull Product product) {
        return productService.createProduct(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable @NonNull Long id, @RequestBody @NonNull Product product) {
        return ResponseEntity.ok(productService.updateProduct(id, product));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable @NonNull Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build();
    }
}