/**
 * AvatarUpload Component Tests
 *
 * Tests for the avatar upload component:
 * - Display states (no avatar, current avatar, preview)
 * - File validation
 * - Drag and drop
 * - Upload functionality
 * - Remove functionality
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AvatarUpload } from "@/components/settings/avatar-upload";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock UserAvatar component
vi.mock("@/components/users", () => ({
  UserAvatar: ({ src, name, size, className }: { src?: string | null; name?: string; size?: string; className?: string }) => (
    <div data-testid="user-avatar" data-src={src || ""} data-name={name} data-size={size} className={className}>
      Avatar
    </div>
  ),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL methods
const mockCreateObjectURL = vi.fn(() => "blob:mock-preview-url");
const mockRevokeObjectURL = vi.fn();
Object.assign(URL, {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

describe("AvatarUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ url: "https://example.com/new-avatar.jpg" }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Display States", () => {
    it("should render without crashing", () => {
      expect(() => render(<AvatarUpload />)).not.toThrow();
    });

    it("should show UserAvatar component", () => {
      render(<AvatarUpload />);
      expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
    });

    it("should pass currentAvatarUrl to UserAvatar", () => {
      render(<AvatarUpload currentAvatarUrl="https://example.com/avatar.jpg" />);
      const avatar = screen.getByTestId("user-avatar");
      expect(avatar.getAttribute("data-src")).toBe("https://example.com/avatar.jpg");
    });

    it("should pass userName to UserAvatar", () => {
      render(<AvatarUpload userName="John Doe" />);
      const avatar = screen.getByTestId("user-avatar");
      expect(avatar.getAttribute("data-name")).toBe("John Doe");
    });

    it("should show remove button when avatar exists", () => {
      render(<AvatarUpload currentAvatarUrl="https://example.com/avatar.jpg" />);
      expect(screen.getByTitle("Remove photo")).toBeInTheDocument();
    });

    it("should not show remove button when no avatar", () => {
      render(<AvatarUpload />);
      expect(screen.queryByTitle("Remove photo")).not.toBeInTheDocument();
    });
  });

  describe("Upload Drop Zone", () => {
    it("should show upload instructions", () => {
      render(<AvatarUpload />);
      expect(screen.getByText("Click or drag to upload")).toBeInTheDocument();
    });

    it("should show file type hint", () => {
      render(<AvatarUpload />);
      expect(screen.getByText("JPEG, PNG, WebP, or GIF up to 2MB")).toBeInTheDocument();
    });

    it("should have hidden file input", () => {
      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
      expect(input).toHaveClass("hidden");
    });

    it("should accept correct file types", () => {
      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]');
      expect(input?.getAttribute("accept")).toBe("image/jpeg,image/png,image/webp,image/gif");
    });
  });

  describe("File Validation", () => {
    it("should show error for invalid file type", async () => {
      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.txt", { type: "text/plain" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText("Please upload a JPEG, PNG, WebP, or GIF image")).toBeInTheDocument();
      });
    });

    it("should show error for file over 2MB", async () => {
      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      // Create a file larger than 2MB
      const largeContent = new Array(3 * 1024 * 1024).fill("a").join("");
      const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText("Image must be less than 2MB")).toBeInTheDocument();
      });
    });

    it("should accept valid JPEG file", async () => {
      const onUploadSuccess = vi.fn();
      const { container } = render(<AvatarUpload onUploadSuccess={onUploadSuccess} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.jpg", { type: "image/jpeg" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("Upload Functionality", () => {
    it("should call fetch with FormData on file select", async () => {
      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/user/avatar", expect.objectContaining({
          method: "POST",
        }));
      });
    });

    it("should create preview URL before upload", async () => {
      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    it("should show Uploading... while uploading", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));
      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText("Uploading...")).toBeInTheDocument();
      });
    });

    it("should call onUploadSuccess on successful upload", async () => {
      const onUploadSuccess = vi.fn();
      const { container } = render(<AvatarUpload onUploadSuccess={onUploadSuccess} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(onUploadSuccess).toHaveBeenCalledWith("https://example.com/new-avatar.jpg");
      });
    });

    it("should call onUploadError on upload failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Upload failed" }),
      });

      const onUploadError = vi.fn();
      const { container } = render(<AvatarUpload onUploadError={onUploadError} />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith("Upload failed");
      });
    });

    it("should show error message on upload failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Server error" }),
      });

      const { container } = render(<AvatarUpload />);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const file = new File(["test"], "test.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [file] });
      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText("Server error")).toBeInTheDocument();
      });
    });
  });

  describe("Remove Functionality", () => {
    it("should call DELETE endpoint when remove clicked", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      render(<AvatarUpload currentAvatarUrl="https://example.com/avatar.jpg" />);

      fireEvent.click(screen.getByTitle("Remove photo"));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/user/avatar", { method: "DELETE" });
      });
    });

    it("should call onRemove on successful removal", async () => {
      mockFetch.mockResolvedValue({ ok: true });
      const onRemove = vi.fn();
      render(<AvatarUpload currentAvatarUrl="https://example.com/avatar.jpg" onRemove={onRemove} />);

      fireEvent.click(screen.getByTitle("Remove photo"));

      await waitFor(() => {
        expect(onRemove).toHaveBeenCalled();
      });
    });

    it("should show error on removal failure", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Failed to remove avatar" }),
      });
      render(<AvatarUpload currentAvatarUrl="https://example.com/avatar.jpg" />);

      fireEvent.click(screen.getByTitle("Remove photo"));

      await waitFor(() => {
        expect(screen.getByText("Failed to remove avatar")).toBeInTheDocument();
      });
    });
  });

  describe("Drag and Drop", () => {
    it("should show drop message on drag over", () => {
      const { container } = render(<AvatarUpload />);
      const dropZone = container.querySelector(".border-dashed");

      fireEvent.dragOver(dropZone!);

      expect(screen.getByText("Drop your image")).toBeInTheDocument();
    });

    it("should revert to normal state on drag leave", () => {
      const { container } = render(<AvatarUpload />);
      const dropZone = container.querySelector(".border-dashed");

      fireEvent.dragOver(dropZone!);
      fireEvent.dragLeave(dropZone!);

      expect(screen.getByText("Click or drag to upload")).toBeInTheDocument();
    });

    it("should handle dropped file", async () => {
      const { container } = render(<AvatarUpload />);
      const dropZone = container.querySelector(".border-dashed");

      const file = new File(["test"], "test.png", { type: "image/png" });
      const dataTransfer = {
        files: [file],
      };

      fireEvent.drop(dropZone!, { dataTransfer });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("Styling", () => {
    it("should have dashed border on drop zone", () => {
      const { container } = render(<AvatarUpload />);
      const dropZone = container.querySelector(".border-dashed");
      expect(dropZone).toBeInTheDocument();
    });

    it("should have rounded corners on drop zone", () => {
      const { container } = render(<AvatarUpload />);
      const dropZone = container.querySelector(".rounded-xl");
      expect(dropZone).toBeInTheDocument();
    });

    it("should have red remove button", () => {
      const { container } = render(<AvatarUpload currentAvatarUrl="https://example.com/avatar.jpg" />);
      const removeButton = container.querySelector(".bg-red-500");
      expect(removeButton).toBeInTheDocument();
    });
  });
});
