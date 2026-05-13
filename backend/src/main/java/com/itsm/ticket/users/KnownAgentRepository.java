package com.itsm.ticket.users;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KnownAgentRepository extends JpaRepository<KnownAgent, String> {
    List<KnownAgent> findByRoleInOrderByDisplayNameAsc(List<String> roles);
}
