package com.itsm.ticket.users;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/** Records each authenticated user (insert or update) so the directory stays current. */
@Service
public class KnownAgentService {

    private final KnownAgentRepository repository;

    public KnownAgentService(KnownAgentRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void upsert(String username, String displayName, String role) {
        upsert(username, displayName, role, null);
    }

    @Transactional
    public void upsert(String username, String displayName, String role, String email) {
        if (username == null || username.isBlank()) return;
        repository.upsert(username, displayName, role, email, Instant.now());
    }
}
