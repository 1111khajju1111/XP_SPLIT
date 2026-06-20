package com.xpsplit.demo.controller;

import com.xpsplit.demo.entity.Group;
import com.xpsplit.demo.service.BalanceService;
import com.xpsplit.demo.service.ExpenseService;
import com.xpsplit.demo.service.GroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/balances")
@CrossOrigin(origins = {
	    "http://localhost:3000",
	    "http://localhost:5174"
	})
public class BalanceController {

    private final BalanceService balanceService;
    private final ExpenseService expenseService;
    private final GroupService   groupService;

    public BalanceController(BalanceService balanceService,
                             ExpenseService expenseService,
                             GroupService groupService) {
        this.balanceService  = balanceService;
        this.expenseService  = expenseService;
        this.groupService    = groupService;
    }

    /**
     * GET /api/balances/group/{groupId}
     * Full balance summary:
     *   - Per-member balances (totalPaid, totalOwed, netBalance)
     *   - Settlement suggestions
     *   - Group stats
     */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<Map<String, Object>> getGroupBalanceSummary(@PathVariable Long groupId) {
        try {
            Group group = groupService.getGroupById(groupId);

            List<BalanceService.MemberBalanceInfo> memberBalances =
                    balanceService.getMemberBalances(groupId);

            List<BalanceService.SettlementTransaction> suggestions =
                    balanceService.generateSettlementSuggestions(groupId);

            BigDecimal totalSpending = expenseService.getTotalGroupSpending(groupId);

            // Build response
            List<Map<String, Object>> balanceList = memberBalances.stream()
                    .map(b -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("userId",      b.getUserId());
                        m.put("userName",    b.getUserName());
                        m.put("totalPaid",   b.getTotalPaid());
                        m.put("totalOwed",   b.getTotalOwed());
                        m.put("netBalance",  b.getNetBalance());
                        // Status label
                        int cmp = b.getNetBalance().compareTo(BigDecimal.ZERO);
                        m.put("status", cmp > 0 ? "TO_RECEIVE" : cmp < 0 ? "TO_PAY" : "SETTLED");
                        return m;
                    }).toList();

            List<Map<String, Object>> suggestionList = suggestions.stream()
                    .map(s -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("fromUserId",   s.getFromUserId());
                        m.put("fromUserName", s.getFromUserName());
                        m.put("toUserId",     s.getToUserId());
                        m.put("toUserName",   s.getToUserName());
                        m.put("amount",       s.getAmount());
                        return m;
                    }).toList();

            Map<String, Object> data = new HashMap<>();
            data.put("groupId",              group.getId());
            data.put("groupName",            group.getName());
            data.put("totalGroupSpending",   totalSpending);
            data.put("totalMembers",         group.getMembers().size());
            data.put("totalExpenses",        group.getExpenses().size());
            data.put("memberBalances",       balanceList);
            data.put("settlementSuggestions", suggestionList);

            return ResponseEntity.ok(successResponse("Balance summary fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/balances/group/{groupId}/user/{userId}
     * Individual user balance in a group
     */
    @GetMapping("/group/{groupId}/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserBalanceInGroup(
            @PathVariable Long groupId,
            @PathVariable Long userId) {
        try {
            BigDecimal totalPaid = expenseService.getTotalPaidByUser(groupId, userId);
            BigDecimal totalOwed = expenseService.getTotalOwedByUser(groupId, userId);
            BigDecimal net       = expenseService.getNetBalance(groupId, userId);

            Map<String, Object> data = new HashMap<>();
            data.put("groupId",    groupId);
            data.put("userId",     userId);
            data.put("totalPaid",  totalPaid);
            data.put("totalOwed",  totalOwed);
            data.put("netBalance", net);
            int cmp = net.compareTo(BigDecimal.ZERO);
            data.put("status", cmp > 0 ? "TO_RECEIVE" : cmp < 0 ? "TO_PAY" : "SETTLED");

            return ResponseEntity.ok(successResponse("User balance fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // ---- Helpers ----

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
