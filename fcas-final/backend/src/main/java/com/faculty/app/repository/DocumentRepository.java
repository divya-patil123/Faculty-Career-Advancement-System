package com.faculty.app.repository;
import com.faculty.app.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByUserId(Long userId);
    List<Document> findByApplicationId(Long applicationId);
}
