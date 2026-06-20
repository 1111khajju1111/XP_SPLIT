package com.xpsplit.demo.repository;

import com.xpsplit.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByMobile(String mobile);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByMobile(String mobile);

    // Login: find by username or email
    Optional<User> findByUsernameOrEmail(String username, String email);
}
