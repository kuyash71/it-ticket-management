package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.SLAClockState;
import jakarta.persistence.*;

import java.time.Duration;
import java.time.Instant;

/**
 * Per-ticket SLA timer (Doc §6). Accumulates elapsed seconds while {@code RUNNING};
 * pauses when the ticket waits on the customer and stops on resolution. The
 * {@link #deadline} is set at creation by {@code SLADeadlineService} from type+priority.
 */
@Entity
@Table(name = "sla_clock")
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

    private long deadline;

    public SLAClock() {
        this.state = SLAClockState.RUNNING;
        this.startedAt = Instant.now();
    }

    /** Accumulates time since last resume and switches to {@code PAUSED}. No-op if already paused or stopped. */
    public void pause() {
        if (this.state == SLAClockState.STOPPED) return;
        if (this.state == SLAClockState.PAUSED) return;
        this.pausedAt = Instant.now();
        this.elapsed += Duration.between(startedAt, pausedAt).getSeconds();
        this.state = SLAClockState.PAUSED;
    }

    /** Restarts ticking from {@code now}. No-op if already running or stopped. */
    public void resume() {
        if (this.state == SLAClockState.STOPPED) return;
        if (this.state == SLAClockState.RUNNING) return;
        this.startedAt = Instant.now();
        this.state = SLAClockState.RUNNING;
    }

    /** Finalises elapsed time and transitions to {@code STOPPED}. Terminal state. */
    public void stop() {
        if (this.state == SLAClockState.STOPPED) return;
        this.stoppedAt = Instant.now();
        if (this.state == SLAClockState.RUNNING) {
            this.elapsed += Duration.between(startedAt, stoppedAt).getSeconds();
        }
        this.state = SLAClockState.STOPPED;
    }

    public long getDeadline() { return deadline;}

    public void setDeadline(long deadline) {this.deadline = deadline;}

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
