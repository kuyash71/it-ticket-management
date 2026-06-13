package com.itsm.ticket.ticket.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Filesystem-backed attachment store (Doc §9). Files are written to
 * {@code {storage-path}/{ticketId}/{storageKey}}; resolve enforces traversal-safety.
 */
@Service
public class AttachmentStorageService {

    private static final Logger log = LoggerFactory.getLogger(AttachmentStorageService.class);

    private final Path root;

    public AttachmentStorageService(@Value("${itsm.attachments.storage-path}") String storagePath) {
        this.root = Paths.get(storagePath).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(root);
            log.info("Attachment storage initialized at {}", root);
        } catch (IOException e) {
            throw new IllegalStateException("Cannot create attachment storage directory: " + root, e);
        }
    }

    /**
     * Writes the upload under the ticket directory and returns its storage key
     * ({@code {ticketId}/{uuid}-{sanitizedName}}).
     *
     * @throws IllegalArgumentException if the file is empty or path traversal is detected
     */
    public String store(UUID ticketId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty");
        }
        try {
            Path ticketDir = root.resolve(ticketId.toString());
            Files.createDirectories(ticketDir);

            String safeName = sanitize(file.getOriginalFilename());
            String storageId = UUID.randomUUID().toString();
            String objectName = storageId + "-" + safeName;
            Path target = ticketDir.resolve(objectName).normalize();
            if (!target.startsWith(ticketDir)) {
                throw new IllegalArgumentException("Path traversal attempt rejected: " + safeName);
            }

            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return ticketId + "/" + objectName;
        } catch (IOException e) {
            throw new IllegalStateException("Failed to persist attachment", e);
        }
    }

    /**
     * Resolves a storage key back to a filesystem path.
     *
     * @throws IllegalArgumentException if the key escapes the storage root or the file is missing
     */
    public Path resolve(String storageKey) {
        Path candidate = root.resolve(storageKey).normalize();
        if (!candidate.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        if (!Files.exists(candidate)) {
            throw new IllegalArgumentException("Stored file not found: " + storageKey);
        }
        return candidate;
    }

    private String sanitize(String filename) {
        if (filename == null || filename.isBlank()) return "file";
        // Strip path separators and control characters; keep simple characters.
        String base = filename.replace("\\", "/").substring(filename.lastIndexOf('/') + 1);
        return base.replaceAll("[^A-Za-z0-9._-]", "_");
    }
}
