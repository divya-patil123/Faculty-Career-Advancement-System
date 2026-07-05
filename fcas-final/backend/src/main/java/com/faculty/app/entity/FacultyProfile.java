package com.faculty.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_profiles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class FacultyProfile {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // ── UG ────────────────────────────────────────────────────────────────────
    private String ugDegree;
    private String ugBranch;
    private String ugUniversity;
    private Integer ugPassingYear;
    /** Converted percentage used for eligibility checks (always in %) */
    private Double ugPercentage;
    /** Original entered value — may be CGPA (e.g. 8.5) or percentage (e.g. 85.0) */
    private Double ugCgpa;
    /** "PERCENTAGE" or "CGPA" — tracks which input mode faculty used */
    private String ugScoreType;
    /** CGPA scale used for conversion: 10 or 4 */
    private Double ugCgpaScale;

    // ── PG ────────────────────────────────────────────────────────────────────
    private String pgDegree;
    private String pgBranch;
    private String pgUniversity;
    private Integer pgPassingYear;
    /** Converted percentage used for eligibility checks (always in %) */
    private Double pgPercentage;
    /** Original entered CGPA value (e.g. 8.0) */
    private Double pgCgpa;
    /** "PERCENTAGE" or "CGPA" */
    private String pgScoreType;
    /** CGPA scale: 10 or 4 */
    private Double pgCgpaScale;

    // ── PhD ───────────────────────────────────────────────────────────────────
    @Builder.Default private Boolean phdDone = false;
    private String phdUniversity;
    private String phdSubject;
    private Integer phdYear;

    // ── Qualifying Exam (NET / SET / SLET) ────────────────────────────────────
    @Builder.Default private Boolean netCleared = false;
    @Builder.Default private Boolean setCleared = false;
    @Builder.Default private Boolean sletCleared = false;
    private String netSetSletDetails;   // e.g. "NET June 2018, Subject: CS"

    // ── Experience ────────────────────────────────────────────────────────────
    private Double totalExperienceYears;
    private Double teachingExperienceYears;
    private Double industryExperienceYears;

    // ── Publications ──────────────────────────────────────────────────────────
    @Builder.Default private Integer sciPublications = 0;
    @Builder.Default private Integer scieCitations = 0;
    @Builder.Default private Integer scopusPublications = 0;
    @Builder.Default private Integer ugcCarePublications = 0;
    @Builder.Default private Integer conferencePublications = 0;
    @Builder.Default private Integer localPublications = 0;
    @Builder.Default private Integer booksChapters = 0;

    // ── Misc ──────────────────────────────────────────────────────────────────
    private String currentPost;
    private String additionalInfo;
    private Integer apiScore;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() { updatedAt = LocalDateTime.now(); }
}
