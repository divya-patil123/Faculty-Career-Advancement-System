package com.faculty.app.dto;

import com.faculty.app.entity.*;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

public class AppDto {

    // ── Auth ─────────────────────────────────────────────────────────────────────
    @Data public static class RegisterRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank @Size(min = 6) private String password;
        private String employeeId;
        private String department;
        private String designation;
        private String phone;
    }

    @Data public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }

    @Data public static class AuthResponse {
        private String token;
        private Long id;
        private String name;
        private String email;
        private String role;
        private String employeeId;
        private String department;
        private String designation;

        public static AuthResponse from(User u, String token) {
            AuthResponse r = new AuthResponse();
            r.token = token; r.id = u.getId(); r.name = u.getName();
            r.email = u.getEmail(); r.role = u.getRole().name();
            r.employeeId = u.getEmployeeId(); r.department = u.getDepartment();
            r.designation = u.getDesignation();
            return r;
        }
    }

    // ── Profile ──────────────────────────────────────────────────────────────────
    @Data public static class ProfileRequest {
        private String ugDegree, ugBranch, ugUniversity;
        private Integer ugPassingYear;
        private Double ugPercentage;   // always stored in %
        private Double ugCgpa;         // original CGPA value (null if percentage mode)
        private String ugScoreType;    // "PERCENTAGE" or "CGPA"
        private Double ugCgpaScale;    // 10 or 4

        private String pgDegree, pgBranch, pgUniversity;
        private Integer pgPassingYear;
        private Double pgPercentage;   // always stored in %
        private Double pgCgpa;
        private String pgScoreType;
        private Double pgCgpaScale;

        private Boolean phdDone;
        private String phdUniversity, phdSubject;
        private Integer phdYear;
        // NET/SET/SLET
        private Boolean netCleared;
        private Boolean setCleared;
        private Boolean sletCleared;
        private String netSetSletDetails;
        // Experience
        private Double totalExperienceYears;
        private Double teachingExperienceYears;
        private Double industryExperienceYears;
        // Publications
        private Integer sciPublications;
        private Integer scieCitations;
        private Integer scopusPublications;
        private Integer ugcCarePublications;
        private Integer conferencePublications;
        private Integer localPublications;
        private Integer booksChapters;
        private String currentPost;
        private String additionalInfo;
    }

    @Data public static class ProfileResponse {
        private Long id, userId;
        private String userName, userEmail, userDepartment;
        private String ugDegree, ugBranch, ugUniversity;
        private Integer ugPassingYear;
        private Double ugPercentage;
        private Double ugCgpa;
        private String ugScoreType;
        private Double ugCgpaScale;

        private String pgDegree, pgBranch, pgUniversity;
        private Integer pgPassingYear;
        private Double pgPercentage;
        private Double pgCgpa;
        private String pgScoreType;
        private Double pgCgpaScale;

        private Boolean phdDone;
        private String phdUniversity, phdSubject;
        private Integer phdYear;
        private Boolean netCleared, setCleared, sletCleared;
        private String netSetSletDetails;
        private Double totalExperienceYears, teachingExperienceYears, industryExperienceYears;
        private Integer sciPublications, scieCitations, scopusPublications;
        private Integer ugcCarePublications, conferencePublications, localPublications, booksChapters;
        private String currentPost, additionalInfo;
        private Integer apiScore;
        private LocalDateTime updatedAt;

        public static ProfileResponse from(FacultyProfile p) {
            ProfileResponse r = new ProfileResponse();
            r.id = p.getId(); r.userId = p.getUser().getId();
            r.userName = p.getUser().getName(); r.userEmail = p.getUser().getEmail();
            r.userDepartment = p.getUser().getDepartment();
            r.ugDegree = p.getUgDegree(); r.ugBranch = p.getUgBranch();
            r.ugUniversity = p.getUgUniversity(); r.ugPassingYear = p.getUgPassingYear();
            r.ugPercentage = p.getUgPercentage();
            r.ugCgpa = p.getUgCgpa(); r.ugScoreType = p.getUgScoreType(); r.ugCgpaScale = p.getUgCgpaScale();

            r.pgDegree = p.getPgDegree(); r.pgBranch = p.getPgBranch();
            r.pgUniversity = p.getPgUniversity(); r.pgPassingYear = p.getPgPassingYear();
            r.pgPercentage = p.getPgPercentage();
            r.pgCgpa = p.getPgCgpa(); r.pgScoreType = p.getPgScoreType(); r.pgCgpaScale = p.getPgCgpaScale();

            r.phdDone = p.getPhdDone(); r.phdUniversity = p.getPhdUniversity();
            r.phdSubject = p.getPhdSubject(); r.phdYear = p.getPhdYear();
            r.netCleared = p.getNetCleared(); r.setCleared = p.getSetCleared();
            r.sletCleared = p.getSletCleared(); r.netSetSletDetails = p.getNetSetSletDetails();
            r.totalExperienceYears = p.getTotalExperienceYears();
            r.teachingExperienceYears = p.getTeachingExperienceYears();
            r.industryExperienceYears = p.getIndustryExperienceYears();
            r.sciPublications = p.getSciPublications(); r.scieCitations = p.getScieCitations();
            r.scopusPublications = p.getScopusPublications();
            r.ugcCarePublications = p.getUgcCarePublications();
            r.conferencePublications = p.getConferencePublications();
            r.localPublications = p.getLocalPublications();
            r.booksChapters = p.getBooksChapters();
            r.currentPost = p.getCurrentPost(); r.additionalInfo = p.getAdditionalInfo();
            r.apiScore = p.getApiScore(); r.updatedAt = p.getUpdatedAt();
            return r;
        }
    }

    // ── Application ──────────────────────────────────────────────────────────────
    @Data public static class ApplicationRequest {
        @NotBlank private String applyingForPost;
    }

    @Data public static class ApplicationResponse {
        private Long id, userId;
        private String userName, userEmail, userDepartment;
        private String applyingForPost, currentPost;
        private Boolean eligible;
        private String eligibilityRemarks;
        private String status, adminRemarks;
        private LocalDateTime submittedAt, reviewedAt;
        private Integer calculatedApiScore;
        private Integer criteriaVersion;
        private List<DocumentResponse> documents;

        public static ApplicationResponse from(Application a) {
            ApplicationResponse r = new ApplicationResponse();
            r.id = a.getId(); r.userId = a.getUser().getId();
            r.userName = a.getUser().getName(); r.userEmail = a.getUser().getEmail();
            r.userDepartment = a.getUser().getDepartment();
            r.applyingForPost = a.getApplyingForPost(); r.currentPost = a.getCurrentPost();
            r.eligible = a.getEligible(); r.eligibilityRemarks = a.getEligibilityRemarks();
            r.status = a.getStatus().name(); r.adminRemarks = a.getAdminRemarks();
            r.submittedAt = a.getSubmittedAt(); r.reviewedAt = a.getReviewedAt();
            r.calculatedApiScore = a.getCalculatedApiScore();
            r.criteriaVersion = a.getCriteriaVersion();
            return r;
        }
    }

    @Data public static class ReviewRequest {
        @NotBlank private String status;
        private String adminRemarks;
    }

    // ── Document ─────────────────────────────────────────────────────────────────
    @Data public static class DocumentResponse {
        private Long id;
        private String documentType, originalFileName, contentType;
        private Long fileSize;
        private LocalDateTime uploadedAt;

        /**
         * Public URL to view/display the file directly in the browser.
         * For images: use as <img src={fileUrl} />
         * For PDFs:   open in new tab.
         * Pattern: http://localhost:8080/files/{userId}/{storedFileName}
         * No JWT needed — served as static resource via WebConfig.
         */
        private String fileUrl;

        /** True when the file is an image (jpg/png/gif/webp) — used by frontend to show preview */
        private Boolean isImage;

        public static DocumentResponse from(Document d) {
            DocumentResponse r = new DocumentResponse();
            r.id = d.getId();
            r.documentType = d.getDocumentType();
            r.originalFileName = d.getOriginalFileName();
            r.contentType = d.getContentType();
            r.fileSize = d.getFileSize();
            r.uploadedAt = d.getUploadedAt();

            // Build public static URL from relative path
            if (d.getRelativePath() != null && !d.getRelativePath().isBlank()) {
                r.fileUrl = "http://localhost:8080/files/" + d.getRelativePath();
            }

            // Mark images so frontend can render <img> instead of a download link
            String ct = d.getContentType() != null ? d.getContentType().toLowerCase() : "";
            r.isImage = ct.contains("image/");

            return r;
        }
    }

    // ── Admin ────────────────────────────────────────────────────────────────────
    @Data public static class CreateAdminRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank @Size(min = 6) private String password;
        private String employeeId, department;
    }

    @Data public static class UserResponse {
        private Long id;
        private String name, email, employeeId, department, designation, role;
        private boolean active;
        private LocalDateTime createdAt;

        public static UserResponse from(User u) {
            UserResponse r = new UserResponse();
            r.id = u.getId(); r.name = u.getName(); r.email = u.getEmail();
            r.employeeId = u.getEmployeeId(); r.department = u.getDepartment();
            r.designation = u.getDesignation(); r.role = u.getRole().name();
            r.active = u.isActive(); r.createdAt = u.getCreatedAt();
            return r;
        }
    }

    @Data public static class DashboardStats {
        private long totalFaculty, totalApplications;
        private long pendingApplications, approvedApplications, rejectedApplications;
        private long eligibleApplications, ineligibleApplications;
    }

    @Data @lombok.AllArgsConstructor
    public static class EligibilityCheckResponse {
        private boolean eligible;
        private List<String> metCriteria;
        private List<String> unmetCriteria;
        private int apiScore;
        private int criteriaVersion;
    }

    @Data @lombok.AllArgsConstructor
    public static class MessageResponse { private String message; }
}
