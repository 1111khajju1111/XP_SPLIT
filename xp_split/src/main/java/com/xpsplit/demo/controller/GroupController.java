package com.xpsplit.demo.controller;

import com.xpsplit.demo.entity.Group;
import com.xpsplit.demo.entity.User;
import com.xpsplit.demo.service.GroupService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = {
	    "http://localhost:3000",
	    "http://localhost:5174"
	})
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    // POST /api/groups
    @PostMapping
    public ResponseEntity<Map<String, Object>> createGroup(@RequestBody Map<String, Object> body) {
        try {
            String name            = (String) body.get("name");
            String description     = (String) body.get("description");
            Long   createdByUserId = Long.valueOf(body.get("createdByUserId").toString());

            Group group = groupService.createGroup(name, description, createdByUserId);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(successResponse("Group created successfully", toGroupMap(group)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // POST /api/groups/join
    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinGroup(@RequestBody Map<String, Object> body) {
        try {
            String inviteCode = (String) body.get("inviteCode");
            Long   userId     = Long.valueOf(body.get("userId").toString());

            Group group = groupService.joinGroup(inviteCode, userId);
            return ResponseEntity.ok(successResponse("Joined group successfully", toGroupMap(group)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/groups/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getGroupById(@PathVariable Long id) {
        try {
            Group group = groupService.getGroupById(id);
            return ResponseEntity.ok(successResponse("Group fetched", toGroupMap(group)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/groups/user/{userId}  - All groups for a user
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getGroupsByUser(@PathVariable Long userId) {
        try {
            List<Group> groups = groupService.getGroupsByUser(userId);
            List<Map<String, Object>> groupList = groups.stream().map(this::toGroupMap).toList();
            return ResponseEntity.ok(successResponse("Groups fetched", groupList));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/groups/{id}/members
    @GetMapping("/{id}/members")
    public ResponseEntity<Map<String, Object>> getGroupMembers(@PathVariable Long id) {
        try {
            List<User> members = groupService.getGroupMembers(id);
            List<Map<String, Object>> memberList = members.stream().map(this::toMemberMap).toList();
            return ResponseEntity.ok(successResponse("Members fetched", memberList));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // PUT /api/groups/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateGroup(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        try {
            String name        = body.get("name");
            String description = body.get("description");
            Group group = groupService.updateGroup(id, name, description);
            return ResponseEntity.ok(successResponse("Group updated", toGroupMap(group)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // POST /api/groups/{id}/leave
    @PostMapping("/{id}/leave")
    public ResponseEntity<Map<String, Object>> leaveGroup(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Long userId = Long.valueOf(body.get("userId").toString());
            groupService.leaveGroup(id, userId);
            return ResponseEntity.ok(successResponse("Left group successfully", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // POST /api/groups/{id}/regenerate-code
    @PostMapping("/{id}/regenerate-code")
    public ResponseEntity<Map<String, Object>> regenerateInviteCode(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Long requestingUserId = Long.valueOf(body.get("userId").toString());
            String newCode = groupService.regenerateInviteCode(id, requestingUserId);
            Map<String, Object> data = new HashMap<>();
            data.put("inviteCode", newCode);
            return ResponseEntity.ok(successResponse("Invite code regenerated", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // DELETE /api/groups/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteGroup(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Long requestingUserId = Long.valueOf(body.get("userId").toString());
            groupService.deleteGroup(id, requestingUserId);
            return ResponseEntity.ok(successResponse("Group deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // ---- Helpers ----

    private Map<String, Object> toGroupMap(Group group) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", group.getId());
        map.put("name", group.getName());
        map.put("description", group.getDescription());
        map.put("inviteCode", group.getInviteCode());
        map.put("createdByUserId", group.getCreatedBy().getId());
        map.put("createdByName", group.getCreatedBy().getName());
        map.put("createdAt", group.getCreatedAt());
        map.put("memberCount", group.getMembers().size());
        map.put("expenseCount", group.getExpenses().size());
        return map;
    }

    private Map<String, Object> toMemberMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("name", user.getName());
        map.put("username", user.getUsername());
        map.put("email", user.getEmail());
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
