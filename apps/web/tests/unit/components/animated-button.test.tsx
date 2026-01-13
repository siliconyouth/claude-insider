/**
 * AnimatedButton Component Tests
 *
 * Tests for the animated button components with micro-interactions:
 * - AnimatedButton: Main button with variants, ripple, press animation, loading
 * - IconButton: Square icon-only button
 * - FloatingActionButton: Fixed position FAB
 * - ToggleButton: Toggle switch with pressed/unpressed states
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import {
  AnimatedButton,
  IconButton,
  FloatingActionButton,
  ToggleButton,
} from "@/components/animated-button";

// Mock animation hooks
const mockPressStyle = { transform: "scale(1)" };
const mockPressHandlers = {
  onMouseDown: vi.fn(),
  onMouseUp: vi.fn(),
  onMouseLeave: vi.fn(),
};
const mockUsePress = vi.fn().mockReturnValue({
  pressStyle: mockPressStyle,
  handlers: mockPressHandlers,
});

const mockCreateRipple = vi.fn();
const mockRippleContainer = () => <div data-testid="ripple-container" />;
const mockUseRipple = vi.fn().mockReturnValue({
  createRipple: mockCreateRipple,
  RippleContainer: mockRippleContainer,
});

const mockUseReducedMotion = vi.fn().mockReturnValue(false);

vi.mock("@/hooks/use-animations", () => ({
  usePress: (...args: unknown[]) => mockUsePress(...args),
  useRipple: (...args: unknown[]) => mockUseRipple(...args),
  useReducedMotion: () => mockUseReducedMotion(),
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("AnimatedButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render button with children", () => {
      render(<AnimatedButton>Click Me</AnimatedButton>);

      expect(screen.getByRole("button", { name: "Click Me" })).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      render(<AnimatedButton className="my-button">Test</AnimatedButton>);

      expect(screen.getByRole("button")).toHaveClass("my-button");
    });

    it("should have base styling classes", () => {
      render(<AnimatedButton>Test</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("relative");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
      expect(button).toHaveClass("rounded-lg");
      expect(button).toHaveClass("font-medium");
    });

    it("should pass additional props", () => {
      render(
        <AnimatedButton type="submit" data-testid="submit-btn">
          Submit
        </AnimatedButton>
      );

      const button = screen.getByTestId("submit-btn");
      expect(button).toHaveAttribute("type", "submit");
    });
  });

  describe("Variants", () => {
    it("should apply primary variant by default", () => {
      render(<AnimatedButton>Primary</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-gradient-to-r");
      expect(button).toHaveClass("from-violet-600");
      expect(button).toHaveClass("text-white");
    });

    it("should apply secondary variant", () => {
      render(<AnimatedButton variant="secondary">Secondary</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-gray-100");
      expect(button).toHaveClass("text-gray-900");
    });

    it("should apply ghost variant", () => {
      render(<AnimatedButton variant="ghost">Ghost</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-transparent");
      expect(button).toHaveClass("text-gray-700");
    });

    it("should apply danger variant", () => {
      render(<AnimatedButton variant="danger">Danger</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-red-500");
      expect(button).toHaveClass("text-white");
    });

    it("should apply success variant", () => {
      render(<AnimatedButton variant="success">Success</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-emerald-500");
      expect(button).toHaveClass("text-white");
    });
  });

  describe("Sizes", () => {
    it("should apply medium size by default", () => {
      render(<AnimatedButton>Medium</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
      expect(button).toHaveClass("text-sm");
    });

    it("should apply small size", () => {
      render(<AnimatedButton size="sm">Small</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-3");
      expect(button).toHaveClass("py-1.5");
    });

    it("should apply large size", () => {
      render(<AnimatedButton size="lg">Large</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-6");
      expect(button).toHaveClass("py-3");
      expect(button).toHaveClass("text-base");
    });
  });

  describe("Icons", () => {
    it("should render left icon", () => {
      render(
        <AnimatedButton leftIcon={<span data-testid="left-icon">←</span>}>
          Back
        </AnimatedButton>
      );

      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    });

    it("should render right icon", () => {
      render(
        <AnimatedButton rightIcon={<span data-testid="right-icon">→</span>}>
          Next
        </AnimatedButton>
      );

      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });

    it("should render both icons", () => {
      render(
        <AnimatedButton
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Both
        </AnimatedButton>
      );

      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });

    it("should not render icons when loading", () => {
      render(
        <AnimatedButton
          isLoading
          leftIcon={<span data-testid="left-icon">←</span>}
          rightIcon={<span data-testid="right-icon">→</span>}
        >
          Loading
        </AnimatedButton>
      );

      expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
      expect(screen.queryByTestId("right-icon")).not.toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("should show loading spinner when isLoading is true", () => {
      const { container } = render(
        <AnimatedButton isLoading>Loading</AnimatedButton>
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should hide text when loading", () => {
      render(<AnimatedButton isLoading>Loading</AnimatedButton>);

      const textSpan = screen.getByText("Loading");
      expect(textSpan).toHaveClass("opacity-0");
    });

    it("should disable button when loading", () => {
      render(<AnimatedButton isLoading>Loading</AnimatedButton>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should not show spinner when not loading", () => {
      const { container } = render(<AnimatedButton>Not Loading</AnimatedButton>);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe("Full Width", () => {
    it("should apply full width when fullWidth is true", () => {
      render(<AnimatedButton fullWidth>Full Width</AnimatedButton>);

      expect(screen.getByRole("button")).toHaveClass("w-full");
    });

    it("should not be full width by default", () => {
      render(<AnimatedButton>Default</AnimatedButton>);

      expect(screen.getByRole("button")).not.toHaveClass("w-full");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<AnimatedButton disabled>Disabled</AnimatedButton>);

      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should apply disabled styles", () => {
      render(<AnimatedButton disabled>Disabled</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:opacity-50");
      expect(button).toHaveClass("disabled:cursor-not-allowed");
    });

    it("should disable press animation when disabled", () => {
      render(<AnimatedButton disabled>Disabled</AnimatedButton>);

      expect(mockUsePress).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true })
      );
    });

    it("should disable ripple when disabled", () => {
      render(<AnimatedButton disabled>Disabled</AnimatedButton>);

      expect(mockUseRipple).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true })
      );
    });
  });

  describe("Ripple Effect", () => {
    it("should render ripple container by default", () => {
      render(<AnimatedButton>Ripple</AnimatedButton>);

      expect(screen.getByTestId("ripple-container")).toBeInTheDocument();
    });

    it("should not render ripple container when ripple is false", () => {
      render(<AnimatedButton ripple={false}>No Ripple</AnimatedButton>);

      expect(screen.queryByTestId("ripple-container")).not.toBeInTheDocument();
    });

    it("should create ripple on click", () => {
      render(<AnimatedButton>Click</AnimatedButton>);

      fireEvent.click(screen.getByRole("button"));

      expect(mockCreateRipple).toHaveBeenCalled();
    });

    it("should use light ripple color for primary variant", () => {
      render(<AnimatedButton variant="primary">Primary</AnimatedButton>);

      expect(mockUseRipple).toHaveBeenCalledWith(
        expect.objectContaining({ color: "rgba(255, 255, 255, 0.3)" })
      );
    });

    it("should use dark ripple color for secondary variant", () => {
      render(<AnimatedButton variant="secondary">Secondary</AnimatedButton>);

      expect(mockUseRipple).toHaveBeenCalledWith(
        expect.objectContaining({ color: "rgba(0, 0, 0, 0.1)" })
      );
    });
  });

  describe("Press Animation", () => {
    it("should apply press style by default", () => {
      render(<AnimatedButton>Press</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ transform: "scale(1)" });
    });

    it("should not apply press style when pressAnimation is false", () => {
      render(<AnimatedButton pressAnimation={false}>No Press</AnimatedButton>);

      // Button should not have the pressStyle applied
      const button = screen.getByRole("button");
      expect(button.style.transform).toBeFalsy();
    });

    it("should disable press when pressAnimation is false", () => {
      render(<AnimatedButton pressAnimation={false}>No Press</AnimatedButton>);

      expect(mockUsePress).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true })
      );
    });
  });

  describe("Reduced Motion", () => {
    it("should disable ripple when prefers reduced motion", () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(<AnimatedButton>Reduced Motion</AnimatedButton>);

      expect(mockUseRipple).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true })
      );
    });

    it("should disable press animation when prefers reduced motion", () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(<AnimatedButton>Reduced Motion</AnimatedButton>);

      expect(mockUsePress).toHaveBeenCalledWith(
        expect.objectContaining({ disabled: true })
      );
    });

    it("should not render ripple container when prefers reduced motion", () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(<AnimatedButton>Reduced Motion</AnimatedButton>);

      expect(screen.queryByTestId("ripple-container")).not.toBeInTheDocument();
    });
  });

  describe("Click Handler", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(<AnimatedButton onClick={handleClick}>Click</AnimatedButton>);

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should create ripple before calling onClick", () => {
      const handleClick = vi.fn();
      render(<AnimatedButton onClick={handleClick}>Click</AnimatedButton>);

      fireEvent.click(screen.getByRole("button"));

      expect(mockCreateRipple).toHaveBeenCalled();
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(<AnimatedButton ref={ref}>Ref Test</AnimatedButton>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe("Focus States", () => {
    it("should have focus visible ring classes", () => {
      render(<AnimatedButton>Focus</AnimatedButton>);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:ring-2");
      expect(button).toHaveClass("focus-visible:ring-blue-500");
    });
  });
});

describe("IconButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render button with icon", () => {
      render(
        <IconButton
          icon={<span data-testid="icon">✓</span>}
          aria-label="Confirm"
        />
      );

      expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("should require aria-label", () => {
      render(
        <IconButton icon={<span>✓</span>} aria-label="Confirm action" />
      );

      expect(screen.getByRole("button")).toHaveAttribute(
        "aria-label",
        "Confirm action"
      );
    });

    it("should have circular shape", () => {
      render(<IconButton icon={<span>✓</span>} aria-label="Test" />);

      expect(screen.getByRole("button")).toHaveClass("rounded-full");
    });
  });

  describe("Variants", () => {
    it("should apply ghost variant by default", () => {
      render(<IconButton icon={<span>✓</span>} aria-label="Test" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-transparent");
    });

    it("should apply primary variant", () => {
      render(
        <IconButton
          icon={<span>✓</span>}
          aria-label="Test"
          variant="primary"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-gradient-to-r");
    });

    it("should apply danger variant", () => {
      render(
        <IconButton icon={<span>✓</span>} aria-label="Test" variant="danger" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-red-500");
    });
  });

  describe("Sizes", () => {
    it("should apply medium size by default", () => {
      render(<IconButton icon={<span>✓</span>} aria-label="Test" />);

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-10");
      expect(button).toHaveClass("h-10");
    });

    it("should apply small size", () => {
      render(
        <IconButton icon={<span>✓</span>} aria-label="Test" size="sm" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-8");
      expect(button).toHaveClass("h-8");
    });

    it("should apply large size", () => {
      render(
        <IconButton icon={<span>✓</span>} aria-label="Test" size="lg" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-12");
      expect(button).toHaveClass("h-12");
    });
  });

  describe("Ripple Effect", () => {
    it("should render ripple container by default", () => {
      render(<IconButton icon={<span>✓</span>} aria-label="Test" />);

      expect(screen.getByTestId("ripple-container")).toBeInTheDocument();
    });

    it("should not render ripple when ripple is false", () => {
      render(
        <IconButton icon={<span>✓</span>} aria-label="Test" ripple={false} />
      );

      expect(screen.queryByTestId("ripple-container")).not.toBeInTheDocument();
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(
        <IconButton icon={<span>✓</span>} aria-label="Test" disabled />
      );

      expect(screen.getByRole("button")).toBeDisabled();
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <IconButton ref={ref} icon={<span>✓</span>} aria-label="Test" />
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});

describe("FloatingActionButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render FAB with icon", () => {
      render(
        <FloatingActionButton
          icon={<span data-testid="fab-icon">+</span>}
          aria-label="Add item"
        />
      );

      expect(screen.getByRole("button", { name: "Add item" })).toBeInTheDocument();
      expect(screen.getByTestId("fab-icon")).toBeInTheDocument();
    });

    it("should have primary gradient styling", () => {
      render(
        <FloatingActionButton icon={<span>+</span>} aria-label="Add" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-gradient-to-r");
      expect(button).toHaveClass("from-violet-600");
      expect(button).toHaveClass("text-white");
    });

    it("should have shadow styling", () => {
      render(
        <FloatingActionButton icon={<span>+</span>} aria-label="Add" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("shadow-xl");
    });

    it("should have high z-index", () => {
      render(
        <FloatingActionButton icon={<span>+</span>} aria-label="Add" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("z-50");
    });
  });

  describe("Positioning", () => {
    it("should position bottom-right by default", () => {
      render(
        <FloatingActionButton icon={<span>+</span>} aria-label="Add" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("fixed");
      expect(button).toHaveClass("bottom-6");
      expect(button).toHaveClass("right-6");
    });

    it("should position bottom-left", () => {
      render(
        <FloatingActionButton
          icon={<span>+</span>}
          aria-label="Add"
          position="bottom-left"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("left-6");
    });

    it("should position bottom-center", () => {
      render(
        <FloatingActionButton
          icon={<span>+</span>}
          aria-label="Add"
          position="bottom-center"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("left-1/2");
      expect(button).toHaveClass("-translate-x-1/2");
    });
  });

  describe("Extended State", () => {
    it("should show only icon when not extended", () => {
      render(
        <FloatingActionButton
          icon={<span data-testid="icon">+</span>}
          aria-label="Add"
          label="Add Item"
        />
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.queryByText("Add Item")).not.toBeInTheDocument();
    });

    it("should show icon and label when extended", () => {
      render(
        <FloatingActionButton
          icon={<span data-testid="icon">+</span>}
          aria-label="Add"
          extended
          label="Add Item"
        />
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("Add Item")).toBeInTheDocument();
    });

    it("should have different sizing when extended", () => {
      render(
        <FloatingActionButton
          icon={<span>+</span>}
          aria-label="Add"
          extended
          label="Add Item"
        />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("px-6");
      expect(button).toHaveClass("py-4");
      expect(button).not.toHaveClass("w-14");
    });

    it("should be circular when not extended", () => {
      render(
        <FloatingActionButton icon={<span>+</span>} aria-label="Add" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("w-14");
      expect(button).toHaveClass("h-14");
    });
  });

  describe("Ripple Effect", () => {
    it("should always render ripple container", () => {
      render(
        <FloatingActionButton icon={<span>+</span>} aria-label="Add" />
      );

      expect(screen.getByTestId("ripple-container")).toBeInTheDocument();
    });

    it("should create ripple on click", () => {
      render(
        <FloatingActionButton icon={<span>+</span>} aria-label="Add" />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(mockCreateRipple).toHaveBeenCalled();
    });
  });

  describe("Click Handler", () => {
    it("should call onClick when clicked", () => {
      const handleClick = vi.fn();
      render(
        <FloatingActionButton
          icon={<span>+</span>}
          aria-label="Add"
          onClick={handleClick}
        />
      );

      fireEvent.click(screen.getByRole("button"));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <FloatingActionButton
          ref={ref}
          icon={<span>+</span>}
          aria-label="Add"
        />
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});

describe("ToggleButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render toggle button with children", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByText("Toggle")).toBeInTheDocument();
    });

    it("should have switch role", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      expect(screen.getByRole("switch")).toBeInTheDocument();
    });
  });

  describe("Pressed State", () => {
    it("should have aria-checked false when not pressed", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    });

    it("should have aria-checked true when pressed", () => {
      render(
        <ToggleButton isPressed onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });

    it("should apply pressed styles when pressed", () => {
      render(
        <ToggleButton isPressed onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      const button = screen.getByRole("switch");
      expect(button).toHaveClass("bg-gradient-to-r");
      expect(button).toHaveClass("from-violet-600");
      expect(button).toHaveClass("text-white");
    });

    it("should apply unpressed styles when not pressed", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      const button = screen.getByRole("switch");
      expect(button).toHaveClass("bg-gray-100");
      expect(button).toHaveClass("text-gray-700");
    });
  });

  describe("Icons", () => {
    it("should render unpressed icon when not pressed", () => {
      render(
        <ToggleButton
          isPressed={false}
          onChange={() => {}}
          icon={<span data-testid="off-icon">○</span>}
          pressedIcon={<span data-testid="on-icon">●</span>}
        >
          Toggle
        </ToggleButton>
      );

      expect(screen.getByTestId("off-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("on-icon")).not.toBeInTheDocument();
    });

    it("should render pressed icon when pressed", () => {
      render(
        <ToggleButton
          isPressed
          onChange={() => {}}
          icon={<span data-testid="off-icon">○</span>}
          pressedIcon={<span data-testid="on-icon">●</span>}
        >
          Toggle
        </ToggleButton>
      );

      expect(screen.getByTestId("on-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("off-icon")).not.toBeInTheDocument();
    });

    it("should use regular icon when pressed if no pressedIcon", () => {
      render(
        <ToggleButton
          isPressed
          onChange={() => {}}
          icon={<span data-testid="icon">★</span>}
        >
          Toggle
        </ToggleButton>
      );

      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("should not render icon container when no icons", () => {
      const { container } = render(
        <ToggleButton isPressed={false} onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      const iconSpans = container.querySelectorAll(".transition-transform");
      expect(iconSpans).toHaveLength(0);
    });
  });

  describe("Change Handler", () => {
    it("should call onChange with true when toggled on", () => {
      const handleChange = vi.fn();
      render(
        <ToggleButton isPressed={false} onChange={handleChange}>
          Toggle
        </ToggleButton>
      );

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("should call onChange with false when toggled off", () => {
      const handleChange = vi.fn();
      render(
        <ToggleButton isPressed onChange={handleChange}>
          Toggle
        </ToggleButton>
      );

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Sizes", () => {
    it("should apply medium size by default", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      const button = screen.getByRole("switch");
      expect(button).toHaveClass("px-4");
      expect(button).toHaveClass("py-2");
    });

    it("should apply small size", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}} size="sm">
          Toggle
        </ToggleButton>
      );

      const button = screen.getByRole("switch");
      expect(button).toHaveClass("px-3");
      expect(button).toHaveClass("py-1.5");
    });

    it("should apply large size", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}} size="lg">
          Toggle
        </ToggleButton>
      );

      const button = screen.getByRole("switch");
      expect(button).toHaveClass("px-6");
      expect(button).toHaveClass("py-3");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(
        <ToggleButton isPressed={false} onChange={() => {}} disabled>
          Toggle
        </ToggleButton>
      );

      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("should not call onChange when disabled", () => {
      const handleChange = vi.fn();
      render(
        <ToggleButton isPressed={false} onChange={handleChange} disabled>
          Toggle
        </ToggleButton>
      );

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to button element", () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <ToggleButton ref={ref} isPressed={false} onChange={() => {}}>
          Toggle
        </ToggleButton>
      );

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});

describe("Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  it("AnimatedButton should be focusable", () => {
    render(<AnimatedButton>Focus Me</AnimatedButton>);

    const button = screen.getByRole("button");
    button.focus();

    expect(document.activeElement).toBe(button);
  });

  it("IconButton should have required aria-label", () => {
    render(<IconButton icon={<span>✓</span>} aria-label="Confirm action" />);

    expect(screen.getByRole("button")).toHaveAccessibleName("Confirm action");
  });

  it("FloatingActionButton should have required aria-label", () => {
    render(
      <FloatingActionButton icon={<span>+</span>} aria-label="Add new item" />
    );

    expect(screen.getByRole("button")).toHaveAccessibleName("Add new item");
  });

  it("ToggleButton should have proper switch semantics", () => {
    render(
      <ToggleButton isPressed onChange={() => {}} aria-label="Enable feature">
        Enable
      </ToggleButton>
    );

    const toggle = screen.getByRole("switch");
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("should respect prefers-reduced-motion", () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(<AnimatedButton>Reduced Motion</AnimatedButton>);

    // Verify hooks were called with disabled: true
    expect(mockUsePress).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true })
    );
    expect(mockUseRipple).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true })
    );
  });
});
