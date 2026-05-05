package edu.uth.eyewear_store.core.repository;

import edu.uth.eyewear_store.core.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByType(String type);
    List<Product> findByAvailableTrue();
    boolean existsBySku(String sku);

    @Query("""
      SELECT p FROM Product p
      WHERE (:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
          OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:type IS NULL OR p.type = :type)
        AND (:available IS NULL OR p.available = :available)
        AND (:preOrder IS NULL OR p.preOrder = :preOrder)
        AND (:allowPrescription IS NULL OR p.allowPrescription = :allowPrescription)
      """)
    List<Product> search(String keyword, String type, Boolean available, Boolean preOrder, Boolean allowPrescription);
}