package com.itsm.ticket.users;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class KnownAgentService {

    private final KnownAgentRepository repository;

    public KnownAgentService(KnownAgentRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void upsert(String username, String displayName, String role) {
        if (username == null || username.isBlank()) return;
        repository.upsert(username, displayName, role, Instant.now());
    }
}
