package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import jakarta.persistence.*;

import java.time.Duration;
import java.time.Instant;

@Entity
public class SLAClock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(nullable = false)
    private Long id;

    @Column(nullable = false)
    private long elapsed;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SLAClockState state;

    private Instant startedAt;
    private Instant pausedAt;
    private Instant stoppedAt;

    public SLAClock() {
        this.state = SLAClockState.RUNNING;
        this.startedAt = Instant.now();
    }

    public void pause() {
        this.pausedAt = Instant.now();
        if(this.state == SLAClockState.RUNNING) {
            this.elapsed += Duration.between(startedAt, pausedAt).getSeconds();
        }
        this.state = SLAClockState.PAUSED;
    }

    public void resume() {
        this.startedAt = Instant.now();
        this.state = SLAClockState.RUNNING;
    }

    public void stop() {
        this.stoppedAt = Instant.now();
        if(this.state == SLAClockState.RUNNING) {
            this.elapsed += Duration.between(startedAt, stoppedAt).getSeconds();
        }
        this.state = SLAClockState.STOPPED;
    }

    public Instant getStoppedAt() {
        return stoppedAt;
    }

    public Instant getPausedAt() {
        return pausedAt;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public SLAClockState getState() {
        return state;
    }

    public long getElapsed() {
        return elapsed;
    }
}
