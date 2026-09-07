package com.jacksnorwood.jacks_backend.service;

import com.jacksnorwood.jacks_backend.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Guards the upload boundary.
 *
 * The traversal cases are the important ones: cvUrl arrives from an anonymous
 * visitor via the contact form, and before this class existed the value was
 * resolved against the uploads directory with no containment check at all, so a
 * crafted path caused the server to email an arbitrary file to the restaurant.
 */
class FileStorageServiceTest {

    private FileStorageService storage;
    private Path root;

    private static final byte[] PNG_MAGIC = { (byte) 0x89, 'P', 'N', 'G' };
    private static final byte[] PDF_MAGIC = { '%', 'P', 'D', 'F' };

    @BeforeEach
    void setUp(@TempDir Path tempDir) throws IOException {
        root = tempDir.resolve("uploads");
        storage = new FileStorageService();
        ReflectionTestUtils.setField(storage, "uploadDir", root.toString());
        ReflectionTestUtils.invokeMethod(storage, "init");
    }

    private MockMultipartFile file(String name, String contentType, byte[] magic) {
        byte[] content = new byte[magic.length + 8];
        System.arraycopy(magic, 0, content, 0, magic.length);
        return new MockMultipartFile("file", name, contentType, content);
    }

    // ── Happy paths ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("stores an image under a random name and returns its public URL")
    void storesImage() throws IOException {
        String url = storage.storeImage(file("photo.png", "image/png", PNG_MAGIC));

        assertThat(url).startsWith("/uploads/").endsWith(".png");
        // The original filename must not survive - it is attacker-controlled.
        assertThat(url).doesNotContain("photo");
        assertThat(storage.resolveExisting(url)).isNotNull().exists();
    }

    @Test
    @DisplayName("stores a CV document")
    void storesDocument() throws IOException {
        String url = storage.storeDocument(file("resume.pdf", "application/pdf", PDF_MAGIC));

        assertThat(url).endsWith(".pdf");
        assertThat(storage.resolveExisting(url)).isNotNull().exists();
    }

    // ── Type enforcement ─────────────────────────────────────────────────────

    @Test
    @DisplayName("rejects an executable renamed with an allowed extension")
    void rejectsContentTypeMismatch() {
        assertThatThrownBy(() -> storage.storeImage(
                new MockMultipartFile("file", "evil.png", "application/x-msdownload", PNG_MAGIC)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("does not match its extension");
    }

    @Test
    @DisplayName("rejects a file whose bytes do not match its claimed type")
    void rejectsMagicByteMismatch() {
        assertThatThrownBy(() -> storage.storeImage(
                new MockMultipartFile("file", "evil.png", "image/png", "MZ\u0090\u0000not a png".getBytes())))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("do not match a valid .png file");
    }

    @Test
    @DisplayName("the document endpoint does not accept images, and vice versa")
    void keepsImageAndDocumentTypesSeparate() {
        assertThatThrownBy(() -> storage.storeDocument(file("photo.png", "image/png", PNG_MAGIC)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Permitted document types");

        assertThatThrownBy(() -> storage.storeImage(file("resume.pdf", "application/pdf", PDF_MAGIC)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Permitted image types");
    }

    @Test
    @DisplayName("only the final extension is trusted")
    void usesFinalExtensionOnly() {
        assertThatThrownBy(() -> storage.storeImage(
                new MockMultipartFile("file", "photo.png.exe", "image/png", PNG_MAGIC)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("File type not allowed");
    }

    @Test
    @DisplayName("rejects an empty upload")
    void rejectsEmptyFile() {
        assertThatThrownBy(() -> storage.storeImage(
                new MockMultipartFile("file", "photo.png", "image/png", new byte[0])))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("No file was uploaded");
    }

    // ── Containment: the traversal regression ────────────────────────────────

    @ParameterizedTest
    @DisplayName("refuses to resolve anything outside the uploads directory")
    @ValueSource(strings = {
            "/uploads/../application.properties",
            "/uploads/../../.env",
            "/uploads/..\\..\\.env",
            "/uploads/sub/dir/file.pdf",
            "/uploads/",
            "/etc/passwd",
            "C:\\Windows\\win.ini",
            "http://evil.example.com/x.pdf",
            "application.properties",
    })
    void refusesPathsOutsideRoot(String hostile) {
        assertThat(storage.resolveExisting(hostile))
                .as("must not resolve: %s", hostile)
                .isNull();
    }

    @Test
    @DisplayName("a real file just outside the uploads directory is still unreachable")
    void cannotEscapeToASiblingFile() throws IOException {
        Path secret = root.getParent().resolve("secret.txt");
        Files.writeString(secret, "top secret");
        assertThat(secret).exists();

        assertThat(storage.resolveExisting("/uploads/../secret.txt")).isNull();
    }

    @Test
    @DisplayName("resolves null/blank/unknown names to null rather than throwing")
    void handlesMissingInput() {
        assertThat(storage.resolveExisting(null)).isNull();
        assertThat(storage.resolveExisting("")).isNull();
        assertThat(storage.resolveExisting("/uploads/does-not-exist.png")).isNull();
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteQuietly removes the backing file")
    void deleteQuietlyRemovesFile() throws IOException {
        String url = storage.storeImage(file("photo.png", "image/png", PNG_MAGIC));
        File onDisk = storage.resolveExisting(url);
        assertThat(onDisk).exists();

        storage.deleteQuietly(url);

        assertThat(onDisk).doesNotExist();
    }

    @Test
    @DisplayName("deleteQuietly never throws, and never deletes outside the root")
    void deleteQuietlyIsSafe() throws IOException {
        Path secret = root.getParent().resolve("secret.txt");
        Files.writeString(secret, "top secret");

        storage.deleteQuietly(null);
        storage.deleteQuietly("");
        storage.deleteQuietly("/uploads/missing.png");
        storage.deleteQuietly("/uploads/../secret.txt");

        assertThat(secret).as("a traversal path must not delete outside the root").exists();
    }
}
