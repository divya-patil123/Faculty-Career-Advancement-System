package com.faculty.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * One row = complete eligibility criteria for ONE post at ONE version.
 * Only the row where active=true is used for eligibility checks.
 * Every save creates a new version — old ones kept as history.
 */
@Entity
@Table(name = "eligibility_criteria")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EligibilityCriteria {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String postName;

    // ── Qualifying Exam (NET / SET / SLET) ─────────────────────────────────────
    /**
     * NET/SET/SLET requirement mode:
     *   NONE       — not required at all
     *   REQUIRED   — mandatory (no exemption)
     *   OR_PHD     — required OR PhD (whichever the candidate has)
     */
    @Column(nullable = false)
    @Builder.Default
    private String netSetSletRequirement = "OR_PHD";  // NONE | REQUIRED | OR_PHD

    /** If true, NET is accepted as qualifying exam */
    @Column(nullable = false) @Builder.Default private Boolean netAccepted = true;
    /** If true, SET is accepted as qualifying exam */
    @Column(nullable = false) @Builder.Default private Boolean setAccepted = true;
    /** If true, SLET is accepted as qualifying exam */
    @Column(nullable = false) @Builder.Default private Boolean sletAccepted = true;

    // ── Education ──────────────────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Double minPgPercentage = 55.0;
    @Column(nullable = false) @Builder.Default private Boolean phdRequired = false;

    // ── Experience ─────────────────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Double minTeachingExperienceYears = 0.0;
    @Column(nullable = false) @Builder.Default private Double minTotalExperienceYears = 0.0;

    // ── API Score ──────────────────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Integer minApiScore = 0;

    // ── Publication minimums ───────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Integer minSciPublications = 0;
    @Column(nullable = false) @Builder.Default private Integer minScopusPublications = 0;
    @Column(nullable = false) @Builder.Default private Integer minUgcCarePublications = 0;
    @Column(nullable = false) @Builder.Default private Integer minConferencePublications = 0;
    @Column(nullable = false) @Builder.Default private Integer minLocalPublications = 0;
    /** Combined SCI + Scopus + UGC Care minimum */
    @Column(nullable = false) @Builder.Default private Integer minTotalIndexedPublications = 0;

    // ── API Score weights ──────────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Integer weightSciPublication = 30;
    @Column(nullable = false) @Builder.Default private Integer weightScieCitation = 5;
    @Column(nullable = false) @Builder.Default private Integer weightScopusPublication = 20;
    @Column(nullable = false) @Builder.Default private Integer weightUgcCarePublication = 10;
    @Column(nullable = false) @Builder.Default private Integer weightConferencePublication = 5;
    @Column(nullable = false) @Builder.Default private Integer weightLocalPublication = 2;
    @Column(nullable = false) @Builder.Default private Integer weightBookChapter = 15;
    @Column(nullable = false) @Builder.Default private Integer weightTeachingExperiencePerYear = 10;
    @Column(nullable = false) @Builder.Default private Integer maxTeachingExperiencePoints = 100;

    // ── Bonus points ───────────────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Integer phdBonus = 30;
    @Column(nullable = false) @Builder.Default private Integer netSetSletBonus = 0;  // optional bonus for clearing exam
    @Column(nullable = false) @Builder.Default private Double pgBonusThreshold1 = 75.0;
    @Column(nullable = false) @Builder.Default private Integer pgBonus1 = 20;
    @Column(nullable = false) @Builder.Default private Double pgBonusThreshold2 = 60.0;
    @Column(nullable = false) @Builder.Default private Integer pgBonus2 = 10;

    // ── Versioning ─────────────────────────────────────────────────────────────
    @Column(nullable = false) @Builder.Default private Integer version = 1;
    @Column(nullable = false) @Builder.Default private Boolean active = false;

    @Column(columnDefinition = "TEXT")
    private String changeNote;

    private String createdBy;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime activatedAt;

    @PrePersist
    public void prePersist() { createdAt = LocalDateTime.now(); }
}
