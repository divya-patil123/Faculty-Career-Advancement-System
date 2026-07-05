package com.faculty.app.service;

import com.faculty.app.entity.EligibilityCriteria;
import com.faculty.app.entity.FacultyProfile;
import com.faculty.app.repository.EligibilityCriteriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Fully dynamic eligibility engine.
 * Zero hardcoded values — every rule loaded from DB.
 */
@Component
public class EligibilityEngine {

    @Autowired
    private EligibilityCriteriaRepository criteriaRepo;

    public record EligibilityResult(
            boolean eligible,
            List<String> metCriteria,
            List<String> unmetCriteria,
            int apiScore
    ) {}

    public EligibilityResult check(FacultyProfile p, String postName) {
        EligibilityCriteria c = criteriaRepo.findByPostNameAndActiveTrue(postName)
                .orElseThrow(() -> new RuntimeException(
                        "No active eligibility criteria found for \"" + postName +
                        "\". Please ask admin to configure criteria."));

        List<String> met = new ArrayList<>();
        List<String> unmet = new ArrayList<>();

        // 1. PG Degree presence
        if (p.getPgDegree() != null && !p.getPgDegree().isBlank()) {
            met.add("PG degree present: " + p.getPgDegree()
                    + (p.getPgBranch() != null ? " (" + p.getPgBranch() + ")" : ""));
        } else {
            unmet.add("PG degree is required but not entered in your profile.");
        }

        // 2. PG Percentage
        double pgPct = p.getPgPercentage() != null ? p.getPgPercentage() : 0.0;
        if (pgPct >= c.getMinPgPercentage()) {
            met.add("PG percentage " + pgPct + "% meets the required minimum of " + c.getMinPgPercentage() + "%.");
        } else {
            unmet.add("PG percentage " + pgPct + "% is below the required " + c.getMinPgPercentage() + "%.");
        }

        // 3. NET / SET / SLET
        checkQualifyingExam(p, c, met, unmet);

        // 4. PhD
        boolean hasPHD = Boolean.TRUE.equals(p.getPhdDone());
        if (c.getPhdRequired()) {
            if (hasPHD) {
                met.add("PhD completed — mandatory for this post. ✅");
            } else {
                unmet.add("PhD is mandatory for " + postName + " but not yet completed.");
            }
        } else {
            met.add(hasPHD
                    ? "PhD completed — not mandatory but earns +" + c.getPhdBonus() + " API bonus points."
                    : "PhD not required for this post.");
        }

        // 5. Teaching Experience
        double teach = p.getTeachingExperienceYears() != null ? p.getTeachingExperienceYears() : 0.0;
        if (c.getMinTeachingExperienceYears() > 0) {
            if (teach >= c.getMinTeachingExperienceYears()) {
                met.add("Teaching experience " + teach + " yrs meets required " + c.getMinTeachingExperienceYears() + " yrs.");
            } else {
                unmet.add("Teaching experience " + teach + " yrs is below required " + c.getMinTeachingExperienceYears() + " yrs.");
            }
        } else {
            met.add("No minimum teaching experience required for this post.");
        }

        // 6. Total Experience
        double total = p.getTotalExperienceYears() != null ? p.getTotalExperienceYears() : 0.0;
        if (c.getMinTotalExperienceYears() > 0) {
            if (total >= c.getMinTotalExperienceYears()) {
                met.add("Total experience " + total + " yrs meets required " + c.getMinTotalExperienceYears() + " yrs.");
            } else {
                unmet.add("Total experience " + total + " yrs is below required " + c.getMinTotalExperienceYears() + " yrs.");
            }
        }

        // 7. Individual publication minimums
        checkPub(safe(p.getSciPublications()),        c.getMinSciPublications(),        "SCI/SCIE publications",  met, unmet);
        checkPub(safe(p.getScopusPublications()),      c.getMinScopusPublications(),      "Scopus publications",    met, unmet);
        checkPub(safe(p.getUgcCarePublications()),     c.getMinUgcCarePublications(),     "UGC Care publications",  met, unmet);
        checkPub(safe(p.getConferencePublications()),  c.getMinConferencePublications(),  "conference papers",      met, unmet);
        checkPub(safe(p.getLocalPublications()),       c.getMinLocalPublications(),       "local publications",     met, unmet);

        int totalIndexed = safe(p.getSciPublications()) + safe(p.getScopusPublications()) + safe(p.getUgcCarePublications());
        if (c.getMinTotalIndexedPublications() > 0) {
            if (totalIndexed >= c.getMinTotalIndexedPublications()) {
                met.add("Total indexed publications " + totalIndexed
                        + " meets required " + c.getMinTotalIndexedPublications() + " (SCI+Scopus+UGC combined).");
            } else {
                unmet.add("Total indexed publications " + totalIndexed
                        + " is below required " + c.getMinTotalIndexedPublications() + " (SCI+Scopus+UGC combined).");
            }
        }

        // 8. API Score
        int apiScore = calculateApiScore(p, c);
        if (c.getMinApiScore() > 0) {
            if (apiScore >= c.getMinApiScore()) {
                met.add("API score " + apiScore + " meets required minimum of " + c.getMinApiScore() + ".");
            } else {
                unmet.add("API score " + apiScore + " is below required minimum of " + c.getMinApiScore() + ".");
            }
        } else {
            met.add("No minimum API score required. Your current score: " + apiScore + ".");
        }

        return new EligibilityResult(unmet.isEmpty(), met, unmet, apiScore);
    }

    /**
     * NET / SET / SLET check logic.
     *   NONE     → skip entirely
     *   REQUIRED → must have at least one accepted exam
     *   OR_PHD   → must have PhD OR at least one accepted exam
     */
    private void checkQualifyingExam(FacultyProfile p, EligibilityCriteria c,
                                     List<String> met, List<String> unmet) {
        String req = c.getNetSetSletRequirement();
        if ("NONE".equals(req)) {
            met.add("No qualifying exam (NET/SET/SLET) required for this post.");
            return;
        }

        // Build list of accepted + cleared exams
        List<String> accepted  = new ArrayList<>();
        List<String> cleared   = new ArrayList<>();

        if (Boolean.TRUE.equals(c.getNetAccepted()))  accepted.add("NET");
        if (Boolean.TRUE.equals(c.getSetAccepted()))  accepted.add("SET");
        if (Boolean.TRUE.equals(c.getSletAccepted())) accepted.add("SLET");

        if (Boolean.TRUE.equals(p.getNetCleared())  && Boolean.TRUE.equals(c.getNetAccepted()))  cleared.add("NET");
        if (Boolean.TRUE.equals(p.getSetCleared())  && Boolean.TRUE.equals(c.getSetAccepted()))  cleared.add("SET");
        if (Boolean.TRUE.equals(p.getSletCleared()) && Boolean.TRUE.equals(c.getSletAccepted())) cleared.add("SLET");

        boolean hasQualifyingExam = !cleared.isEmpty();
        boolean hasPHD = Boolean.TRUE.equals(p.getPhdDone());

        String acceptedStr = String.join(" / ", accepted);

        if ("REQUIRED".equals(req)) {
            if (hasQualifyingExam) {
                met.add("Qualifying exam cleared: " + String.join(", ", cleared)
                        + ". Accepted exams: " + acceptedStr + ".");
            } else {
                unmet.add("Qualifying exam (" + acceptedStr + ") is mandatory for this post but none has been cleared.");
            }

        } else if ("OR_PHD".equals(req)) {
            if (hasQualifyingExam && hasPHD) {
                met.add("Qualifying exam cleared (" + String.join(", ", cleared) + ") AND PhD completed. ✅");
            } else if (hasQualifyingExam) {
                met.add("Qualifying exam cleared: " + String.join(", ", cleared)
                        + " — satisfies the " + acceptedStr + "/PhD requirement.");
            } else if (hasPHD) {
                met.add("PhD completed — satisfies the " + acceptedStr + "/PhD requirement (PhD exempts " + acceptedStr + ").");
            } else {
                unmet.add("This post requires either PhD OR a qualifying exam ("
                        + acceptedStr + "). Neither condition is met.");
            }

            // Bonus for clearing exam even if PhD held
            if (c.getNetSetSletBonus() > 0 && hasQualifyingExam) {
                met.add("Qualifying exam bonus: +" + c.getNetSetSletBonus() + " API points.");
            }
        }
    }

    /** Calculate API score using weights from DB criteria row */
    public int calculateApiScore(FacultyProfile p, EligibilityCriteria c) {
        int score = 0;

        double teach = p.getTeachingExperienceYears() != null ? p.getTeachingExperienceYears() : 0;
        score += (int) Math.min(teach * c.getWeightTeachingExperiencePerYear(), c.getMaxTeachingExperiencePoints());

        score += safe(p.getSciPublications())        * c.getWeightSciPublication();
        score += safe(p.getScieCitations())          * c.getWeightScieCitation();
        score += safe(p.getScopusPublications())     * c.getWeightScopusPublication();
        score += safe(p.getUgcCarePublications())    * c.getWeightUgcCarePublication();
        score += safe(p.getConferencePublications()) * c.getWeightConferencePublication();
        score += safe(p.getLocalPublications())      * c.getWeightLocalPublication();
        score += safe(p.getBooksChapters())          * c.getWeightBookChapter();

        if (Boolean.TRUE.equals(p.getPhdDone())) score += c.getPhdBonus();

        // NET/SET/SLET bonus
        boolean hasExam = Boolean.TRUE.equals(p.getNetCleared())
                || Boolean.TRUE.equals(p.getSetCleared())
                || Boolean.TRUE.equals(p.getSletCleared());
        if (hasExam && c.getNetSetSletBonus() > 0) score += c.getNetSetSletBonus();

        double pgPct = p.getPgPercentage() != null ? p.getPgPercentage() : 0;
        if (pgPct >= c.getPgBonusThreshold1()) score += c.getPgBonus1();
        else if (pgPct >= c.getPgBonusThreshold2()) score += c.getPgBonus2();

        return score;
    }

    public int calculateApiScoreForPost(FacultyProfile p, String postName) {
        return criteriaRepo.findByPostNameAndActiveTrue(postName)
                .map(c -> calculateApiScore(p, c)).orElse(0);
    }

    private void checkPub(int actual, int required, String label, List<String> met, List<String> unmet) {
        if (required <= 0) return;
        if (actual >= required)
            met.add(actual + " " + label + " — meets required minimum of " + required + ".");
        else
            unmet.add("Only " + actual + " " + label + ". Minimum " + required + " required.");
    }

    private int safe(Integer v) { return v != null ? v : 0; }
}
