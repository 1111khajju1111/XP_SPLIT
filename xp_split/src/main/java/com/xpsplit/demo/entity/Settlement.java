package com.xpsplit.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlements")
public class Settlement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Positive
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    // Person who paid the settlement
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paid_by", nullable = false)
    private User paidBy;

    // Person who received the settlement
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "received_by", nullable = false)
    private User receivedBy;

    // Group context of the settlement
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private Group group;

    @Column(name = "settled_at")
    private LocalDateTime settledAt;

    // Status: PENDING, COMPLETED
    @Column(name = "status", nullable = false)
    private String status;

    // ---- Constructors ----

    public Settlement() {}

    public Settlement(BigDecimal amount, User paidBy, User receivedBy, Group group) {
        this.amount = amount;
        this.paidBy = paidBy;
        this.receivedBy = receivedBy;
        this.group = group;
        this.settledAt = LocalDateTime.now();
        this.status = "COMPLETED";
    }

    @PrePersist
    public void prePersist() {
        if (this.settledAt == null) {
            this.settledAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "COMPLETED";
        }
    }

    // ---- Getters & Setters ----

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public User getPaidBy() { return paidBy; }
    public void setPaidBy(User paidBy) { this.paidBy = paidBy; }

    public User getReceivedBy() { return receivedBy; }
    public void setReceivedBy(User receivedBy) { this.receivedBy = receivedBy; }

    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }

    public LocalDateTime getSettledAt() { return settledAt; }
    public void setSettledAt(LocalDateTime settledAt) { this.settledAt = settledAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
