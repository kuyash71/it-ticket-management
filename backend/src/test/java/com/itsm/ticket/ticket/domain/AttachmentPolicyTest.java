package com.itsm.ticket.ticket.domain;

import com.itsm.ticket.ticket.domain.enums.TicketEventVisibility;
import com.itsm.ticket.ticket.exception.AttachmentPolicyViolationException;
import org.junit.jupiter.api.Test;

import static com.itsm.ticket.ticket.domain.policy.AttachmentPolicy.MAX_SIZE_BYTES;
import static org.junit.jupiter.api.Assertions.*;

class AttachmentPolicyTest {

    private final Ticket ticket = new IncidentTicket("Test", "Test description");

    @Test
    void attach_validPdf_shouldSucceed() {
        Attachment a = ticket.attach("report.pdf", "application/pdf",
                1024 * 1024, "storage/key-1", TicketEventVisibility.EXTERNAL, "user-1");

        assertNotNull(a.getId());
        assertEquals("report.pdf", a.getFileName());
        assertEquals(1, ticket.getAttachments().size());
    }

    @Test
    void attach_validImage_shouldSucceed() {
        assertDoesNotThrow(() ->
                ticket.attach("screenshot.png", "image/png",
                        500_000, "storage/key-2", TicketEventVisibility.INTERNAL, "agent-1"));
    }

    @Test
    void attach_fileSizeExceedsLimit_shouldThrow() {
        long overLimit = MAX_SIZE_BYTES + 1;

        assertThrows(AttachmentPolicyViolationException.class, () ->
                ticket.attach("huge.pdf", "application/pdf",
                        overLimit, "storage/key-3", TicketEventVisibility.EXTERNAL, "user-1"));
    }

    @Test
    void attach_exactLimitSize_shouldSucceed() {
        assertDoesNotThrow(() ->
                ticket.attach("max.pdf", "application/pdf",
                        MAX_SIZE_BYTES, "storage/key-4", TicketEventVisibility.EXTERNAL, "user-1"));
    }

    @Test
    void attach_disallowedMimeType_shouldThrow() {
        assertThrows(AttachmentPolicyViolationException.class, () ->
                ticket.attach("virus.exe", "application/x-msdownload",
                        1024, "storage/key-5", TicketEventVisibility.EXTERNAL, "user-1"));
    }

    @Test
    void attach_zipFile_shouldThrow() {
        assertThrows(AttachmentPolicyViolationException.class, () ->
                ticket.attach("archive.zip", "application/zip",
                        1024, "storage/key-6", TicketEventVisibility.EXTERNAL, "user-1"));
    }

    @Test
    void attach_visibilityIsPreserved() {
        Attachment internal = ticket.attach("note.txt", "text/plain",
                100, "storage/key-7", TicketEventVisibility.INTERNAL, "agent-1");

        assertEquals(TicketEventVisibility.INTERNAL, internal.getVisibility());
    }
}
