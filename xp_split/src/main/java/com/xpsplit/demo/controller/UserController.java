package com.xpsplit.demo.controller;

import com.xpsplit.demo.entity.User;
import com.xpsplit.demo.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {
	    "http://localhost:3000",
	    "http://localhost:5174"
	})
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // POST /api/users/register
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        try {
            String name       = body.get("name");
            String username   = body.get("username");
            String email      = body.get("email");
            String password   = body.get("password");
            String dobStr     = body.get("dob");
            String mobile     = body.get("mobile");

            LocalDate dob = (dobStr != null && !dobStr.isBlank()) ? LocalDate.parse(dobStr) : null;

            User user = userService.registerUser(name, username, email, password, dob, mobile);
            return ResponseEntity.status(HttpStatus.CREATED).body(successResponse("User registered successfully", toUserMap(user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // POST /api/users/login
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        try {
            String usernameOrEmail = body.get("usernameOrEmail");
            String password        = body.get("password");

            User user = userService.login(usernameOrEmail, password);
            return ResponseEntity.ok(successResponse("Login successful", toUserMap(user)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(successResponse("User fetched", toUserMap(user)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/users
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<Map<String, Object>> userList = users.stream().map(this::toUserMap).toList();
        return ResponseEntity.ok(successResponse("Users fetched", userList));
    }

    // PUT /api/users/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String name   = body.get("name");
            String dobStr = body.get("dob");
            String mobile = body.get("mobile");
            LocalDate dob = (dobStr != null && !dobStr.isBlank()) ? LocalDate.parse(dobStr) : null;

            User user = userService.updateProfile(id, name, dob, mobile);
            return ResponseEntity.ok(successResponse("Profile updated", toUserMap(user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // PUT /api/users/{id}/photo
    @PutMapping("/{id}/photo")
    public ResponseEntity<Map<String, Object>> updatePhoto(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String photoUrl = body.get("profilePhotoUrl");
            User user = userService.updateProfilePhoto(id, photoUrl);
            return ResponseEntity.ok(successResponse("Photo updated", toUserMap(user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // DELETE /api/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(successResponse("User deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // ---- Helpers ----

    private Map<String, Object> toUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
        map.put("dob", user.getDob());
        map.put("mobile", user.getMobile());
        map.put("profilePhotoUrl", user.getProfilePhotoUrl());
        return map;
    }

    private Map<String, Object> successResponse(String message, Object data) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", message);
        res.put("data", data);
        return res;
    }

    private Map<String, Object> errorResponse(String message) {
        Map<String, Object> res = new HashMap<>();
        res.put("success", false);
        res.put("message", message);
        res.put("data", null);
        return res;
    }
}
