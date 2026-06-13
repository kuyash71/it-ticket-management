package com.itsm.ticket.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

/** Persistence operations for {@link KnownAgent}. Custom UPSERT for tracker writes. */
public interface KnownAgentRepository extends JpaRepository<KnownAgent, String> {

    List<KnownAgent> findByRoleInOrderByDisplayNameAsc(List<String> roles);

    /** Doc §4.2 — Customer mail lookup için. Customer henüz login olmamışsa null. */
    @Query("SELECT a.email FROM KnownAgent a WHERE a.username = :username")
    java.util.Optional<String> findEmailByUsername(@Param("username") String username);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = """
            INSERT INTO known_agents (username, display_name, role, email, last_seen_at)
            VALUES (:username, :displayName, :role, :email, :lastSeenAt)
            ON CONFLICT (username) DO UPDATE
              SET display_name  = EXCLUDED.display_name,
                  role          = EXCLUDED.role,
                  email         = COALESCE(EXCLUDED.email, known_agents.email),
                  last_seen_at  = EXCLUDED.last_seen_at
            """, nativeQuery = true)
    void upsert(@Param("username") String username,
                @Param("displayName") String displayName,
                @Param("role") String role,
                @Param("email") String email,
                @Param("lastSeenAt") Instant lastSeenAt);
}
