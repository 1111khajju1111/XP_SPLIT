package com.xpsplit.demo.service;

import com.xpsplit.demo.entity.Group;
import com.xpsplit.demo.entity.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * BalanceService
 *
 * Core Logic (as per XP_SPLIT spec):
 *   1. For each expense, sharePerMember = totalAmount / totalIncludedMembers
 *   2. Each included member's totalOwed increases by sharePerMember
 *   3. Payer's totalPaid increases by the full expense amount
 *   4. netBalance = totalPaid - totalOwed
 *      - positive  => member should RECEIVE money
 *      - negative  => member should PAY money
 *      - zero      => member is SETTLED
 *
 * Settlement suggestions use a greedy min-transactions algorithm:
 *   - Debtors (negative balance) pay creditors (positive balance)
 *   - Minimizes number of transactions
 */
@Service
@Transactional(readOnly = true)
public class BalanceService {

    private final GroupService groupService;
    private final ExpenseService expenseService;

    public BalanceService(GroupService groupService, ExpenseService expenseService) {
        this.groupService = groupService;
        this.expenseService = expenseService;
    }

    // ---- Member balance within a group ----

    public Map<Long, BigDecimal> calculateGroupBalances(Long groupId) {
        Group group = groupService.getGroupById(groupId);
        Map<Long, BigDecimal> balances = new LinkedHashMap<>();

        for (User member : group.getMembers()) {
            BigDecimal netBalance = expenseService.getNetBalance(groupId, member.getId());
            balances.put(member.getId(), netBalance.setScale(2, RoundingMode.HALF_UP));
        }
        return balances;
    }

    /**
     * Returns a map of userId -> MemberBalanceInfo containing
     * name, totalPaid, totalOwed, netBalance
     */
    public List<MemberBalanceInfo> getMemberBalances(Long groupId) {
        Group group = groupService.getGroupById(groupId);
        List<MemberBalanceInfo> result = new ArrayList<>();

        for (User member : group.getMembers()) {
            BigDecimal paid = expenseService.getTotalPaidByUser(groupId, member.getId());
            BigDecimal owed = expenseService.getTotalOwedByUser(groupId, member.getId());
            BigDecimal net = paid.subtract(owed).setScale(2, RoundingMode.HALF_UP);

            MemberBalanceInfo info = new MemberBalanceInfo();
            info.userId = member.getId();
            info.userName = member.getName();
            info.totalPaid = paid.setScale(2, RoundingMode.HALF_UP);
            info.totalOwed = owed.setScale(2, RoundingMode.HALF_UP);
            info.netBalance = net;
            result.add(info);
        }
        return result;
    }

    /**
     * Greedy settlement suggestion algorithm.
     * Minimizes number of transactions to settle all debts.
     *
     * Example:
     *   A: +800, B: -400, C: -400
     *   => B pays A 400, C pays A 400
     */
    public List<SettlementTransaction> generateSettlementSuggestions(Long groupId) {
        Group group = groupService.getGroupById(groupId);
        List<MemberBalanceInfo> balances = getMemberBalances(groupId);

        // Separate into debtors (negative) and creditors (positive)
        // Use copies as we modify amounts during greedy pass
        List<UserAmount> debtors = new ArrayList<>();
        List<UserAmount> creditors = new ArrayList<>();

        for (MemberBalanceInfo b : balances) {
            if (b.netBalance.compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(new UserAmount(b.userId, b.userName, b.netBalance.abs()));
            } else if (b.netBalance.compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(new UserAmount(b.userId, b.userName, b.netBalance));
            }
            // Zero balance => already settled, skip
        }

        List<SettlementTransaction> suggestions = new ArrayList<>();
        int i = 0, j = 0;

        while (i < debtors.size() && j < creditors.size()) {
            UserAmount debtor = debtors.get(i);
            UserAmount creditor = creditors.get(j);

            BigDecimal transferAmount = debtor.amount.min(creditor.amount);
            transferAmount = transferAmount.setScale(2, RoundingMode.HALF_UP);

            SettlementTransaction tx = new SettlementTransaction();
            tx.fromUserId = debtor.userId;
            tx.fromUserName = debtor.userName;
            tx.toUserId = creditor.userId;
            tx.toUserName = creditor.userName;
            tx.amount = transferAmount;
            suggestions.add(tx);

            debtor.amount = debtor.amount.subtract(transferAmount);
            creditor.amount = creditor.amount.subtract(transferAmount);

            if (debtor.amount.compareTo(BigDecimal.ZERO) == 0) i++;
            if (creditor.amount.compareTo(BigDecimal.ZERO) == 0) j++;
        }

        return suggestions;
    }

    // ---- Inner helper classes ----

    public static class MemberBalanceInfo {
        public Long userId;
        public String userName;
        public BigDecimal totalPaid;
        public BigDecimal totalOwed;
        public BigDecimal netBalance; // +ve = receive, -ve = pay

        public Long getUserId() { return userId; }
        public String getUserName() { return userName; }
        public BigDecimal getTotalPaid() { return totalPaid; }
        public BigDecimal getTotalOwed() { return totalOwed; }
        public BigDecimal getNetBalance() { return netBalance; }
    }

    public static class SettlementTransaction {
        public Long fromUserId;
        public String fromUserName;
        public Long toUserId;
        public String toUserName;
        public BigDecimal amount;

        public Long getFromUserId() { return fromUserId; }
        public String getFromUserName() { return fromUserName; }
        public Long getToUserId() { return toUserId; }
        public String getToUserName() { return toUserName; }
        public BigDecimal getAmount() { return amount; }
    }

    private static class UserAmount {
        Long userId;
        String userName;
        BigDecimal amount;

        UserAmount(Long userId, String userName, BigDecimal amount) {
            this.userId = userId;
            this.userName = userName;
            this.amount = amount;
        }
    }
}
