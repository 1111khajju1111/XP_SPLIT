package com.xpsplit.demo.service;

import com.xpsplit.demo.entity.Group;
import com.xpsplit.demo.entity.Settlement;
import com.xpsplit.demo.entity.User;
import com.xpsplit.demo.repository.SettlementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final UserService userService;
    private final GroupService groupService;

    public SettlementService(SettlementRepository settlementRepository,
                             UserService userService,
                             GroupService groupService) {
        this.settlementRepository = settlementRepository;
        this.userService = userService;
        this.groupService = groupService;
    }

    // ---- Create Settlement ----

    public Settlement createSettlement(Long groupId, Long paidByUserId,
                                       Long receivedByUserId, BigDecimal amount) {

        Group group = groupService.getGroupById(groupId);
        User paidBy = userService.getUserById(paidByUserId);
        User receivedBy = userService.getUserById(receivedByUserId);

        if (paidByUserId.equals(receivedByUserId)) {
            throw new RuntimeException("Payer and receiver cannot be the same person");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Settlement amount must be greater than zero");
        }

        Settlement settlement = new Settlement(amount, paidBy, receivedBy, group);
        return settlementRepository.save(settlement);
    }

    // ---- Read ----

    @Transactional(readOnly = true)
    public Settlement getSettlementById(Long settlementId) {
        return settlementRepository.findById(settlementId)
                .orElseThrow(() -> new RuntimeException("Settlement not found with id: " + settlementId));
    }

    @Transactional(readOnly = true)
    public List<Settlement> getSettlementsByGroup(Long groupId) {
        return settlementRepository.findByGroupIdOrderBySettledAtDesc(groupId);
    }

    @Transactional(readOnly = true)
    public List<Settlement> getSettlementsByGroupAndPayer(Long groupId, Long paidByUserId) {
        return settlementRepository.findByGroupIdAndPaidById(groupId, paidByUserId);
    }

    @Transactional(readOnly = true)
    public List<Settlement> getSettlementsByGroupAndReceiver(Long groupId, Long receivedByUserId) {
        return settlementRepository.findByGroupIdAndReceivedById(groupId, receivedByUserId);
    }

    @Transactional(readOnly = true)
    public List<Settlement> getSettlementsBetweenUsers(Long groupId, Long user1Id, Long user2Id) {
        return settlementRepository.findSettlementsBetweenUsers(groupId, user1Id, user2Id);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalSettledByUser(Long groupId, Long userId) {
        return settlementRepository.getTotalSettledByUser(groupId, userId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalReceivedByUser(Long groupId, Long userId) {
        return settlementRepository.getTotalReceivedByUser(groupId, userId);
    }
}
