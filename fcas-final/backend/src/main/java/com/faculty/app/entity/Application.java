package com.faculty.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false) private String applyingForPost;
    private String currentPost;

    // Profile snapshot at submission time
    private String ugBranch;
    private String pgBranch;
    private Double pgPercentage;
    private Boolean phdDone;
    private Boolean netCleared;
    private Boolean setCleared;
    private Boolean sletCleared;
    private Double totalExperienceYears;
    private Double teachingExperienceYears;
    private Integer sciPublications;
    private Integer scopusPublications;
    private Integer ugcCarePublications;
    private Integer conferencePublications;
    private Integer localPublications;
    private Integer calculatedApiScore;

    // Criteria snapshot (which version was active when submitted)
    private Long criteriaVersionId;
    private Integer criteriaVersion;

    private Boolean eligible;

    @Column(columnDefinition = "TEXT") private String eligibilityRemarks;

    @Enumerated(EnumType.STRING)
    @Builder.Default private Status status = Status.PENDING;

    @Column(columnDefinition = "TEXT") private String adminRemarks;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @PrePersist public void prePersist() { submittedAt = LocalDateTime.now(); }

    public enum Status { PENDING, UNDER_REVIEW, APPROVED, REJECTED }
}
