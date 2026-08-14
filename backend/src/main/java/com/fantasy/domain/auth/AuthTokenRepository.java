package com.fantasy.domain.auth;

import com.fantasy.domain.user.UserEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthTokenEntity, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<AuthTokenEntity> findByTokenHashAndType(String tokenHash, AuthTokenType type);
    Optional<AuthTokenEntity> findFirstByUserAndTypeOrderByCreatedAtDesc(UserEntity user, AuthTokenType type);
    void deleteAllByUserAndType(UserEntity user, AuthTokenType type);
}
