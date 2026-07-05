package com.faculty.app.service;

import com.faculty.app.dto.AppDto;
import com.faculty.app.entity.*;
import com.faculty.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FacultyService {

    @Autowired private FacultyProfileRepository profileRepo;
    @Autowired private ApplicationRepository appRepo;
    @Autowired private DocumentRepository docRepo;
    @Autowired private EligibilityEngine engine;
    @Autowired private EligibilityCriteriaRepository criteriaRepo;

    // ── Profile ──────────────────────────────────────────────────────────────────
    public boolean hasProfile(User user) {
        return profileRepo.existsByUserId(user.getId());
    }

    public AppDto.ProfileResponse getProfile(User user) {
        FacultyProfile p = profileRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Profile not found. Please create your profile first."));
        // Recalculate API score using active criteria for current post (default: Assistant Professor)
        recalcApiScore(p);
        return AppDto.ProfileResponse.from(p);
    }

    @Transactional
    public AppDto.ProfileResponse saveProfile(User user, AppDto.ProfileRequest req) {
        FacultyProfile p = profileRepo.findByUser(user).orElse(new FacultyProfile());
        p.setUser(user);
        // UG — store original value + type + converted percentage
        p.setUgDegree(req.getUgDegree()); p.setUgBranch(req.getUgBranch());
        p.setUgUniversity(req.getUgUniversity()); p.setUgPassingYear(req.getUgPassingYear());
        p.setUgPercentage(req.getUgPercentage());   // already converted by frontend
        p.setUgCgpa(req.getUgCgpa());
        p.setUgScoreType(req.getUgScoreType());
        p.setUgCgpaScale(req.getUgCgpaScale());
        // PG — store original value + type + converted percentage
        p.setPgDegree(req.getPgDegree()); p.setPgBranch(req.getPgBranch());
        p.setPgUniversity(req.getPgUniversity()); p.setPgPassingYear(req.getPgPassingYear());
        p.setPgPercentage(req.getPgPercentage());   // already converted by frontend
        p.setPgCgpa(req.getPgCgpa());
        p.setPgScoreType(req.getPgScoreType());
        p.setPgCgpaScale(req.getPgCgpaScale());
        // PhD
        p.setPhdDone(req.getPhdDone()); p.setPhdUniversity(req.getPhdUniversity());
        p.setPhdSubject(req.getPhdSubject()); p.setPhdYear(req.getPhdYear());
        // NET/SET/SLET
        p.setNetCleared(req.getNetCleared()); p.setSetCleared(req.getSetCleared());
        p.setSletCleared(req.getSletCleared()); p.setNetSetSletDetails(req.getNetSetSletDetails());
        // Experience
        p.setTotalExperienceYears(req.getTotalExperienceYears());
        p.setTeachingExperienceYears(req.getTeachingExperienceYears());
        p.setIndustryExperienceYears(req.getIndustryExperienceYears());
        // Publications
        p.setSciPublications(req.getSciPublications()); p.setScieCitations(req.getScieCitations());
        p.setScopusPublications(req.getScopusPublications());
        p.setUgcCarePublications(req.getUgcCarePublications());
        p.setConferencePublications(req.getConferencePublications());
        p.setLocalPublications(req.getLocalPublications());
        p.setBooksChapters(req.getBooksChapters());
        p.setCurrentPost(req.getCurrentPost()); p.setAdditionalInfo(req.getAdditionalInfo());

        recalcApiScore(p);
        return AppDto.ProfileResponse.from(profileRepo.save(p));
    }

    private void recalcApiScore(FacultyProfile p) {
        // Use "Assistant Professor" criteria as a base for general API score display
        criteriaRepo.findByPostNameAndActiveTrue("Assistant Professor").ifPresent(c -> {
            p.setApiScore(engine.calculateApiScore(p, c));
            profileRepo.save(p);
        });
    }

    // ── Eligibility Check ────────────────────────────────────────────────────────
    public AppDto.EligibilityCheckResponse checkEligibility(User user, String post) {
        FacultyProfile profile = profileRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Please complete your profile before checking eligibility."));

        var result = engine.check(profile, post);

        // Include which criteria version was used
        int ver = criteriaRepo.findByPostNameAndActiveTrue(post)
                .map(EligibilityCriteria::getVersion).orElse(0);

        return new AppDto.EligibilityCheckResponse(
                result.eligible(), result.metCriteria(), result.unmetCriteria(),
                result.apiScore(), ver);
    }

    // ── Applications ─────────────────────────────────────────────────────────────
    @Transactional
    public AppDto.ApplicationResponse submitApplication(User user, AppDto.ApplicationRequest req) {
        FacultyProfile profile = profileRepo.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Please complete your profile before applying."));

        var result = engine.check(profile, req.getApplyingForPost());

        // Get active criteria version
        var criteriaOpt = criteriaRepo.findByPostNameAndActiveTrue(req.getApplyingForPost());
        Long criteriaId = criteriaOpt.map(EligibilityCriteria::getId).orElse(null);
        Integer criteriaVer = criteriaOpt.map(EligibilityCriteria::getVersion).orElse(null);

        // Build eligibility remarks string
        StringBuilder remarks = new StringBuilder();
        remarks.append("Criteria Version: v").append(criteriaVer != null ? criteriaVer : "N/A").append("\n\n");
        if (!result.metCriteria().isEmpty()) {
            remarks.append("✅ MET CRITERIA:\n");
            result.metCriteria().forEach(c -> remarks.append("  • ").append(c).append("\n"));
        }
        if (!result.unmetCriteria().isEmpty()) {
            remarks.append("\n❌ UNMET CRITERIA:\n");
            result.unmetCriteria().forEach(c -> remarks.append("  • ").append(c).append("\n"));
        }

        Application app = Application.builder()
                .user(user)
                .applyingForPost(req.getApplyingForPost())
                .currentPost(profile.getCurrentPost())
                .ugBranch(profile.getUgBranch())
                .pgBranch(profile.getPgBranch())
                .pgPercentage(profile.getPgPercentage())
                .phdDone(profile.getPhdDone())
                .netCleared(profile.getNetCleared())
                .setCleared(profile.getSetCleared())
                .sletCleared(profile.getSletCleared())
                .totalExperienceYears(profile.getTotalExperienceYears())
                .teachingExperienceYears(profile.getTeachingExperienceYears())
                .sciPublications(profile.getSciPublications())
                .scopusPublications(profile.getScopusPublications())
                .ugcCarePublications(profile.getUgcCarePublications())
                .conferencePublications(profile.getConferencePublications())
                .localPublications(profile.getLocalPublications())
                .calculatedApiScore(result.apiScore())
                .criteriaVersionId(criteriaId)
                .criteriaVersion(criteriaVer)
                .eligible(result.eligible())
                .eligibilityRemarks(remarks.toString())
                .status(Application.Status.PENDING)
                .build();

        Application saved = appRepo.save(app);
        AppDto.ApplicationResponse response = AppDto.ApplicationResponse.from(saved);
        response.setDocuments(docRepo.findByUserId(user.getId()).stream()
                .map(AppDto.DocumentResponse::from).collect(Collectors.toList()));
        return response;
    }

    public List<AppDto.ApplicationResponse> getMyApplications(User user) {
        return appRepo.findByUserOrderBySubmittedAtDesc(user).stream().map(a -> {
            AppDto.ApplicationResponse r = AppDto.ApplicationResponse.from(a);
            r.setDocuments(docRepo.findByApplicationId(a.getId()).stream()
                    .map(AppDto.DocumentResponse::from).collect(Collectors.toList()));
            return r;
        }).collect(Collectors.toList());
    }

    public AppDto.ApplicationResponse getApplicationById(User user, Long id) {
        Application app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found."));
        if (!app.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Access denied.");
        AppDto.ApplicationResponse r = AppDto.ApplicationResponse.from(app);
        r.setDocuments(docRepo.findByApplicationId(id).stream()
                .map(AppDto.DocumentResponse::from).collect(Collectors.toList()));
        return r;
    }

    public List<AppDto.DocumentResponse> getMyDocuments(User user) {
        return docRepo.findByUserId(user.getId()).stream()
                .map(AppDto.DocumentResponse::from).collect(Collectors.toList());
    }
}
