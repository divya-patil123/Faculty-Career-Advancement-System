package com.faculty.app.service;

import com.faculty.app.dto.AppDto;
import com.faculty.app.entity.*;
import com.faculty.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired private UserRepository userRepo;
    @Autowired private ApplicationRepository appRepo;
    @Autowired private DocumentRepository docRepo;
    @Autowired private FacultyProfileRepository profileRepo;
    @Autowired private PasswordEncoder encoder;

    public AppDto.DashboardStats getDashboardStats() {
        AppDto.DashboardStats s = new AppDto.DashboardStats();
        s.setTotalFaculty(userRepo.countByRole(User.Role.ROLE_FACULTY));
        s.setTotalApplications(appRepo.count());
        s.setPendingApplications(appRepo.countByStatus(Application.Status.PENDING));
        s.setApprovedApplications(appRepo.countByStatus(Application.Status.APPROVED));
        s.setRejectedApplications(appRepo.countByStatus(Application.Status.REJECTED));
        s.setEligibleApplications(appRepo.countEligible());
        s.setIneligibleApplications(appRepo.countIneligible());
        return s;
    }

    public List<AppDto.ApplicationResponse> getAllApplications() {
        return appRepo.findAllByOrderBySubmittedAtDesc().stream().map(a -> {
            AppDto.ApplicationResponse r = AppDto.ApplicationResponse.from(a);
            // Documents are uploaded per-user, not per-application — fetch by userId
            r.setDocuments(docRepo.findByUserId(a.getUser().getId()).stream()
                    .map(AppDto.DocumentResponse::from).collect(Collectors.toList()));
            return r;
        }).collect(Collectors.toList());
    }

    public List<AppDto.ApplicationResponse> getApplicationsByStatus(String status) {
        return appRepo.findByStatusOrderBySubmittedAtDesc(Application.Status.valueOf(status.toUpperCase()))
                .stream().map(AppDto.ApplicationResponse::from).collect(Collectors.toList());
    }

    public AppDto.ApplicationResponse getApplicationById(Long id) {
        Application app = appRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found."));
        AppDto.ApplicationResponse r = AppDto.ApplicationResponse.from(app);
        // Fetch ALL documents belonging to this faculty member (not just application-linked ones)
        r.setDocuments(docRepo.findByUserId(app.getUser().getId()).stream()
                .map(AppDto.DocumentResponse::from).collect(Collectors.toList()));
        return r;
    }

    @Transactional
    public AppDto.ApplicationResponse reviewApplication(Long id, AppDto.ReviewRequest req, User admin) {
        Application app = appRepo.findById(id).orElseThrow(() -> new RuntimeException("Application not found."));
        app.setStatus(Application.Status.valueOf(req.getStatus().toUpperCase()));
        app.setAdminRemarks(req.getAdminRemarks());
        app.setReviewedBy(admin.getId());
        app.setReviewedAt(LocalDateTime.now());
        Application saved = appRepo.save(app);
        AppDto.ApplicationResponse r = AppDto.ApplicationResponse.from(saved);
        // Fetch ALL documents belonging to this faculty member
        r.setDocuments(docRepo.findByUserId(saved.getUser().getId()).stream()
                .map(AppDto.DocumentResponse::from).collect(Collectors.toList()));
        return r;
    }

    public List<AppDto.UserResponse> getAllFaculty() {
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ROLE_FACULTY)
                .map(AppDto.UserResponse::from).collect(Collectors.toList());
    }

    public List<AppDto.UserResponse> getAllAdmins() {
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() == User.Role.ROLE_ADMIN)
                .map(AppDto.UserResponse::from).collect(Collectors.toList());
    }

    public AppDto.MessageResponse createAdmin(AppDto.CreateAdminRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new RuntimeException("Email already in use.");
        User admin = User.builder()
                .name(req.getName()).email(req.getEmail())
                .password(encoder.encode(req.getPassword()))
                .employeeId(req.getEmployeeId()).department(req.getDepartment())
                .role(User.Role.ROLE_ADMIN).active(true).build();
        userRepo.save(admin);
        return new AppDto.MessageResponse("Admin user created successfully.");
    }

    public AppDto.MessageResponse toggleUserStatus(Long userId) {
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found."));
        user.setActive(!user.isActive());
        userRepo.save(user);
        return new AppDto.MessageResponse("Status updated: " + (user.isActive() ? "Active" : "Inactive"));
    }

    public AppDto.ProfileResponse getFacultyProfile(Long userId) {
        FacultyProfile p = profileRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found for user " + userId));
        return AppDto.ProfileResponse.from(p);
    }
}
