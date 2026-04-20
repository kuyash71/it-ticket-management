package com.itsm.ticket.ticket.domain.policy;

import com.itsm.ticket.ticket.domain.SLAClock;
import com.itsm.ticket.ticket.domain.enums.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;


public class TicketSLAClockTest {

    private SLAClock clock;

    @BeforeEach
    void setUp() {
        clock = new SLAClock();
    }

    @Test
    void newSLAClock_shouldRUNNING() {
        assertEquals(SLAClockState.RUNNING, clock.getState());
    }

    @Test
    void SLAClock_StopTest() {
        clock.stop();
        assertEquals(SLAClockState.STOPPED, clock.getState());
    }
    @Test
    void SLAClock_ResumeTest() {
        clock.resume();
        assertEquals(SLAClockState.RUNNING, clock.getState());
    }
    @Test
    void SLAClock_PauseTest() {
        clock.pause();
        assertEquals(SLAClockState.PAUSED, clock.getState());
    }



}
