package com.xpsplit.demo.repository;

import com.xpsplit.demo.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    // All settlements in a group (latest first)
    List<Settlement> findByGroupIdOrderBySettledAtDesc(Long groupId);

    // Settlements paid by a user in a group
    List<Settlement> findByGroupIdAndPaidById(Long groupId, Long paidById);

    // Settlements received by a user in a group
    List<Settlement> findByGroupIdAndReceivedById(Long groupId, Long receivedById);

    // Total settled amount paid by a user in a group
    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Settlement s " +
           "WHERE s.group.id = :groupId AND s.paidBy.id = :userId AND s.status = 'COMPLETED'")
    BigDecimal getTotalSettledByUser(@Param("groupId") Long groupId, @Param("userId") Long userId);

    // Total settled amount received by a user in a group
    @Query("SELECT COALESCE(SUM(s.amount), 0) FROM Settlement s " +
           "WHERE s.group.id = :groupId AND s.receivedBy.id = :userId AND s.status = 'COMPLETED'")
    BigDecimal getTotalReceivedByUser(@Param("groupId") Long groupId, @Param("userId") Long userId);

    // Settlements between two specific users in a group
    @Query("SELECT s FROM Settlement s WHERE s.group.id = :groupId " +
           "AND ((s.paidBy.id = :user1Id AND s.receivedBy.id = :user2Id) " +
           "OR (s.paidBy.id = :user2Id AND s.receivedBy.id = :user1Id)) " +
           "ORDER BY s.settledAt DESC")
    List<Settlement> findSettlementsBetweenUsers(
        @Param("groupId") Long groupId,
        @Param("user1Id") Long user1Id,
        @Param("user2Id") Long user2Id
    );
}
