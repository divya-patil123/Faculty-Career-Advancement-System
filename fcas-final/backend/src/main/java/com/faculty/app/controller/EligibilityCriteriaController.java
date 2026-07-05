package com.faculty.app.controller;

import com.faculty.app.dto.CriteriaDto;
import com.faculty.app.service.EligibilityCriteriaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/criteria")
@CrossOrigin(origins = "http://localhost:3000")
public class EligibilityCriteriaController {

    @Autowired private EligibilityCriteriaService svc;

    // ── Public read ───────────────────────────────────────────────────────────────
    @GetMapping("/active")
    public ResponseEntity<List<CriteriaDto.CriteriaResponse>> getAllActive() {
        return ResponseEntity.ok(svc.getAllActive());
    }

    @GetMapping("/active/{postName}")
    public ResponseEntity<CriteriaDto.CriteriaResponse> getActiveForPost(@PathVariable String postName) {
        return ResponseEntity.ok(svc.getActiveForPost(postName));
    }

    // ── Admin management ──────────────────────────────────────────────────────────
    @GetMapping("/history/{postName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CriteriaDto.CriteriaResponse>> getHistory(@PathVariable String postName) {
        return ResponseEntity.ok(svc.getHistory(postName));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CriteriaDto.CriteriaResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(svc.getById(id));
    }

    @PostMapping("/save")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CriteriaDto.CriteriaResponse> save(
            @Valid @RequestBody CriteriaDto.SaveRequest req, Authentication auth) {
        return ResponseEntity.ok(svc.save(req, auth.getName()));
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CriteriaDto.CriteriaResponse> activate(
            @PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(svc.activateVersion(id, auth.getName()));
    }

    @PostMapping("/import/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CriteriaDto.ImportResult> importExcel(
            @RequestParam("file") MultipartFile file, Authentication auth) throws Exception {
        return ResponseEntity.ok(svc.importFromExcel(file, auth.getName()));
    }

    @GetMapping("/template/excel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> downloadTemplate() throws Exception {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"eligibility_criteria_template.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(svc.generateTemplate());
    }
}
