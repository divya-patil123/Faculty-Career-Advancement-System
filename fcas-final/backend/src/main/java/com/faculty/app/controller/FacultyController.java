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
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "http://localhost:3000")
@PreAuthorize("hasAnyRole('FACULTY','ADMIN')")
public class FacultyController {

    @Autowired private FacultyService facultyService;
    @Autowired private DocumentService documentService;
    @Autowired private AuthService authService;

    @GetMapping("/profile/exists")
    public ResponseEntity<Map<String, Boolean>> profileExists() {
        return ResponseEntity.ok(Map.of("exists", facultyService.hasProfile(authService.getCurrentUser())));
    }

    @GetMapping("/profile")
    public ResponseEntity<AppDto.ProfileResponse> getProfile() {
        return ResponseEntity.ok(facultyService.getProfile(authService.getCurrentUser()));
    }

    @PostMapping("/profile")
    public ResponseEntity<AppDto.ProfileResponse> saveProfile(@RequestBody AppDto.ProfileRequest req) {
        return ResponseEntity.ok(facultyService.saveProfile(authService.getCurrentUser(), req));
    }

    @GetMapping("/eligibility")
    public ResponseEntity<AppDto.EligibilityCheckResponse> checkEligibility(@RequestParam String post) {
        return ResponseEntity.ok(facultyService.checkEligibility(authService.getCurrentUser(), post));
    }

    @PostMapping("/applications")
    public ResponseEntity<AppDto.ApplicationResponse> submitApplication(@Valid @RequestBody AppDto.ApplicationRequest req) {
        return ResponseEntity.ok(facultyService.submitApplication(authService.getCurrentUser(), req));
    }

    @GetMapping("/applications")
    public ResponseEntity<List<AppDto.ApplicationResponse>> getMyApplications() {
        return ResponseEntity.ok(facultyService.getMyApplications(authService.getCurrentUser()));
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<AppDto.ApplicationResponse> getApplication(@PathVariable Long id) {
        return ResponseEntity.ok(facultyService.getApplicationById(authService.getCurrentUser(), id));
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<AppDto.DocumentResponse> upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "applicationId", required = false) Long applicationId) throws IOException {
        return ResponseEntity.ok(documentService.upload(authService.getCurrentUser(), file, documentType, applicationId));
    }

    @GetMapping("/documents")
    public ResponseEntity<List<AppDto.DocumentResponse>> getDocuments() {
        return ResponseEntity.ok(documentService.getUserDocuments(authService.getCurrentUser()));
    }

    @GetMapping("/documents/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws Exception {
        User user = authService.getCurrentUser();
        // loadFileWithMeta returns both the Resource and the stored content-type
        DocumentService.FileResult result = documentService.loadFileWithMeta(id, user);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + result.originalFileName() + "\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, "Content-Disposition")
                .body(result.resource());
    }

    @DeleteMapping("/documents/{id}")
    public ResponseEntity<AppDto.MessageResponse> deleteDoc(@PathVariable Long id) {
        return ResponseEntity.ok(documentService.delete(id, authService.getCurrentUser()));
    }
}
