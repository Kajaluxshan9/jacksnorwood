package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Single owner of everything under the uploads directory.
 *
 * Centralising this fixes three problems that were spread across the codebase:
 *   - user-supplied paths were resolved without containment checks (traversal),
 *   - uploads were validated on file extension alone,
 *   - deleting a record left its file on disk forever.
 */
@Service
@Slf4j
public class FileStorageService {

    /** Extension -> permitted MIME types. Both must agree for an upload to be accepted. */
    private static final Map<String, Set<String>> IMAGE_TYPES = Map.of(
            ".jpg",  Set.of("image/jpeg"),
            ".jpeg", Set.of("image/jpeg"),
            ".png",  Set.of("image/png"),
            ".gif",  Set.of("image/gif"),
            ".webp", Set.of("image/webp")
    );

    private static final Map<String, Set<String>> DOCUMENT_TYPES = Map.of(
            ".pdf",  Set.of("application/pdf"),
            ".doc",  Set.of("application/msword"),
            ".docx", Set.of("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    );

    /** Leading bytes that must be present for a given extension. */
    private static final Map<String, byte[]> MAGIC_BYTES = Map.of(
            ".jpg",  new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF },
            ".jpeg", new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF },
            ".png",  new byte[] { (byte) 0x89, 'P', 'N', 'G' },
            ".gif",  new byte[] { 'G', 'I', 'F', '8' },
            ".pdf",  new byte[] { '%', 'P', 'D', 'F' },
            ".docx", new byte[] { 'P', 'K', 0x03, 0x04 }
    );

    public static final String URL_PREFIX = "/uploads/";

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Path root;

    @PostConstruct
    void init() throws IOException {
        Path configured = Paths.get(uploadDir);
        root = configured.toAbsolutePath().normalize();
        Files.createDirectories(root);

        if (!configured.isAbsolute()) {
            log.warn("UPLOAD_DIR is a relative path ('{}'), resolved against the current working "
                    + "directory to {}. If the service is ever started from a different directory, "
                    + "new uploads go somewhere else and previously uploaded files stop resolving "
                    + "(images 404 and fall back to placeholders) even though the database still "
                    + "references them. Set UPLOAD_DIR to an absolute path in production.",
                    uploadDir, root);
        } else {
            log.info("Upload directory: {}", root);
        }

        if (!Files.isWritable(root)) {
            log.error("Upload directory {} is not writable - uploads will fail.", root);
        }
    }

    /** Stores an image, returning the public "/uploads/..." URL. */
    public String storeImage(MultipartFile file) throws IOException {
        return store(file, IMAGE_TYPES, "image");
    }

    /** Stores a CV/document, returning the public "/uploads/..." URL. */
    public String storeDocument(MultipartFile file) throws IOException {
        return store(file, DOCUMENT_TYPES, "document");
    }

    private String store(MultipartFile file, Map<String, Set<String>> allowed, String kind) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("No file was uploaded.");
        }

        String ext = extensionOf(file.getOriginalFilename());
        Set<String> permittedMimes = allowed.get(ext);
        if (permittedMimes == null) {
            throw new BadRequestException(
                    "File type not allowed. Permitted " + kind + " types: " + String.join(", ", allowed.keySet()));
        }

        // The browser-declared content type must line up with the extension.
        String contentType = file.getContentType() == null
                ? "" : file.getContentType().toLowerCase(Locale.ROOT).trim();
        if (!permittedMimes.contains(contentType)) {
            throw new BadRequestException("File content type '" + contentType + "' does not match its extension.");
        }

        // ...and so must the actual bytes, so a renamed file cannot slip through.
        byte[] expected = MAGIC_BYTES.get(ext);
        if (expected != null) {
            byte[] head = new byte[expected.length];
            try (var in = file.getInputStream()) {
                if (in.readNBytes(head, 0, expected.length) < expected.length
                        || !java.util.Arrays.equals(head, expected)) {
                    throw new BadRequestException("File contents do not match a valid " + ext + " file.");
                }
            }
        }

        String filename = UUID.randomUUID() + ext;
        Files.copy(file.getInputStream(), root.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
        return URL_PREFIX + filename;
    }

    private String extensionOf(String original) {
        if (original == null) return "";
        // Guard against "evil.pdf.exe" style names by only trusting the final segment.
        String name = Paths.get(original).getFileName().toString();
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot).toLowerCase(Locale.ROOT);
    }

    /**
     * Resolves a "/uploads/xyz.jpg" URL to a file on disk, or null if it does not
     * resolve to a real file directly inside the upload directory.
     *
     * This is the containment check: any path that escapes the root (via "..",
     * an absolute path, or a symlinked subdirectory) is rejected rather than read.
     */
    public File resolveExisting(String url) {
        if (url == null || url.isBlank()) return null;
        if (!url.startsWith(URL_PREFIX)) return null;

        String name = url.substring(URL_PREFIX.length());
        if (name.isBlank() || name.contains("/") || name.contains("\\")) return null;

        Path candidate = root.resolve(name).normalize();
        if (!candidate.getParent().equals(root)) return null;
        if (!Files.isRegularFile(candidate)) return null;

        return candidate.toFile();
    }

    /**
     * Best-effort removal of the file backing a "/uploads/..." URL.
     * Never throws — a failed cleanup must not fail the delete that triggered it.
     */
    public void deleteQuietly(String url) {
        try {
            File file = resolveExisting(url);
            if (file != null && file.delete()) {
                log.debug("Deleted upload {}", url);
            }
        } catch (Exception e) {
            log.warn("Could not delete upload {}: {}", url, e.getMessage());
        }
    }
}
