package com.faculty.app.dto;

import com.faculty.app.entity.EligibilityCriteria;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

public class CriteriaDto {

    @Data
    public static class SaveRequest {
        @NotBlank private String postName;

        // Qualifying Exam
        @NotNull private String netSetSletRequirement; // NONE | REQUIRED | OR_PHD
        @NotNull private Boolean netAccepted;
        @NotNull private Boolean setAccepted;
        @NotNull private Boolean sletAccepted;

        // Education
        @NotNull private Double minPgPercentage;
        @NotNull private Boolean phdRequired;

        // Experience
        @NotNull private Double minTeachingExperienceYears;
        @NotNull private Double minTotalExperienceYears;

        // API
        @NotNull private Integer minApiScore;

        // Publications
        @NotNull private Integer minSciPublications;
        @NotNull private Integer minScopusPublications;
        @NotNull private Integer minUgcCarePublications;
        @NotNull private Integer minConferencePublications;
        @NotNull private Integer minLocalPublications;
        @NotNull private Integer minTotalIndexedPublications;

        // Weights
        @NotNull private Integer weightSciPublication;
        @NotNull private Integer weightScieCitation;
        @NotNull private Integer weightScopusPublication;
        @NotNull private Integer weightUgcCarePublication;
        @NotNull private Integer weightConferencePublication;
        @NotNull private Integer weightLocalPublication;
        @NotNull private Integer weightBookChapter;
        @NotNull private Integer weightTeachingExperiencePerYear;
        @NotNull private Integer maxTeachingExperiencePoints;

        // Bonuses
        @NotNull private Integer phdBonus;
        @NotNull private Integer netSetSletBonus;
        @NotNull private Double pgBonusThreshold1;
        @NotNull private Integer pgBonus1;
        @NotNull private Double pgBonusThreshold2;
        @NotNull private Integer pgBonus2;

        private String changeNote;
    }

    @Data
    public static class CriteriaResponse {
        private Long id;
        private String postName;
        private String netSetSletRequirement;
        private Boolean netAccepted;
        private Boolean setAccepted;
        private Boolean sletAccepted;
        private Double minPgPercentage;
        private Boolean phdRequired;
        private Double minTeachingExperienceYears;
        private Double minTotalExperienceYears;
        private Integer minApiScore;
        private Integer minSciPublications;
        private Integer minScopusPublications;
        private Integer minUgcCarePublications;
        private Integer minConferencePublications;
        private Integer minLocalPublications;
        private Integer minTotalIndexedPublications;
        private Integer weightSciPublication;
        private Integer weightScieCitation;
        private Integer weightScopusPublication;
        private Integer weightUgcCarePublication;
        private Integer weightConferencePublication;
        private Integer weightLocalPublication;
        private Integer weightBookChapter;
        private Integer weightTeachingExperiencePerYear;
        private Integer maxTeachingExperiencePoints;
        private Integer phdBonus;
        private Integer netSetSletBonus;
        private Double pgBonusThreshold1;
        private Integer pgBonus1;
        private Double pgBonusThreshold2;
        private Integer pgBonus2;
        private Integer version;
        private Boolean active;
        private String changeNote;
        private String createdBy;
        private LocalDateTime createdAt;
        private LocalDateTime activatedAt;

        public static CriteriaResponse from(EligibilityCriteria c) {
            CriteriaResponse r = new CriteriaResponse();
            r.id = c.getId(); r.postName = c.getPostName();
            r.netSetSletRequirement = c.getNetSetSletRequirement();
            r.netAccepted = c.getNetAccepted(); r.setAccepted = c.getSetAccepted(); r.sletAccepted = c.getSletAccepted();
            r.minPgPercentage = c.getMinPgPercentage(); r.phdRequired = c.getPhdRequired();
            r.minTeachingExperienceYears = c.getMinTeachingExperienceYears();
            r.minTotalExperienceYears = c.getMinTotalExperienceYears();
            r.minApiScore = c.getMinApiScore();
            r.minSciPublications = c.getMinSciPublications();
            r.minScopusPublications = c.getMinScopusPublications();
            r.minUgcCarePublications = c.getMinUgcCarePublications();
            r.minConferencePublications = c.getMinConferencePublications();
            r.minLocalPublications = c.getMinLocalPublications();
            r.minTotalIndexedPublications = c.getMinTotalIndexedPublications();
            r.weightSciPublication = c.getWeightSciPublication();
            r.weightScieCitation = c.getWeightScieCitation();
            r.weightScopusPublication = c.getWeightScopusPublication();
            r.weightUgcCarePublication = c.getWeightUgcCarePublication();
            r.weightConferencePublication = c.getWeightConferencePublication();
            r.weightLocalPublication = c.getWeightLocalPublication();
            r.weightBookChapter = c.getWeightBookChapter();
            r.weightTeachingExperiencePerYear = c.getWeightTeachingExperiencePerYear();
            r.maxTeachingExperiencePoints = c.getMaxTeachingExperiencePoints();
            r.phdBonus = c.getPhdBonus(); r.netSetSletBonus = c.getNetSetSletBonus();
            r.pgBonusThreshold1 = c.getPgBonusThreshold1(); r.pgBonus1 = c.getPgBonus1();
            r.pgBonusThreshold2 = c.getPgBonusThreshold2(); r.pgBonus2 = c.getPgBonus2();
            r.version = c.getVersion(); r.active = c.getActive();
            r.changeNote = c.getChangeNote(); r.createdBy = c.getCreatedBy();
            r.createdAt = c.getCreatedAt(); r.activatedAt = c.getActivatedAt();
            return r;
        }
    }

    @Data
    public static class ImportResult {
        private int imported;
        private int skipped;
        private List<String> errors;
        private List<CriteriaResponse> criteria;
        public ImportResult(int i, int s, List<String> e, List<CriteriaResponse> c) {
            imported=i; skipped=s; errors=e; criteria=c;
        }
    }

    @Data @lombok.AllArgsConstructor
    public static class MessageResponse { private String message; }
}
