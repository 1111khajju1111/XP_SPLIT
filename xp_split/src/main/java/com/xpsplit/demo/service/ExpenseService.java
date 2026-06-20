package com.xpsplit.demo.service;

import com.xpsplit.demo.entity.Expense;
import com.xpsplit.demo.entity.Group;
import com.xpsplit.demo.entity.User;
import com.xpsplit.demo.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserService userService;
    private final GroupService groupService;

    public ExpenseService(ExpenseRepository expenseRepository,
                          UserService userService,
                          GroupService groupService) {
        this.expenseRepository = expenseRepository;
        this.userService = userService;
        this.groupService = groupService;
    }

    // ---- Add Expense ----

    public Expense addExpense(String expenseName, BigDecimal amount, String category,
                              LocalDate expenseDate, Long paidByUserId, Long groupId,
                              List<Long> includedMemberIds) {

        User payer = userService.getUserById(paidByUserId);
        Group group = groupService.getGroupById(groupId);

        // Validate payer is a group member
        boolean payerIsInGroup = group.getMembers().stream()
                .anyMatch(m -> m.getId().equals(paidByUserId));
        if (!payerIsInGroup) {
            throw new RuntimeException("Payer is not a member of this group");
        }

        // Validate all included members are in the group
        List<User> includedMembers = includedMemberIds.stream()
                .map(userService::getUserById)
                .toList();

        for (User member : includedMembers) {
            boolean isMember = group.getMembers().stream()
                    .anyMatch(m -> m.getId().equals(member.getId()));
            if (!isMember) {
                throw new RuntimeException("User " + member.getName() + " is not a member of this group");
            }
        }

        Expense expense = new Expense(
                expenseName,
                amount,
                category,
                expenseDate != null ? expenseDate : LocalDate.now(),
                payer,
                group
        );
        expense.setIncludedMembers(includedMembers);
        return expenseRepository.save(expense);
    }

    // ---- Delete Expense ----

    public void deleteExpense(Long expenseId) {
        Expense expense = getExpenseById(expenseId);
        expenseRepository.delete(expense);
    }

    // ---- Read ----

    @Transactional(readOnly = true)
    public Expense getExpenseById(Long expenseId) {
        return expenseRepository.findById(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + expenseId));
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByGroup(Long groupId) {
        Group group = groupService.getGroupById(groupId);
        return expenseRepository.findByGroupOrderByExpenseDateDesc(group);
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByGroupAndCategory(Long groupId, String category) {
        Group group = groupService.getGroupById(groupId);
        return expenseRepository.findByGroupAndCategory(group, category);
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByGroupAndDateRange(Long groupId, LocalDate start, LocalDate end) {
        Group group = groupService.getGroupById(groupId);
        return expenseRepository
                .findByGroupAndExpenseDateBetweenOrderByExpenseDateDesc(group, start, end);
    }

    // ---- Splitting Logic ----

    /**
     * Returns the equal share per member for a given expense.
     * sharePerMember = totalAmount / totalIncludedMembers
     */
    public BigDecimal calculateSharePerMember(Expense expense) {
        int memberCount = expense.getIncludedMembers().size();
        if (memberCount == 0) return BigDecimal.ZERO;
        return expense.getAmount()
                .divide(BigDecimal.valueOf(memberCount), 2, RoundingMode.HALF_UP);
    }

    // ---- Balance Calculation Per User In Group ----

    @Transactional(readOnly = true)
    public BigDecimal getTotalPaidByUser(Long groupId, Long userId) {
        return expenseRepository.getTotalPaidByUserInGroup(groupId, userId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOwedByUser(Long groupId, Long userId) {
        return expenseRepository.getTotalOwedByUserInGroup(groupId, userId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getNetBalance(Long groupId, Long userId) {
        BigDecimal paid = getTotalPaidByUser(groupId, userId);
        BigDecimal owed = getTotalOwedByUser(groupId, userId);
        // balance = totalPaid - totalOwed
        // positive => should receive, negative => should pay
        return paid.subtract(owed);
    }

    // ---- Analytics ----

    @Transactional(readOnly = true)
    public BigDecimal getTotalGroupSpending(Long groupId) {
        return expenseRepository.getTotalGroupSpending(groupId);
    }

    @Transactional(readOnly = true)
    public List<Object[]> getCategoryWiseSpending(Long groupId) {
        return expenseRepository.getCategoryWiseSpending(groupId);
    }

    @Transactional(readOnly = true)
    public List<Object[]> getMonthlySpendingTrend(Long groupId) {
        return expenseRepository.getMonthlySpendingTrend(groupId);
    }

    @Transactional(readOnly = true)
    public List<Object[]> getMemberWiseSpending(Long groupId) {
        return expenseRepository.getMemberWiseSpending(groupId);
    }
}
