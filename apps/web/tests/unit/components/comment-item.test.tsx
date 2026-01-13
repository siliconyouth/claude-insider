/**
 * CommentItem Component Tests
 *
 * Tests for the comment display component:
 * - Initial rendering
 * - User info display
 * - Voting (upvote/downvote)
 * - Reply toggle
 * - Delete functionality
 * - Date formatting
 * - Pending status
 * - Nested replies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CommentItem } from "@/components/interactions/comment-item";

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

// Mock auth hook
const mockShowSignIn = vi.fn();
vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({
    user: { id: "user-1", name: "Test User" },
    isAuthenticated: true,
    showSignIn: mockShowSignIn,
  }),
}));

// Mock toast hook
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastInfo = vi.fn();
vi.mock("@/components/toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    info: mockToastInfo,
  }),
}));

// Mock comment actions
const mockVoteComment = vi.fn();
const mockDeleteComment = vi.fn();
vi.mock("@/app/actions/comments", () => ({
  voteComment: (...args: unknown[]) => mockVoteComment(...args),
  deleteComment: (...args: unknown[]) => mockDeleteComment(...args),
}));

// Mock CommentForm
vi.mock("@/components/interactions/comment-form", () => ({
  CommentForm: ({ placeholder, onCancel }: { placeholder?: string; onCancel?: () => void }) => (
    <div data-testid="comment-form">
      <input placeholder={placeholder} />
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock UserAvatar and ProfileHoverCard
vi.mock("@/components/users", () => ({
  UserAvatar: ({ name, size }: { name?: string; size?: string }) => (
    <div data-testid="user-avatar" data-name={name} data-size={size}>Avatar</div>
  ),
  ProfileHoverCard: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("CommentItem", () => {
  const mockComment = {
    id: "comment-1",
    content: "This is a test comment",
    user_id: "user-2",
    user: {
      id: "user-2",
      name: "John Doe",
      username: "johndoe",
      image: "https://example.com/avatar.jpg",
    },
    created_at: new Date().toISOString(),
    upvotes: 5,
    downvotes: 2,
    user_vote: null as "up" | "down" | null,
    status: "approved" as const,
    is_edited: false,
    replies: [] as typeof mockComment[],
  };

  const defaultProps = {
    comment: mockComment,
    resourceType: "resource" as const,
    resourceId: "123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockVoteComment.mockResolvedValue({ success: true });
    mockDeleteComment.mockResolvedValue({ success: true });
    // Reset window.confirm
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => render(<CommentItem {...defaultProps} />)).not.toThrow();
    });

    it("should render comment content", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.getByText("This is a test comment")).toBeInTheDocument();
    });

    it("should render user name", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("should render user avatar", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
    });
  });

  describe("User Info", () => {
    it("should link to user profile", () => {
      render(<CommentItem {...defaultProps} />);
      const link = screen.getByText("John Doe").closest("a");
      expect(link?.getAttribute("href")).toBe("/users/johndoe");
    });

    it("should show 'Anonymous' when user has no name", () => {
      const commentWithoutName = {
        ...mockComment,
        user: { ...mockComment.user, name: null },
      };
      render(<CommentItem {...defaultProps} comment={commentWithoutName} />);
      expect(screen.getByText("Anonymous")).toBeInTheDocument();
    });

    it("should not link when user has no username", () => {
      const commentWithoutUsername = {
        ...mockComment,
        user: { ...mockComment.user, username: null },
      };
      render(<CommentItem {...defaultProps} comment={commentWithoutUsername} />);
      // Name should not be a link
      const nameElement = screen.getByText("John Doe");
      expect(nameElement.closest("a")).toBeNull();
    });
  });

  describe("Vote Display", () => {
    it("should show vote score", () => {
      render(<CommentItem {...defaultProps} />);
      // 5 upvotes - 2 downvotes = 3
      expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should render upvote button", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.getByLabelText("Upvote")).toBeInTheDocument();
    });

    it("should render downvote button", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.getByLabelText("Downvote")).toBeInTheDocument();
    });

    it("should have green color for positive score", () => {
      render(<CommentItem {...defaultProps} />);
      const score = screen.getByText("3");
      expect(score.className).toContain("text-green-600");
    });

    it("should have red color for negative score", () => {
      const negativeComment = {
        ...mockComment,
        upvotes: 1,
        downvotes: 5,
      };
      render(<CommentItem {...defaultProps} comment={negativeComment} />);
      const score = screen.getByText("-4");
      expect(score.className).toContain("text-red-600");
    });

    it("should have gray color for zero score", () => {
      const zeroComment = {
        ...mockComment,
        upvotes: 2,
        downvotes: 2,
      };
      render(<CommentItem {...defaultProps} comment={zeroComment} />);
      const score = screen.getByText("0");
      expect(score.className).toContain("text-gray-400");
    });
  });

  describe("Voting", () => {
    it("should call voteComment when upvote clicked", async () => {
      render(<CommentItem {...defaultProps} />);
      fireEvent.click(screen.getByLabelText("Upvote"));

      await waitFor(() => {
        expect(mockVoteComment).toHaveBeenCalledWith("comment-1", "up");
      });
    });

    it("should call voteComment when downvote clicked", async () => {
      render(<CommentItem {...defaultProps} />);
      fireEvent.click(screen.getByLabelText("Downvote"));

      await waitFor(() => {
        expect(mockVoteComment).toHaveBeenCalledWith("comment-1", "down");
      });
    });

    it("should highlight upvote button when user has upvoted", () => {
      const upvotedComment = { ...mockComment, user_vote: "up" as const };
      render(<CommentItem {...defaultProps} comment={upvotedComment} />);
      const upvoteBtn = screen.getByLabelText("Upvote");
      expect(upvoteBtn.className).toContain("text-green-600");
    });

    it("should highlight downvote button when user has downvoted", () => {
      const downvotedComment = { ...mockComment, user_vote: "down" as const };
      render(<CommentItem {...defaultProps} comment={downvotedComment} />);
      const downvoteBtn = screen.getByLabelText("Downvote");
      expect(downvoteBtn.className).toContain("text-red-600");
    });

    it("should show error toast on vote failure", async () => {
      mockVoteComment.mockResolvedValue({ error: "Vote failed" });

      render(<CommentItem {...defaultProps} />);
      fireEvent.click(screen.getByLabelText("Upvote"));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Vote failed");
      });
    });
  });

  describe("Reply Button", () => {
    it("should show reply button for top-level comments", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.getByText("Reply")).toBeInTheDocument();
    });

    it("should hide reply button for replies", () => {
      render(<CommentItem {...defaultProps} isReply={true} />);
      expect(screen.queryByText("Reply")).not.toBeInTheDocument();
    });

    it("should show reply form when reply button clicked", () => {
      render(<CommentItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Reply"));
      expect(screen.getByTestId("comment-form")).toBeInTheDocument();
    });

    it("should hide reply form when clicked again", () => {
      render(<CommentItem {...defaultProps} />);
      fireEvent.click(screen.getByText("Reply"));
      expect(screen.getByTestId("comment-form")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Reply"));
      expect(screen.queryByTestId("comment-form")).not.toBeInTheDocument();
    });
  });

  describe("Delete Button", () => {
    it("should show delete button for comment owner", () => {
      const ownComment = { ...mockComment, user_id: "user-1" };
      render(<CommentItem {...defaultProps} comment={ownComment} />);
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("should hide delete button for non-owners", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.queryByText("Delete")).not.toBeInTheDocument();
    });

    it("should call deleteComment when confirmed", async () => {
      const ownComment = { ...mockComment, user_id: "user-1" };
      render(<CommentItem {...defaultProps} comment={ownComment} />);

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(mockDeleteComment).toHaveBeenCalledWith("comment-1");
      });
    });

    it("should not delete when cancelled", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      const ownComment = { ...mockComment, user_id: "user-1" };
      render(<CommentItem {...defaultProps} comment={ownComment} />);

      fireEvent.click(screen.getByText("Delete"));

      expect(mockDeleteComment).not.toHaveBeenCalled();
    });

    it("should show success toast after delete", async () => {
      const ownComment = { ...mockComment, user_id: "user-1" };
      render(<CommentItem {...defaultProps} comment={ownComment} />);

      fireEvent.click(screen.getByText("Delete"));

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Comment deleted");
      });
    });
  });

  describe("Date Formatting", () => {
    it("should show 'just now' for recent comments", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it("should show minutes ago", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const oldComment = { ...mockComment, created_at: fiveMinutesAgo };
      render(<CommentItem {...defaultProps} comment={oldComment} />);
      expect(screen.getByText("5m ago")).toBeInTheDocument();
    });

    it("should show hours ago", () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      const oldComment = { ...mockComment, created_at: threeHoursAgo };
      render(<CommentItem {...defaultProps} comment={oldComment} />);
      expect(screen.getByText("3h ago")).toBeInTheDocument();
    });

    it("should show days ago", () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
      const oldComment = { ...mockComment, created_at: twoDaysAgo };
      render(<CommentItem {...defaultProps} comment={oldComment} />);
      expect(screen.getByText("2d ago")).toBeInTheDocument();
    });
  });

  describe("Edited Status", () => {
    it("should show (edited) when comment is edited", () => {
      const editedComment = { ...mockComment, is_edited: true };
      render(<CommentItem {...defaultProps} comment={editedComment} />);
      expect(screen.getByText("(edited)")).toBeInTheDocument();
    });

    it("should not show (edited) for unedited comments", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.queryByText("(edited)")).not.toBeInTheDocument();
    });
  });

  describe("Pending Status", () => {
    it("should show pending badge when comment is pending", () => {
      const pendingComment = { ...mockComment, status: "pending" as const };
      render(<CommentItem {...defaultProps} comment={pendingComment} />);
      expect(screen.getByText("Pending review")).toBeInTheDocument();
    });

    it("should not show pending badge for approved comments", () => {
      render(<CommentItem {...defaultProps} />);
      expect(screen.queryByText("Pending review")).not.toBeInTheDocument();
    });
  });

  describe("Reply Styling", () => {
    it("should have left border styling for replies", () => {
      const { container } = render(<CommentItem {...defaultProps} isReply={true} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("ml-8");
      expect(wrapper.className).toContain("pl-4");
      expect(wrapper.className).toContain("border-l-2");
    });

    it("should not have left border for top-level comments", () => {
      const { container } = render(<CommentItem {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).not.toContain("ml-8");
      expect(wrapper.className).not.toContain("border-l-2");
    });
  });

  describe("Nested Replies", () => {
    it("should render nested replies", () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [
          {
            ...mockComment,
            id: "reply-1",
            content: "This is a reply",
            user: { ...mockComment.user, name: "Reply User" },
          },
        ],
      };
      render(<CommentItem {...defaultProps} comment={commentWithReplies} />);
      expect(screen.getByText("This is a reply")).toBeInTheDocument();
    });
  });
});
