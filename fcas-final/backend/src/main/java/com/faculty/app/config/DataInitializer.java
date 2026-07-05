package com.faculty.app.config;

import com.faculty.app.entity.User;
import com.faculty.app.repository.UserRepository;
import com.faculty.app.service.EligibilityCriteriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired private UserRepository userRepo;
    @Autowired private PasswordEncoder encoder;
    @Autowired private EligibilityCriteriaService criteriaService;

    @Value("${app.admin.email}") private String adminEmail;
    @Value("${app.admin.password}") private String adminPassword;
    @Value("${app.admin.name}") private String adminName;

    @Override
    public void run(String... args) {
        // Seed default admin
        if (!userRepo.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .name(adminName).email(adminEmail)
                    .password(encoder.encode(adminPassword))
                    .role(User.Role.ROLE_ADMIN)
                    .employeeId("ADMIN001")
                    .department("Administration")
                    .designation("System Administrator")
                    .active(true).build();
            userRepo.save(admin);
            System.out.println("✅ Default admin created: " + adminEmail + " / " + adminPassword);
        }

        // Seed default UGC eligibility criteria for all 4 posts
        criteriaService.seedDefaults();
    }
}
