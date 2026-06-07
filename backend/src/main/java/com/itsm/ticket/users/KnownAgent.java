package com.itsm.ticket.users;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Tracks agents/managers who have authenticated with the system so we can offer
 * a real "assignee picker" without calling the Keycloak Admin API.
 * Auto-upserted on each authenticated request by {@link KnownAgentTracker}.
 */
@Entity
@Table(name = "known_agents")
public class KnownAgent {

    @Id
    @Column(nullable = false, length = 255)
    private String username;

    @Column
    private String displayName;

    @Column(nullable = false, length = 16)
    private String role;

    @Column(length = 255)
    private String email;

    @Column(nullable = false)
    private Instant lastSeenAt;

    protected KnownAgent() {}

    public KnownAgent(String username, String displayName, String role, Instant lastSeenAt) {
        this.username = username;
        this.displayName = displayName;
        this.role = role;
        this.lastSeenAt = lastSeenAt;
    }

    public void touch(String displayName, String role, Instant when) {
        if (displayName != null && !displayName.isBlank()) {
            this.displayName = displayName;
        }
        this.role = role;
        this.lastSeenAt = when;
    }

    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getRole() { return role; }
    public String getEmail() { return email; }
    public Instant getLastSeenAt() { return lastSeenAt; }
}
