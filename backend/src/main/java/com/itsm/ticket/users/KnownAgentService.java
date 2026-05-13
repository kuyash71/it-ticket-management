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
        Instant now = Instant.now();
        repository.findById(username).ifPresentOrElse(
                existing -> {
                    existing.touch(displayName, role, now);
                    repository.save(existing);
                },
                () -> repository.save(new KnownAgent(username, displayName, role, now)));
    }
}
