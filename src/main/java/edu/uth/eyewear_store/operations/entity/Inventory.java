package edu.uth.eyewear_store.operations.entity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "inventories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    private Integer quantity;
}