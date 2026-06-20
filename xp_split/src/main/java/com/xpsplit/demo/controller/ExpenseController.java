package com.xpsplit.demo.controller;

import com.xpsplit.demo.entity.Expense;
import com.xpsplit.demo.entity.User;
import com.xpsplit.demo.service.ExpenseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
@CrossOrigin(origins = {
	    "http://localhost:3000",
	    "http://localhost:5174"
	})
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    // POST /api/expenses
    @PostMapping
    public ResponseEntity<Map<String, Object>> addExpense(@RequestBody Map<String, Object> body) {
        try {
            String expenseName     = (String) body.get("expenseName");
            BigDecimal amount      = new BigDecimal(body.get("amount").toString());
            String category        = (String) body.get("category");
            String dateStr         = (String) body.get("expenseDate");
            Long paidByUserId      = Long.valueOf(body.get("paidByUserId").toString());
            Long groupId           = Long.valueOf(body.get("groupId").toString());

            @SuppressWarnings("unchecked")
            List<Object> rawIds    = (List<Object>) body.get("includedMemberIds");
            List<Long> memberIds   = rawIds.stream()
                    .map(o -> Long.valueOf(o.toString()))
                    .toList();

            LocalDate expenseDate  = (dateStr != null && !dateStr.isBlank())
                    ? LocalDate.parse(dateStr)
                    : LocalDate.now();

            Expense expense = expenseService.addExpense(
                    expenseName, amount, category, expenseDate,
                    paidByUserId, groupId, memberIds);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(successResponse("Expense added successfully", toExpenseMap(expense)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/expenses/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getExpenseById(@PathVariable Long id) {
        try {
            Expense expense = expenseService.getExpenseById(id);
            return ResponseEntity.ok(successResponse("Expense fetched", toExpenseMap(expense)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/expenses/group/{groupId}
    @GetMapping("/group/{groupId}")
    public ResponseEntity<Map<String, Object>> getExpensesByGroup(@PathVariable Long groupId) {
        try {
            List<Expense> expenses = expenseService.getExpensesByGroup(groupId);
            List<Map<String, Object>> expenseList = expenses.stream()
                    .map(this::toExpenseMap).toList();
            return ResponseEntity.ok(successResponse("Expenses fetched", expenseList));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/expenses/group/{groupId}/category/{category}
    @GetMapping("/group/{groupId}/category/{category}")
    public ResponseEntity<Map<String, Object>> getExpensesByCategory(
            @PathVariable Long groupId,
            @PathVariable String category) {
        try {
            List<Expense> expenses = expenseService.getExpensesByGroupAndCategory(groupId, category);
            List<Map<String, Object>> expenseList = expenses.stream()
                    .map(this::toExpenseMap).toList();
            return ResponseEntity.ok(successResponse("Expenses by category fetched", expenseList));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/expenses/group/{groupId}/date-range?start=2024-01-01&end=2024-12-31
    @GetMapping("/group/{groupId}/date-range")
    public ResponseEntity<Map<String, Object>> getExpensesByDateRange(
            @PathVariable Long groupId,
            @RequestParam String start,
            @RequestParam String end) {
        try {
            LocalDate startDate = LocalDate.parse(start);
            LocalDate endDate   = LocalDate.parse(end);
            List<Expense> expenses = expenseService.getExpensesByGroupAndDateRange(groupId, startDate, endDate);
            List<Map<String, Object>> expenseList = expenses.stream()
                    .map(this::toExpenseMap).toList();
            return ResponseEntity.ok(successResponse("Expenses in date range fetched", expenseList));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // DELETE /api/expenses/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteExpense(@PathVariable Long id) {
        try {
            expenseService.deleteExpense(id);
            return ResponseEntity.ok(successResponse("Expense deleted", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // ---- Helpers ----

    private Map<String, Object> toExpenseMap(Expense expense) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", expense.getId());
        map.put("expenseName", expense.getExpenseName());
        map.put("amount", expense.getAmount());
        map.put("category", expense.getCategory());
        map.put("expenseDate", expense.getExpenseDate());
        map.put("createdAt", expense.getCreatedAt());

        map.put("paidByUserId", expense.getPaidBy().getId());
        map.put("paidByName", expense.getPaidBy().getName());

        map.put("groupId", expense.getGroup().getId());
        map.put("groupName", expense.getGroup().getName());

        List<Map<String, Object>> members = expense.getIncludedMembers().stream()
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("name", u.getName());
                    return m;
                }).toList();
        map.put("includedMembers", members);

        // Equal share per member
        BigDecimal sharePerMember = expenseService.calculateSharePerMember(expense);
        map.put("sharePerMember", sharePerMember);

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
