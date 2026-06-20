package com.xpsplit.demo.controller;

import com.xpsplit.demo.entity.Settlement;
import com.xpsplit.demo.service.SettlementService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settlements")
@CrossOrigin(origins = {
	    "http://localhost:3000",
	    "http://localhost:5174"
	})
public class SettlementController {

    private final SettlementService settlementService;

    public SettlementController(SettlementService settlementService) {
        this.settlementService = settlementService;
    }

    // POST /api/settlements
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSettlement(@RequestBody Map<String, Object> body) {
        try {
            Long       groupId           = Long.valueOf(body.get("groupId").toString());
            Long       paidByUserId      = Long.valueOf(body.get("paidByUserId").toString());
            Long       receivedByUserId  = Long.valueOf(body.get("receivedByUserId").toString());
            BigDecimal amount            = new BigDecimal(body.get("amount").toString());

            Settlement settlement = settlementService.createSettlement(
                    groupId, paidByUserId, receivedByUserId, amount);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(successResponse("Settlement recorded", toSettlementMap(settlement)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/settlements/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getSettlementById(@PathVariable Long id) {
        try {
            Settlement settlement = settlementService.getSettlementById(id);
            return ResponseEntity.ok(successResponse("Settlement fetched", toSettlementMap(settlement)));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/settlements/group/{groupId}
    @GetMapping("/group/{groupId}")
    public ResponseEntity<Map<String, Object>> getSettlementsByGroup(@PathVariable Long groupId) {
        try {
            List<Settlement> settlements = settlementService.getSettlementsByGroup(groupId);
            List<Map<String, Object>> list = settlements.stream()
                    .map(this::toSettlementMap).toList();
            return ResponseEntity.ok(successResponse("Settlements fetched", list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/settlements/group/{groupId}/payer/{userId}
    @GetMapping("/group/{groupId}/payer/{userId}")
    public ResponseEntity<Map<String, Object>> getSettlementsByPayer(
            @PathVariable Long groupId, @PathVariable Long userId) {
        try {
            List<Settlement> settlements = settlementService.getSettlementsByGroupAndPayer(groupId, userId);
            List<Map<String, Object>> list = settlements.stream()
                    .map(this::toSettlementMap).toList();
            return ResponseEntity.ok(successResponse("Settlements by payer fetched", list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/settlements/group/{groupId}/receiver/{userId}
    @GetMapping("/group/{groupId}/receiver/{userId}")
    public ResponseEntity<Map<String, Object>> getSettlementsByReceiver(
            @PathVariable Long groupId, @PathVariable Long userId) {
        try {
            List<Settlement> settlements = settlementService.getSettlementsByGroupAndReceiver(groupId, userId);
            List<Map<String, Object>> list = settlements.stream()
                    .map(this::toSettlementMap).toList();
            return ResponseEntity.ok(successResponse("Settlements by receiver fetched", list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // GET /api/settlements/group/{groupId}/between/{user1Id}/{user2Id}
    @GetMapping("/group/{groupId}/between/{user1Id}/{user2Id}")
    public ResponseEntity<Map<String, Object>> getSettlementsBetweenUsers(
            @PathVariable Long groupId,
            @PathVariable Long user1Id,
            @PathVariable Long user2Id) {
        try {
            List<Settlement> settlements = settlementService.getSettlementsBetweenUsers(groupId, user1Id, user2Id);
            List<Map<String, Object>> list = settlements.stream()
                    .map(this::toSettlementMap).toList();
            return ResponseEntity.ok(successResponse("Settlements fetched", list));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(errorResponse(e.getMessage()));
        }
    }

    // ---- Helpers ----

    private Map<String, Object> toSettlementMap(Settlement s) {
        Map<String, Object> map = new HashMap<>();
        map.put("id",               s.getId());
        map.put("amount",           s.getAmount());
        map.put("paidByUserId",     s.getPaidBy().getId());
        map.put("paidByName",       s.getPaidBy().getName());
        map.put("receivedByUserId", s.getReceivedBy().getId());
        map.put("receivedByName",   s.getReceivedBy().getName());
        map.put("groupId",          s.getGroup().getId());
        map.put("groupName",        s.getGroup().getName());
        map.put("settledAt",        s.getSettledAt());
        map.put("status",           s.getStatus());
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
