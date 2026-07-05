package com.faculty.app.controller;

import com.faculty.app.dto.AppDto;
import com.faculty.app.entity.User;
import com.faculty.app.service.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:3000")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired private AdminService adminService;
    @Autowired private AuthService authService;
    @Autowired private DocumentService documentService;

    @GetMapping("/dashboard")
    public ResponseEntity<AppDto.DashboardStats> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/applications")
    public ResponseEntity<List<AppDto.ApplicationResponse>> getApplications(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank())
            return ResponseEntity.ok(adminService.getApplicationsByStatus(status));
        return ResponseEntity.ok(adminService.getAllApplications());
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<AppDto.ApplicationResponse> getApplication(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getApplicationById(id));
    }

    @PatchMapping("/applications/{id}/review")
    public ResponseEntity<AppDto.ApplicationResponse> review(
            @PathVariable Long id, @Valid @RequestBody AppDto.ReviewRequest req) {
        return ResponseEntity.ok(adminService.reviewApplication(id, req, authService.getCurrentUser()));
    }

    @GetMapping("/faculty")
    public ResponseEntity<List<AppDto.UserResponse>> getAllFaculty() {
        return ResponseEntity.ok(adminService.getAllFaculty());
    }

    @GetMapping("/faculty/{userId}/profile")
    public ResponseEntity<AppDto.ProfileResponse> getFacultyProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(adminService.getFacultyProfile(userId));
    }

    @PatchMapping("/faculty/{id}/toggle")
    public ResponseEntity<AppDto.MessageResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserStatus(id));
    }

    @PostMapping("/create-admin")
    public ResponseEntity<AppDto.MessageResponse> createAdmin(@Valid @RequestBody AppDto.CreateAdminRequest req) {
        return ResponseEntity.ok(adminService.createAdmin(req));
    }

    @GetMapping("/admins")
    public ResponseEntity<List<AppDto.UserResponse>> getAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> downloadDoc(@PathVariable Long id) throws Exception {
        User admin = authService.getCurrentUser();
        DocumentService.FileResult result = documentService.loadFileWithMeta(id, admin);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + result.originalFileName() + "\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition")
                .body(result.resource());
    }

    private String determineContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf"))  return "application/pdf";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }
}
