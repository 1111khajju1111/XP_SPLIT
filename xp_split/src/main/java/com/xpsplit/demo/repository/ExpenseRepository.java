package com.xpsplit.demo.repository;

import com.xpsplit.demo.entity.Expense;
import com.xpsplit.demo.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    // All expenses in a group (sorted by date descending)
    List<Expense> findByGroupOrderByExpenseDateDesc(Group group);

    // Expenses in a group by category
    List<Expense> findByGroupAndCategory(Group group, String category);

    // Expenses in a group within a date range
    List<Expense> findByGroupAndExpenseDateBetweenOrderByExpenseDateDesc(
        Group group, LocalDate startDate, LocalDate endDate);

    // Expenses paid by a specific user in a group
    @Query("SELECT e FROM Expense e WHERE e.group.id = :groupId AND e.paidBy.id = :userId")
    List<Expense> findByGroupIdAndPaidById(@Param("groupId") Long groupId, @Param("userId") Long userId);

    // Total amount paid by a user in a group
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.group.id = :groupId AND e.paidBy.id = :userId")
    BigDecimal getTotalPaidByUserInGroup(@Param("groupId") Long groupId, @Param("userId") Long userId);

    // Total amount owed by a user in a group (sum of shares in included expenses)
    @Query("SELECT COALESCE(SUM(e.amount / SIZE(e.includedMembers)), 0) FROM Expense e " +
           "JOIN e.includedMembers m WHERE e.group.id = :groupId AND m.id = :userId")
    BigDecimal getTotalOwedByUserInGroup(@Param("groupId") Long groupId, @Param("userId") Long userId);

    // Total group spending
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.group.id = :groupId")
    BigDecimal getTotalGroupSpending(@Param("groupId") Long groupId);

    // Category-wise spending in a group
    @Query("SELECT e.category, COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.group.id = :groupId GROUP BY e.category")
    List<Object[]> getCategoryWiseSpending(@Param("groupId") Long groupId);

    // Monthly spending trend in a group
    @Query("SELECT MONTH(e.expenseDate), YEAR(e.expenseDate), COALESCE(SUM(e.amount), 0) " +
           "FROM Expense e WHERE e.group.id = :groupId " +
           "GROUP BY YEAR(e.expenseDate), MONTH(e.expenseDate) " +
           "ORDER BY YEAR(e.expenseDate) DESC, MONTH(e.expenseDate) DESC")
    List<Object[]> getMonthlySpendingTrend(@Param("groupId") Long groupId);

    // Member-wise spending (who paid how much)
    @Query("SELECT e.paidBy.name, COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.group.id = :groupId GROUP BY e.paidBy.id, e.paidBy.name ORDER BY SUM(e.amount) DESC")
    List<Object[]> getMemberWiseSpending(@Param("groupId") Long groupId);
}
