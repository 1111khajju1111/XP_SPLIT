package com.xpsplit.demo.controller;

import com.xpsplit.demo.service.ExpenseService;
import com.xpsplit.demo.service.GroupService;
import com.xpsplit.demo.entity.Group;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = {
	    "http://localhost:3000",
	    "http://localhost:5174"
	})
public class AnalyticsController {

    private final ExpenseService expenseService;
    private final GroupService   groupService;

    public AnalyticsController(ExpenseService expenseService, GroupService groupService) {
        this.expenseService = expenseService;
        this.groupService   = groupService;
    }

    /**
     * GET /api/analytics/group/{groupId}
     * Full analytics for a group:
     *   - Total spending
     *   - Category-wise breakdown
     *   - Monthly trend
     *   - Member-wise spending + highest spender
     */
    @GetMapping("/group/{groupId}")
    public ResponseEntity<Map<String, Object>> getGroupAnalytics(@PathVariable Long groupId) {
        try {
            Group group = groupService.getGroupById(groupId);

            // 1. Total spending
            BigDecimal totalSpending = expenseService.getTotalGroupSpending(groupId);

            // 2. Category-wise spending  [category, total]
            List<Object[]> rawCategory = expenseService.getCategoryWiseSpending(groupId);
            Map<String, BigDecimal> categoryMap = new LinkedHashMap<>();
            for (Object[] row : rawCategory) {
                String cat  = row[0] != null ? row[0].toString() : "Uncategorized";
                BigDecimal amt = new BigDecimal(row[1].toString());
                categoryMap.put(cat, amt);
            }

            // 3. Monthly trend  [month, year, total]
            List<Object[]> rawMonthly = expenseService.getMonthlySpendingTrend(groupId);
            List<Map<String, Object>> monthlyTrend = new ArrayList<>();
            for (Object[] row : rawMonthly) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("month",  row[0]);
                entry.put("year",   row[1]);
                entry.put("amount", new BigDecimal(row[2].toString()));
                monthlyTrend.add(entry);
            }

            // 4. Member-wise spending  [memberName, totalPaid]
            List<Object[]> rawMember = expenseService.getMemberWiseSpending(groupId);
            List<Map<String, Object>> memberSpending = new ArrayList<>();
            String highestSpender = null;
            BigDecimal highestAmount = BigDecimal.ZERO;

            for (Object[] row : rawMember) {
                String memberName = row[0].toString();
                BigDecimal amt    = new BigDecimal(row[1].toString());
                Map<String, Object> entry = new HashMap<>();
                entry.put("memberName", memberName);
                entry.put("amountPaid", amt);
                memberSpending.add(entry);

                if (amt.compareTo(highestAmount) > 0) {
                    highestAmount = amt;
                    highestSpender = memberName;
                }
            }

            // 5. Build final response
            Map<String, Object> data = new HashMap<>();
            data.put("groupId",            group.getId());
            data.put("groupName",          group.getName());
            data.put("totalSpending",      totalSpending);
            data.put("totalMembers",       group.getMembers().size());
            data.put("totalExpenses",      group.getExpenses().size());
            data.put("categoryWiseSpending", categoryMap);
            data.put("monthlyTrend",       monthlyTrend);
            data.put("memberWiseSpending", memberSpending);
            data.put("highestSpender",     highestSpender);

            return ResponseEntity.ok(successResponse("Analytics fetched", data));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/analytics/group/{groupId}/categories
     * Category breakdown only
     */
    @GetMapping("/group/{groupId}/categories")
    public ResponseEntity<Map<String, Object>> getCategoryBreakdown(@PathVariable Long groupId) {
        try {
            List<Object[]> rawCategory = expenseService.getCategoryWiseSpending(groupId);
            Map<String, BigDecimal> categoryMap = new LinkedHashMap<>();
            for (Object[] row : rawCategory) {
                String cat = row[0] != null ? row[0].toString() : "Uncategorized";
                categoryMap.put(cat, new BigDecimal(row[1].toString()));
            }
            return ResponseEntity.ok(successResponse("Category breakdown fetched", categoryMap));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/analytics/group/{groupId}/monthly
     * Monthly spending trend only
     */
    @GetMapping("/group/{groupId}/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyTrend(@PathVariable Long groupId) {
        try {
            List<Object[]> rawMonthly = expenseService.getMonthlySpendingTrend(groupId);
            List<Map<String, Object>> trend = new ArrayList<>();
            for (Object[] row : rawMonthly) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("month",  row[0]);
                entry.put("year",   row[1]);
                entry.put("amount", new BigDecimal(row[2].toString()));
                trend.add(entry);
            }
            return ResponseEntity.ok(successResponse("Monthly trend fetched", trend));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    /**
     * GET /api/analytics/group/{groupId}/members
     * Member-wise spending only
     */
    @GetMapping("/group/{groupId}/members")
    public ResponseEntity<Map<String, Object>> getMemberSpending(@PathVariable Long groupId) {
        try {
            List<Object[]> rawMember = expenseService.getMemberWiseSpending(groupId);
            List<Map<String, Object>> memberSpending = new ArrayList<>();
            for (Object[] row : rawMember) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("memberName", row[0]);
                entry.put("amountPaid", new BigDecimal(row[1].toString()));
                memberSpending.add(entry);
            }
            return ResponseEntity.ok(successResponse("Member spending fetched", memberSpending));
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
