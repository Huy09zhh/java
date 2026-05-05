package edu.uth.eyewear_store.core.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "business_policies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BusinessPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code; // Ví dụ: WARRANTY_POLICY, RETURN_POLICY

    @Column(nullable = false, columnDefinition = "NVARCHAR(255)")
    private String title;

    @Column(nullable = false, columnDefinition = "NVARCHAR(4000)")
    private String content;

    @Column(nullable = false)
    private boolean active;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void markUpdated() {
        this.updatedAt = LocalDateTime.now();
    }
}