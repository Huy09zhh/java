package edu.uth.eyewear_store.core.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.Nationalized;
import lombok.*;
import java.math.BigDecimal;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Nationalized
    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String sku;

    private String type; // FRAME, LENS, ACCESSORY, COMBO

    @Column(nullable = false)
    private BigDecimal basePrice;

    @Column(length = 2000)
    private String imageUrl; // Ảnh đại diện chính

    @Nationalized
    @Column(length = 4000)
    private String description;

    @Nationalized
    @Column(length = 6000)
    private String detailTabsJson;

    // BƯỚC C29: THÊM TRƯỜNG GALLERY ĐỂ LƯU MẢNG ẢNH
    @Column(length = 4000)
    private String galleryImagesJson;

    @Builder.Default
    @JsonProperty("available")
    @Column(name = "is_available")
    private boolean available = true;

    @Builder.Default
    @JsonProperty("preOrder")
    @Column(name = "is_pre_order")
    private boolean preOrder = false;

    @Builder.Default
    @JsonProperty("allowPrescription")
    @Column(name = "allow_prescription")
    private Boolean allowPrescription = false;

    @Builder.Default
    @JsonProperty("showPrescriptionForm")
    @Column(name = "show_prescription_form")
    private Boolean showPrescriptionForm = false;

    @Column(length = 2000)
    private String tags;

    @Column(length = 2000)
    private String comboItemsJson;

    @Builder.Default
    private Integer discountPercentage = 0;
}