package com.ptutor.backend.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ptutor.backend.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUser_IdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<Notification> findByUser_IdAndReadAndDeletedAtIsNullOrderByCreatedAtDesc(UUID userId, boolean read,
                                                                                  Pageable pageable);

    long countByUser_IdAndReadFalseAndDeletedAtIsNull(UUID userId);

    Optional<Notification> findByIdAndUser_Id(UUID id, UUID userId);

    @Modifying
    @Query("update Notification n set n.read = true where n.user.id = :userId and n.read = false")
    int markAllRead(@Param("userId") UUID userId);
}
