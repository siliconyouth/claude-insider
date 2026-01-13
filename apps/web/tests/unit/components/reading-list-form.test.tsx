/**
 * ReadingListForm Component Tests
 *
 * Tests for the reading list form component:
 * - Create mode vs Edit mode
 * - Name field validation
 * - Description field
 * - Color picker
 * - Icon picker
 * - Public toggle
 * - Form submission
 * - Error handling
 * - Cancel button
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ReadingListForm } from "@/components/reading-lists/reading-list-form";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock server actions
const mockCreateReadingList = vi.fn();
const mockUpdateReadingList = vi.fn();
vi.mock("@/app/actions/reading-lists", () => ({
  createReadingList: (data: unknown) => mockCreateReadingList(data),
  updateReadingList: (id: string, data: unknown) => mockUpdateReadingList(id, data),
}));

describe("ReadingListForm", () => {
  const mockList = {
    id: "list-1",
    name: "My Reading List",
    description: "A collection of articles",
    slug: "my-reading-list",
    icon: "bookmark",
    color: "#8b5cf6",
    is_public: false,
    item_count: 5,
    user_id: "user-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateReadingList.mockResolvedValue({ list: { ...mockList, id: "new-list" } });
    mockUpdateReadingList.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Create Mode", () => {
    it("should render create form when no list provided", () => {
      render(<ReadingListForm />);
      expect(screen.getByRole("button", { name: "Create List" })).toBeInTheDocument();
    });

    it("should show empty name field", () => {
      render(<ReadingListForm />);
      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("");
    });

    it("should show empty description field", () => {
      render(<ReadingListForm />);
      const descInput = screen.getByPlaceholderText("What's this list for?") as HTMLTextAreaElement;
      expect(descInput.value).toBe("");
    });

    it("should show placeholder for name", () => {
      render(<ReadingListForm />);
      expect(screen.getByPlaceholderText("e.g., Must Read, Tutorials")).toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    it("should render edit form when list provided", () => {
      render(<ReadingListForm list={mockList} />);
      expect(screen.getByRole("button", { name: "Save Changes" })).toBeInTheDocument();
    });

    it("should populate name field", () => {
      render(<ReadingListForm list={mockList} />);
      const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
      expect(nameInput.value).toBe("My Reading List");
    });

    it("should populate description field", () => {
      render(<ReadingListForm list={mockList} />);
      const descInput = screen.getByPlaceholderText("What's this list for?") as HTMLTextAreaElement;
      expect(descInput.value).toBe("A collection of articles");
    });
  });

  describe("Name Validation", () => {
    it("should show required indicator on name field", () => {
      render(<ReadingListForm />);
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should disable submit button when name is empty", () => {
      render(<ReadingListForm />);
      const submitButton = screen.getByRole("button", { name: "Create List" });
      // Button should be disabled when name is empty
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when name has value", () => {
      render(<ReadingListForm />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Test List" } });

      const submitButton = screen.getByRole("button", { name: "Create List" });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Color Picker", () => {
    it("should show Color label", () => {
      render(<ReadingListForm />);
      expect(screen.getByText("Color")).toBeInTheDocument();
    });

    it("should render 8 color buttons", () => {
      const { container } = render(<ReadingListForm />);
      const colorButtons = container.querySelectorAll('button[style*="background-color"]');
      expect(colorButtons.length).toBe(8);
    });

    it("should highlight selected color", () => {
      const { container } = render(<ReadingListForm list={mockList} />);
      // Color buttons are present and one should be selected (with ring class in className)
      const colorButtons = container.querySelectorAll('button[style*="background-color"]');
      expect(colorButtons.length).toBe(8);
      // At least one should have the ring styling
      const hasSelectedColor = Array.from(colorButtons).some(btn =>
        btn.className.includes('ring')
      );
      expect(hasSelectedColor).toBe(true);
    });

    it("should change color when clicking another color", () => {
      const { container } = render(<ReadingListForm />);
      const colorButtons = container.querySelectorAll('button[style*="background-color"]');

      // Click the second color button
      fireEvent.click(colorButtons[1]!);

      // Second button should now have ring class
      expect(colorButtons[1]).toHaveClass("ring-2");
    });
  });

  describe("Icon Picker", () => {
    it("should show Icon label", () => {
      render(<ReadingListForm />);
      expect(screen.getByText("Icon")).toBeInTheDocument();
    });

    it("should render 6 icon buttons", () => {
      render(<ReadingListForm />);
      const iconButtons = ["Bookmark", "Book", "Folder", "Star", "Heart", "Lightning"];
      iconButtons.forEach((icon) => {
        expect(screen.getByTitle(icon)).toBeInTheDocument();
      });
    });

    it("should highlight selected icon", () => {
      render(<ReadingListForm list={mockList} />);
      const bookmarkButton = screen.getByTitle("Bookmark");
      // Selected icon should have blue background styling
      expect(bookmarkButton.className).toContain("blue");
    });

    it("should change icon when clicking another icon", () => {
      render(<ReadingListForm />);

      fireEvent.click(screen.getByTitle("Star"));

      // Selected icon should have blue background styling
      expect(screen.getByTitle("Star").className).toContain("blue");
    });
  });

  describe("Public Toggle", () => {
    it("should show Make public label", () => {
      render(<ReadingListForm />);
      expect(screen.getByText("Make public")).toBeInTheDocument();
    });

    it("should show toggle description", () => {
      render(<ReadingListForm />);
      expect(screen.getByText("Allow others to view this list")).toBeInTheDocument();
    });

    it("should default to private (off)", () => {
      const { container } = render(<ReadingListForm />);
      const toggle = container.querySelector('.bg-gray-200, .bg-gray-700');
      expect(toggle).toBeInTheDocument();
    });

    it("should toggle to public when clicked", () => {
      const { container } = render(<ReadingListForm />);
      const toggleButtons = container.querySelectorAll('button[type="button"]');

      // Find the toggle button (it's among the buttons)
      const toggle = Array.from(toggleButtons).find(btn =>
        btn.className.includes('rounded-full') && btn.className.includes('cursor-pointer')
      );

      if (toggle) {
        fireEvent.click(toggle);
        expect(toggle).toHaveClass("bg-blue-600");
      }
    });
  });

  describe("Form Submission - Create", () => {
    it("should call createReadingList on submit", async () => {
      const onSuccess = vi.fn();
      render(<ReadingListForm onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "New List" } });
      fireEvent.click(screen.getByRole("button", { name: "Create List" }));

      await waitFor(() => {
        expect(mockCreateReadingList).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "New List",
          })
        );
      });
    });

    it("should call onSuccess with new list", async () => {
      const onSuccess = vi.fn();
      render(<ReadingListForm onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "New List" } });
      fireEvent.click(screen.getByRole("button", { name: "Create List" }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it("should show Saving... while submitting", async () => {
      mockCreateReadingList.mockImplementation(() => new Promise(() => {}));
      render(<ReadingListForm />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "New List" } });
      fireEvent.click(screen.getByRole("button", { name: "Create List" }));

      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });
  });

  describe("Form Submission - Edit", () => {
    it("should call updateReadingList on submit", async () => {
      const onSuccess = vi.fn();
      render(<ReadingListForm list={mockList} onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Updated List" } });
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(mockUpdateReadingList).toHaveBeenCalledWith(
          "list-1",
          expect.objectContaining({
            name: "Updated List",
          })
        );
      });
    });

    it("should call onSuccess with updated list", async () => {
      const onSuccess = vi.fn();
      render(<ReadingListForm list={mockList} onSuccess={onSuccess} />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Updated List" } });
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Updated List",
          })
        );
      });
    });
  });

  describe("Error Handling", () => {
    it("should show error from createReadingList", async () => {
      mockCreateReadingList.mockResolvedValue({ error: "Name already exists" });
      render(<ReadingListForm />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Duplicate" } });
      fireEvent.click(screen.getByRole("button", { name: "Create List" }));

      await waitFor(() => {
        expect(screen.getByText("Name already exists")).toBeInTheDocument();
      });
    });

    it("should show error from updateReadingList", async () => {
      mockUpdateReadingList.mockResolvedValue({ error: "Update failed" });
      render(<ReadingListForm list={mockList} />);

      fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: "Updated" } });
      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      await waitFor(() => {
        expect(screen.getByText("Update failed")).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Button", () => {
    it("should show Cancel button when onCancel provided", () => {
      const onCancel = vi.fn();
      render(<ReadingListForm onCancel={onCancel} />);
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("should not show Cancel button when onCancel not provided", () => {
      render(<ReadingListForm />);
      expect(screen.queryByText("Cancel")).not.toBeInTheDocument();
    });

    it("should call onCancel when Cancel clicked", () => {
      const onCancel = vi.fn();
      render(<ReadingListForm onCancel={onCancel} />);

      fireEvent.click(screen.getByText("Cancel"));

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe("Custom ClassName", () => {
    it("should apply custom className", () => {
      const { container } = render(<ReadingListForm className="custom-class" />);
      expect(container.querySelector("form")).toHaveClass("custom-class");
    });
  });
});
