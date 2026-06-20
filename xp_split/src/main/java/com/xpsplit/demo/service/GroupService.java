package com.xpsplit.demo.service;

import com.xpsplit.demo.entity.Group;
import com.xpsplit.demo.entity.User;
import com.xpsplit.demo.repository.GroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserService userService;

    public GroupService(GroupRepository groupRepository, UserService userService) {
        this.groupRepository = groupRepository;
        this.userService = userService;
    }

    // ---- Create Group ----

    public Group createGroup(String name, String description, Long createdByUserId) {
        User creator = userService.getUserById(createdByUserId);
        String inviteCode = generateUniqueInviteCode();

        Group group = new Group(name, description, inviteCode, creator);
        group.getMembers().add(creator); // Creator is automatically a member
        return groupRepository.save(group);
    }

    // ---- Join Group via Invite Code ----

    public Group joinGroup(String inviteCode, Long userId) {
        Group group = groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid invite code: " + inviteCode));

        User user = userService.getUserById(userId);

        if (groupRepository.isUserMemberOfGroup(group.getId(), userId)) {
            throw new RuntimeException("User is already a member of this group");
        }

        group.getMembers().add(user);
        return groupRepository.save(group);
    }

    // ---- Leave Group ----

    public void leaveGroup(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userService.getUserById(userId);

        if (!groupRepository.isUserMemberOfGroup(groupId, userId)) {
            throw new RuntimeException("User is not a member of this group");
        }

        // Creator cannot leave (must delete group instead)
        if (group.getCreatedBy().getId().equals(userId)) {
            throw new RuntimeException("Group creator cannot leave. Delete the group instead.");
        }

        group.getMembers().remove(user);
        groupRepository.save(group);
    }

    // ---- Read ----

    @Transactional(readOnly = true)
    public Group getGroupById(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + groupId));
    }

    @Transactional(readOnly = true)
    public Group getGroupByInviteCode(String inviteCode) {
        return groupRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Group not found with invite code: " + inviteCode));
    }

    @Transactional(readOnly = true)
    public List<Group> getGroupsByUser(Long userId) {
        return groupRepository.findGroupsByMemberId(userId);
    }

    @Transactional(readOnly = true)
    public List<User> getGroupMembers(Long groupId) {
        Group group = getGroupById(groupId);
        return group.getMembers();
    }

    // ---- Update Group ----

    public Group updateGroup(Long groupId, String name, String description) {
        Group group = getGroupById(groupId);
        if (name != null && !name.isBlank()) group.setName(name);
        if (description != null) group.setDescription(description);
        return groupRepository.save(group);
    }

    // ---- Regenerate Invite Code ----

    public String regenerateInviteCode(Long groupId, Long requestingUserId) {
        Group group = getGroupById(groupId);

        if (!group.getCreatedBy().getId().equals(requestingUserId)) {
            throw new RuntimeException("Only the group creator can regenerate the invite code");
        }

        String newCode = generateUniqueInviteCode();
        group.setInviteCode(newCode);
        groupRepository.save(group);
        return newCode;
    }

    // ---- Delete Group ----

    public void deleteGroup(Long groupId, Long requestingUserId) {
        Group group = getGroupById(groupId);

        if (!group.getCreatedBy().getId().equals(requestingUserId)) {
            throw new RuntimeException("Only the group creator can delete the group");
        }

        groupRepository.delete(group);
    }

    // ---- Helpers ----

    private String generateUniqueInviteCode() {
        String code;
        do {
            // Generate a short 8-character alphanumeric invite code
            code = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        } while (groupRepository.existsByInviteCode(code));
        return code;
    }
}
