package com.faculty.app.repository;
import com.faculty.app.entity.FacultyProfile;
import com.faculty.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface FacultyProfileRepository extends JpaRepository<FacultyProfile, Long> {
    Optional<FacultyProfile> findByUser(User user);
    Optional<FacultyProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
