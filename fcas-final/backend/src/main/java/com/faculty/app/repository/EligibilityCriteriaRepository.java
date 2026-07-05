package com.faculty.app.repository;
import com.faculty.app.entity.EligibilityCriteria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

public interface EligibilityCriteriaRepository extends JpaRepository<EligibilityCriteria, Long> {
    Optional<EligibilityCriteria> findByPostNameAndActiveTrue(String postName);
    List<EligibilityCriteria> findByPostNameOrderByVersionDesc(String postName);
    List<EligibilityCriteria> findByActiveTrueOrderByPostName();

    @Query("SELECT COALESCE(MAX(c.version), 0) FROM EligibilityCriteria c WHERE c.postName = :postName")
    Integer findMaxVersionByPostName(String postName);

    @Modifying @Transactional
    @Query("UPDATE EligibilityCriteria c SET c.active = false WHERE c.postName = :postName")
    void deactivateAllByPostName(String postName);
}
