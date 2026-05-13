package com.itsm.ticket.users;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final KnownAgentRepository repository;

    public UserController(KnownAgentRepository repository) {
        this.repository = repository;
    }

    /**
     * Returns every agent/manager that has logged in. Used by the manager's
     * reassign dialog to pick a target user without needing the Keycloak admin API.
     */
    @GetMapping("/agents")
    @PreAuthorize("hasAnyRole('AGENT','MANAGER')")
    public List<AgentResponse> listAgents() {
        return repository.findByRoleInOrderByDisplayNameAsc(List.of("AGENT", "MANAGER")).stream()
                .map(a -> new AgentResponse(a.getUsername(), a.getDisplayName(), a.getRole()))
                .toList();
    }

    public record AgentResponse(String username, String displayName, String role) {}
}
