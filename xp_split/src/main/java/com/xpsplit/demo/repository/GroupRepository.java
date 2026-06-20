package com.xpsplit.demo.repository;

import com.xpsplit.demo.entity.Group;
import com.xpsplit.demo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    Optional<Group> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);

    List<Group> findByCreatedBy(User createdBy);

    // All groups a user is a member of
    @Query("SELECT g FROM Group g JOIN g.members m WHERE m.id = :userId")
    List<Group> findGroupsByMemberId(@Param("userId") Long userId);

    // Check if a user is already in a group
    @Query("SELECT COUNT(m) > 0 FROM Group g JOIN g.members m WHERE g.id = :groupId AND m.id = :userId")
    boolean isUserMemberOfGroup(@Param("groupId") Long groupId, @Param("userId") Long userId);
}
