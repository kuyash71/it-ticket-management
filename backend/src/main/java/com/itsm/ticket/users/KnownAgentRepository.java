package com.itsm.ticket.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface KnownAgentRepository extends JpaRepository<KnownAgent, String> {

    List<KnownAgent> findByRoleInOrderByDisplayNameAsc(List<String> roles);

    @Modifying
    @Query(value = """
            INSERT INTO known_agents (username, display_name, role, last_seen_at)
            VALUES (:username, :displayName, :role, :lastSeenAt)
            ON CONFLICT (username) DO UPDATE
              SET display_name  = EXCLUDED.display_name,
                  role          = EXCLUDED.role,
                  last_seen_at  = EXCLUDED.last_seen_at
            """, nativeQuery = true)
    void upsert(@Param("username") String username,
                @Param("displayName") String displayName,
                @Param("role") String role,
                @Param("lastSeenAt") Instant lastSeenAt);
}
