package com.faculty.app.repository;
import com.faculty.app.entity.Application;
import com.faculty.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByUserOrderBySubmittedAtDesc(User user);
    List<Application> findByStatusOrderBySubmittedAtDesc(Application.Status status);
    List<Application> findAllByOrderBySubmittedAtDesc();
    long countByStatus(Application.Status status);
    @Query("SELECT COUNT(a) FROM Application a WHERE a.eligible = true") long countEligible();
    @Query("SELECT COUNT(a) FROM Application a WHERE a.eligible = false") long countIneligible();
}
