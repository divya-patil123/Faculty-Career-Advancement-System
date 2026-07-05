package com.faculty.app.service;

import com.faculty.app.dto.AppDto;
import com.faculty.app.entity.*;
import com.faculty.app.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    @Value("${app.upload.dir}") private String uploadDir;
    @Autowired private DocumentRepository docRepo;
    @Autowired private ApplicationRepository appRepo;

    /**
     * Holds the file resource, the original filename, and the stored content type.
     * Used by controllers to build a correct HTTP response.
     */
    public record FileResult(Resource resource, String contentType, String originalFileName) {}

    // ── Upload ────────────────────────────────────────────────────────────────

    public AppDto.DocumentResponse upload(User user, MultipartFile file,
                                          String documentType, Long applicationId) throws IOException {

        String ct = file.getContentType();
        if (ct == null || (!ct.startsWith("image/") && !ct.equals("application/pdf")))
            throw new RuntimeException("Only PDF and image files (JPG, PNG, GIF, WEBP) are allowed.");
        if (file.getSize() > 10 * 1024 * 1024)
            throw new RuntimeException("File size must be under 10 MB.");

        // Create per-user subdirectory: {uploadDir}/{userId}/
        Path baseDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path userDir = baseDir.resolve(String.valueOf(user.getId()));
        if (!Files.exists(userDir)) Files.createDirectories(userDir);

        // Preserve extension, generate unique stored name
        String orig   = StringUtils.cleanPath(file.getOriginalFilename());
        String ext    = orig.contains(".") ? orig.substring(orig.lastIndexOf('.')) : "";
        String stored = UUID.randomUUID() + ext;

        Path dest = userDir.resolve(stored);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        // relativePath = "{userId}/{storedFilename}"
        // Used to build: http://localhost:8080/files/{relativePath}
        String relativePath = user.getId() + "/" + stored;

        Application application = null;
        if (applicationId != null) application = appRepo.findById(applicationId).orElse(null);

        Document doc = Document.builder()
                .user(user)
                .application(application)
                .documentType(documentType)
                .originalFileName(orig)
                .storedFileName(stored)
                .filePath(dest.toString())         // absolute — for secure API download
                .relativePath(relativePath)         // relative — for /files/** static serving
                .contentType(ct)
                .fileSize(file.getSize())
                .build();

        return AppDto.DocumentResponse.from(docRepo.save(doc));
    }

    // ── Secure download (JWT protected) ───────────────────────────────────────

    /**
     * Returns the file resource AND the stored metadata needed to
     * build a correct HTTP response (content type, original filename).
     * Used by faculty and admin download endpoints.
     */
    public FileResult loadFileWithMeta(Long docId, User requestingUser) throws MalformedURLException {
        Document doc = docRepo.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found."));

        // Only the owner or an admin can download
        boolean isOwner = doc.getUser().getId().equals(requestingUser.getId());
        boolean isAdmin = requestingUser.getRole() == User.Role.ROLE_ADMIN;
        if (!isOwner && !isAdmin)
            throw new RuntimeException("Access denied.");

        Path filePath = Paths.get(doc.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists() || !resource.isReadable())
            throw new RuntimeException("File not found or unreadable on server.");

        // Use the stored content type (most accurate); fall back to extension detection
        String ct = (doc.getContentType() != null && !doc.getContentType().isBlank())
                ? doc.getContentType()
                : guessContentType(doc.getStoredFileName());

        return new FileResult(resource, ct, doc.getOriginalFileName());
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public AppDto.MessageResponse delete(Long docId, User user) {
        Document doc = docRepo.findById(docId)
                .orElseThrow(() -> new RuntimeException("Document not found."));
        if (!doc.getUser().getId().equals(user.getId()))
            throw new RuntimeException("Access denied.");
        try { Files.deleteIfExists(Paths.get(doc.getFilePath())); } catch (IOException ignored) {}
        docRepo.delete(doc);
        return new AppDto.MessageResponse("Document deleted successfully.");
    }

    // ── List ──────────────────────────────────────────────────────────────────

    public List<AppDto.DocumentResponse> getUserDocuments(User user) {
        return docRepo.findByUserId(user.getId()).stream()
                .map(AppDto.DocumentResponse::from)
                .collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String guessContentType(String filename) {
        if (filename == null) return "application/octet-stream";
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf"))              return "application/pdf";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png"))              return "image/png";
        if (lower.endsWith(".gif"))              return "image/gif";
        if (lower.endsWith(".webp"))             return "image/webp";
        return "application/octet-stream";
    }
}
