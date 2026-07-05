package com.faculty.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Document {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;

    @Column(nullable = false)
    private String documentType;

    @Column(nullable = false)
    private String originalFileName;

    @Column(nullable = false)
    private String storedFileName;

    /** Absolute filesystem path — used by secure /api/.../download endpoint */
    @Column(nullable = false)
    private String filePath;

    /**
     * Relative path: "{userId}/{storedFileName}"
     * Used to build the public URL: http://localhost:8080/files/{relativePath}
     * This lets the browser load images directly with no JWT needed.
     */
    @Column
    private String relativePath;

    private String contentType;
    private Long fileSize;

    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() { uploadedAt = LocalDateTime.now(); }
}
