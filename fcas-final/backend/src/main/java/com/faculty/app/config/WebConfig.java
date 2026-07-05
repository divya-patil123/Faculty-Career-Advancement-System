package com.faculty.app.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Serves uploaded files as static resources at /files/**
 * This allows the frontend to load images directly in <img> tags
 * WITHOUT needing a JWT token, while the file endpoint
 * (/api/faculty/documents/{id}/download) remains JWT-protected.
 *
 * Files are served from:  GET /files/{userId}/{filename}
 * e.g. http://localhost:8080/files/3/abc123.jpg
 *
 * The frontend fetches the signed URL from the API, then uses it in <img src=...>
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir}") private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve absolute path so Spring can serve files from anywhere
        String absoluteUploadPath = Paths.get(uploadDir).toAbsolutePath().normalize().toString();

        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:" + absoluteUploadPath + "/");
    }
}
