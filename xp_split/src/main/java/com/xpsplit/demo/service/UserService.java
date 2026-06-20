package com.xpsplit.demo.service;

import com.xpsplit.demo.entity.User;
import com.xpsplit.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // ---- Registration ----

    public User registerUser(String name, String username, String email,
                             String password, java.time.LocalDate dob, String mobile) {

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already taken: " + username);
        }
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered: " + email);
        }
        if (mobile != null && userRepository.existsByMobile(mobile)) {
            throw new RuntimeException("Mobile number already registered: " + mobile);
        }

        // NOTE: In production, hash the password using BCryptPasswordEncoder
        // For now storing plain text as security is excluded per requirements
        User user = new User(name, username, email, password, dob, mobile);
        return userRepository.save(user);
    }

    // ---- Login ----

    @Transactional(readOnly = true)
    public User login(String usernameOrEmail, String password) {
        User user = userRepository.findByUsernameOrEmail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new RuntimeException("User not found with: " + usernameOrEmail));

        if (!user.getPassword().equals(password)) {
            throw new RuntimeException("Invalid password");
        }
        return user;
    }

    // ---- Read ----

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }

    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // ---- Update Profile ----

    public User updateProfile(Long userId, String name, java.time.LocalDate dob, String mobile) {
        User user = getUserById(userId);

        if (name != null && !name.isBlank()) {
            user.setName(name);
        }
        if (dob != null) {
            user.setDob(dob);
        }
        if (mobile != null && !mobile.isBlank()) {
            // Check uniqueness only if mobile changed
            if (!mobile.equals(user.getMobile()) && userRepository.existsByMobile(mobile)) {
                throw new RuntimeException("Mobile number already registered: " + mobile);
            }
            user.setMobile(mobile);
        }

        return userRepository.save(user);
    }

    // ---- Update Profile Photo URL ----

    public User updateProfilePhoto(Long userId, String photoUrl) {
        User user = getUserById(userId);
        user.setProfilePhotoUrl(photoUrl);
        return userRepository.save(user);
    }

    // ---- Delete ----

    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }
}
