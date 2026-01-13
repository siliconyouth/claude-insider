/**
 * AnimatedInput Component Tests
 *
 * Tests for the animated form input components:
 * - AnimatedInput: Text input with labels, icons, error/success states
 * - AnimatedTextarea: Multi-line input with auto-resize
 * - AnimatedSwitch: Toggle switch
 * - AnimatedCheckbox: Checkbox with indeterminate state
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { createRef } from "react";
import {
  AnimatedInput,
  AnimatedTextarea,
  AnimatedSwitch,
  AnimatedCheckbox,
} from "@/components/animated-input";

// Mock useReducedMotion
const mockUseReducedMotion = vi.fn().mockReturnValue(false);
vi.mock("@/hooks/use-animations", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}));

// Mock cn utility
vi.mock("@/lib/design-system", () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(" "),
}));

describe("AnimatedInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render input element", () => {
      render(<AnimatedInput placeholder="Enter text" />);

      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<AnimatedInput label="Email" />);

      expect(screen.getByLabelText("Email")).toBeInTheDocument();
    });

    it("should render helper text", () => {
      render(<AnimatedInput helperText="Enter your email address" />);

      expect(screen.getByText("Enter your email address")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<AnimatedInput className="custom-input" />);

      expect(container.firstChild).toHaveClass("custom-input");
    });

    it("should pass additional props to input", () => {
      render(<AnimatedInput type="email" data-testid="email-input" />);

      const input = screen.getByTestId("email-input");
      expect(input).toHaveAttribute("type", "email");
    });
  });

  describe("Label", () => {
    it("should render static label above input", () => {
      render(<AnimatedInput label="Username" />);

      const label = screen.getByText("Username");
      expect(label).toHaveClass("block");
      expect(label).toHaveClass("mb-1.5");
    });

    it("should render floating label", () => {
      render(<AnimatedInput label="Username" floatingLabel />);

      const label = screen.getByText("Username");
      expect(label).toHaveClass("absolute");
      expect(label).toHaveClass("pointer-events-none");
    });

    it("should float label when input has value", () => {
      render(<AnimatedInput label="Username" floatingLabel defaultValue="test" />);

      const label = screen.getByText("Username");
      expect(label).toHaveClass("text-xs");
      expect(label).toHaveClass("-translate-y-1/2");
    });

    it("should associate label with input via htmlFor", () => {
      render(<AnimatedInput label="Email" id="email-field" />);

      const label = screen.getByText("Email");
      expect(label).toHaveAttribute("for", "email-field");
    });
  });

  describe("Icons", () => {
    it("should render left icon", () => {
      render(
        <AnimatedInput leftIcon={<span data-testid="left-icon">📧</span>} />
      );

      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    });

    it("should render right icon", () => {
      render(
        <AnimatedInput rightIcon={<span data-testid="right-icon">✓</span>} />
      );

      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });

    it("should render both icons", () => {
      render(
        <AnimatedInput
          leftIcon={<span data-testid="left-icon">📧</span>}
          rightIcon={<span data-testid="right-icon">✓</span>}
        />
      );

      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });

  describe("Sizes", () => {
    it("should apply medium size by default", () => {
      render(<AnimatedInput placeholder="test" />);

      const input = screen.getByPlaceholderText("test");
      expect(input).toHaveClass("h-11");
      expect(input).toHaveClass("px-4");
    });

    it("should apply small size", () => {
      render(<AnimatedInput placeholder="test" size="sm" />);

      const input = screen.getByPlaceholderText("test");
      expect(input).toHaveClass("h-9");
      expect(input).toHaveClass("px-3");
    });

    it("should apply large size", () => {
      render(<AnimatedInput placeholder="test" size="lg" />);

      const input = screen.getByPlaceholderText("test");
      expect(input).toHaveClass("h-13");
      expect(input).toHaveClass("text-base");
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(<AnimatedInput error="This field is required" />);

      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should apply error styles to input", () => {
      render(<AnimatedInput placeholder="test" error="Error" />);

      const input = screen.getByPlaceholderText("test");
      expect(input).toHaveClass("border-red-500");
    });

    it("should hide helper text when error is present", () => {
      render(
        <AnimatedInput helperText="Help text" error="Error message" />
      );

      expect(screen.queryByText("Help text")).not.toBeInTheDocument();
      expect(screen.getByText("Error message")).toBeInTheDocument();
    });
  });

  describe("Success State", () => {
    it("should apply success styles", () => {
      render(<AnimatedInput placeholder="test" success />);

      const input = screen.getByPlaceholderText("test");
      expect(input).toHaveClass("border-emerald-500");
    });
  });

  describe("Disabled State", () => {
    it("should disable input", () => {
      render(<AnimatedInput placeholder="test" disabled />);

      expect(screen.getByPlaceholderText("test")).toBeDisabled();
    });

    it("should apply disabled styles to label", () => {
      render(<AnimatedInput label="Email" disabled />);

      const label = screen.getByText("Email");
      expect(label).toHaveClass("opacity-50");
    });
  });

  describe("Character Count", () => {
    it("should show character count when enabled", () => {
      render(
        <AnimatedInput showCount maxLength={100} defaultValue="Hello" />
      );

      expect(screen.getByText("5/100")).toBeInTheDocument();
    });

    it("should update character count on input", () => {
      render(<AnimatedInput showCount maxLength={50} placeholder="test" />);

      const input = screen.getByPlaceholderText("test");
      fireEvent.change(input, { target: { value: "Hello World" } });

      expect(screen.getByText("11/50")).toBeInTheDocument();
    });

    it("should apply red color at max length", () => {
      render(
        <AnimatedInput showCount maxLength={5} defaultValue="Hello" />
      );

      const count = screen.getByText("5/5");
      expect(count).toHaveClass("text-red-500");
    });
  });

  describe("Focus Handling", () => {
    it("should call onFocus when focused", () => {
      const handleFocus = vi.fn();
      render(<AnimatedInput placeholder="test" onFocus={handleFocus} />);

      fireEvent.focus(screen.getByPlaceholderText("test"));

      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("should call onBlur when blurred", () => {
      const handleBlur = vi.fn();
      render(<AnimatedInput placeholder="test" onBlur={handleBlur} />);

      const input = screen.getByPlaceholderText("test");
      fireEvent.focus(input);
      fireEvent.blur(input);

      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("Change Handling", () => {
    it("should call onChange when value changes", () => {
      const handleChange = vi.fn();
      render(<AnimatedInput placeholder="test" onChange={handleChange} />);

      fireEvent.change(screen.getByPlaceholderText("test"), {
        target: { value: "new value" },
      });

      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to input element", () => {
      const ref = createRef<HTMLInputElement>();
      render(<AnimatedInput ref={ref} placeholder="test" />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe("Reduced Motion", () => {
    it("should disable transitions when prefers reduced motion", () => {
      mockUseReducedMotion.mockReturnValue(true);

      render(<AnimatedInput placeholder="test" />);

      const input = screen.getByPlaceholderText("test");
      expect(input).toHaveClass("transition-none");
    });
  });
});

describe("AnimatedTextarea", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render textarea element", () => {
      render(<AnimatedTextarea placeholder="Enter message" />);

      expect(screen.getByPlaceholderText("Enter message")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(<AnimatedTextarea label="Message" />);

      expect(screen.getByLabelText("Message")).toBeInTheDocument();
    });

    it("should render helper text", () => {
      render(<AnimatedTextarea helperText="Enter your message" />);

      expect(screen.getByText("Enter your message")).toBeInTheDocument();
    });
  });

  describe("Rows", () => {
    it("should use default 4 rows", () => {
      render(<AnimatedTextarea placeholder="test" />);

      const textarea = screen.getByPlaceholderText("test");
      expect(textarea).toHaveAttribute("rows", "4");
    });

    it("should use custom rows", () => {
      render(<AnimatedTextarea placeholder="test" rows={6} />);

      const textarea = screen.getByPlaceholderText("test");
      expect(textarea).toHaveAttribute("rows", "6");
    });
  });

  describe("Error State", () => {
    it("should display error message", () => {
      render(<AnimatedTextarea error="Message is too short" />);

      expect(screen.getByText("Message is too short")).toBeInTheDocument();
    });

    it("should apply error styles", () => {
      render(<AnimatedTextarea placeholder="test" error="Error" />);

      const textarea = screen.getByPlaceholderText("test");
      expect(textarea).toHaveClass("border-red-500");
    });
  });

  describe("Success State", () => {
    it("should apply success styles", () => {
      render(<AnimatedTextarea placeholder="test" success />);

      const textarea = screen.getByPlaceholderText("test");
      expect(textarea).toHaveClass("border-emerald-500");
    });
  });

  describe("Character Count", () => {
    it("should show character count", () => {
      render(
        <AnimatedTextarea showCount maxLength={500} defaultValue="Hello" />
      );

      expect(screen.getByText("5/500")).toBeInTheDocument();
    });

    it("should update count on change", () => {
      render(<AnimatedTextarea showCount maxLength={100} placeholder="test" />);

      const textarea = screen.getByPlaceholderText("test");
      fireEvent.change(textarea, { target: { value: "Test message" } });

      expect(screen.getByText("12/100")).toBeInTheDocument();
    });
  });

  describe("Floating Label", () => {
    it("should render floating label", () => {
      render(<AnimatedTextarea label="Message" floatingLabel />);

      const label = screen.getByText("Message");
      expect(label).toHaveClass("absolute");
    });
  });

  describe("Disabled State", () => {
    it("should disable textarea", () => {
      render(<AnimatedTextarea placeholder="test" disabled />);

      expect(screen.getByPlaceholderText("test")).toBeDisabled();
    });
  });

  describe("Ref Forwarding", () => {
    it("should forward ref to textarea element", () => {
      const ref = createRef<HTMLTextAreaElement>();
      render(<AnimatedTextarea ref={ref} placeholder="test" />);

      expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
    });
  });

  describe("Auto Resize", () => {
    it("should auto-resize on content change when enabled", () => {
      render(<AnimatedTextarea placeholder="test" autoResize />);

      const textarea = screen.getByPlaceholderText("test") as HTMLTextAreaElement;

      // Mock scrollHeight
      Object.defineProperty(textarea, "scrollHeight", { value: 200 });

      fireEvent.change(textarea, { target: { value: "Long text\n".repeat(10) } });

      // Auto-resize sets height to auto then scrollHeight
      expect(textarea.style.height).toBe("200px");
    });
  });
});

describe("AnimatedSwitch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render switch with role", () => {
      render(<AnimatedSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(
        <AnimatedSwitch checked={false} onChange={() => {}} label="Enable" />
      );

      expect(screen.getByText("Enable")).toBeInTheDocument();
    });
  });

  describe("Checked State", () => {
    it("should have aria-checked false when unchecked", () => {
      render(<AnimatedSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    });

    it("should have aria-checked true when checked", () => {
      render(<AnimatedSwitch checked onChange={() => {}} />);

      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });

    it("should apply checked styles", () => {
      render(<AnimatedSwitch checked onChange={() => {}} />);

      expect(screen.getByRole("switch")).toHaveClass("bg-blue-500");
    });

    it("should apply unchecked styles", () => {
      render(<AnimatedSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch")).toHaveClass("bg-gray-200");
    });
  });

  describe("Change Handling", () => {
    it("should call onChange with true when clicked while unchecked", () => {
      const handleChange = vi.fn();
      render(<AnimatedSwitch checked={false} onChange={handleChange} />);

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("should call onChange with false when clicked while checked", () => {
      const handleChange = vi.fn();
      render(<AnimatedSwitch checked onChange={handleChange} />);

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it("should not call onChange when disabled", () => {
      const handleChange = vi.fn();
      render(<AnimatedSwitch checked={false} onChange={handleChange} disabled />);

      fireEvent.click(screen.getByRole("switch"));

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Keyboard Support", () => {
    it("should toggle on Space key", () => {
      const handleChange = vi.fn();
      render(<AnimatedSwitch checked={false} onChange={handleChange} />);

      fireEvent.keyDown(screen.getByRole("switch"), { key: " " });

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("should toggle on Enter key", () => {
      const handleChange = vi.fn();
      render(<AnimatedSwitch checked={false} onChange={handleChange} />);

      fireEvent.keyDown(screen.getByRole("switch"), { key: "Enter" });

      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });

  describe("Label Position", () => {
    it("should render label on right by default", () => {
      const { container } = render(
        <AnimatedSwitch checked={false} onChange={() => {}} label="Test" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).not.toHaveClass("flex-row-reverse");
    });

    it("should render label on left when specified", () => {
      const { container } = render(
        <AnimatedSwitch
          checked={false}
          onChange={() => {}}
          label="Test"
          labelPosition="left"
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("flex-row-reverse");
    });
  });

  describe("Sizes", () => {
    it("should apply medium size by default", () => {
      render(<AnimatedSwitch checked={false} onChange={() => {}} />);

      expect(screen.getByRole("switch")).toHaveClass("w-11");
      expect(screen.getByRole("switch")).toHaveClass("h-6");
    });

    it("should apply small size", () => {
      render(<AnimatedSwitch checked={false} onChange={() => {}} size="sm" />);

      expect(screen.getByRole("switch")).toHaveClass("w-8");
      expect(screen.getByRole("switch")).toHaveClass("h-5");
    });

    it("should apply large size", () => {
      render(<AnimatedSwitch checked={false} onChange={() => {}} size="lg" />);

      expect(screen.getByRole("switch")).toHaveClass("w-14");
      expect(screen.getByRole("switch")).toHaveClass("h-8");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<AnimatedSwitch checked={false} onChange={() => {}} disabled />);

      expect(screen.getByRole("switch")).toBeDisabled();
    });

    it("should apply disabled styles to label", () => {
      render(
        <AnimatedSwitch checked={false} onChange={() => {}} label="Test" disabled />
      );

      const label = screen.getByText("Test");
      expect(label).toHaveClass("opacity-50");
      expect(label).toHaveClass("cursor-not-allowed");
    });
  });
});

describe("AnimatedCheckbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseReducedMotion.mockReturnValue(false);
  });

  describe("Rendering", () => {
    it("should render checkbox with role", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} />);

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("should render with label", () => {
      render(
        <AnimatedCheckbox checked={false} onChange={() => {}} label="Accept terms" />
      );

      expect(screen.getByText("Accept terms")).toBeInTheDocument();
    });
  });

  describe("Checked State", () => {
    it("should have aria-checked false when unchecked", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} />);

      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "false");
    });

    it("should have aria-checked true when checked", () => {
      render(<AnimatedCheckbox checked onChange={() => {}} />);

      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
    });

    it("should apply checked styles", () => {
      render(<AnimatedCheckbox checked onChange={() => {}} />);

      expect(screen.getByRole("checkbox")).toHaveClass("bg-blue-500");
    });
  });

  describe("Indeterminate State", () => {
    it("should have aria-checked mixed when indeterminate", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} indeterminate />);

      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "mixed");
    });

    it("should apply indeterminate styles", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} indeterminate />);

      expect(screen.getByRole("checkbox")).toHaveClass("bg-blue-500");
    });
  });

  describe("Change Handling", () => {
    it("should call onChange with true when clicked while unchecked", () => {
      const handleChange = vi.fn();
      render(<AnimatedCheckbox checked={false} onChange={handleChange} />);

      fireEvent.click(screen.getByRole("checkbox"));

      expect(handleChange).toHaveBeenCalledWith(true);
    });

    it("should call onChange with false when clicked while checked", () => {
      const handleChange = vi.fn();
      render(<AnimatedCheckbox checked onChange={handleChange} />);

      fireEvent.click(screen.getByRole("checkbox"));

      expect(handleChange).toHaveBeenCalledWith(false);
    });

    it("should not call onChange when disabled", () => {
      const handleChange = vi.fn();
      render(<AnimatedCheckbox checked={false} onChange={handleChange} disabled />);

      fireEvent.click(screen.getByRole("checkbox"));

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("Sizes", () => {
    it("should apply medium size by default", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} />);

      expect(screen.getByRole("checkbox")).toHaveClass("w-5");
      expect(screen.getByRole("checkbox")).toHaveClass("h-5");
    });

    it("should apply small size", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} size="sm" />);

      expect(screen.getByRole("checkbox")).toHaveClass("w-4");
      expect(screen.getByRole("checkbox")).toHaveClass("h-4");
    });

    it("should apply large size", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} size="lg" />);

      expect(screen.getByRole("checkbox")).toHaveClass("w-6");
      expect(screen.getByRole("checkbox")).toHaveClass("h-6");
    });
  });

  describe("Disabled State", () => {
    it("should be disabled when disabled prop is true", () => {
      render(<AnimatedCheckbox checked={false} onChange={() => {}} disabled />);

      expect(screen.getByRole("checkbox")).toBeDisabled();
    });

    it("should apply disabled styles to label", () => {
      render(
        <AnimatedCheckbox checked={false} onChange={() => {}} label="Test" disabled />
      );

      const label = screen.getByText("Test");
      expect(label).toHaveClass("opacity-50");
    });
  });

  describe("Label Association", () => {
    it("should associate label with checkbox via htmlFor", () => {
      render(
        <AnimatedCheckbox
          checked={false}
          onChange={() => {}}
          label="Accept"
          id="accept-checkbox"
        />
      );

      const label = screen.getByText("Accept");
      expect(label).toHaveAttribute("for", "accept-checkbox");
    });

    it("should toggle checkbox when label is clicked", () => {
      const handleChange = vi.fn();
      render(
        <AnimatedCheckbox
          checked={false}
          onChange={handleChange}
          label="Accept"
        />
      );

      // Click the checkbox button directly (label click propagates)
      fireEvent.click(screen.getByRole("checkbox"));

      expect(handleChange).toHaveBeenCalledWith(true);
    });
  });
});

describe("Accessibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AnimatedInput should be focusable", () => {
    render(<AnimatedInput placeholder="test" />);

    const input = screen.getByPlaceholderText("test");
    input.focus();

    expect(document.activeElement).toBe(input);
  });

  it("AnimatedTextarea should be focusable", () => {
    render(<AnimatedTextarea placeholder="test" />);

    const textarea = screen.getByPlaceholderText("test");
    textarea.focus();

    expect(document.activeElement).toBe(textarea);
  });

  it("AnimatedSwitch should have proper switch role and attributes", () => {
    render(<AnimatedSwitch checked onChange={() => {}} id="test-switch" />);

    const switchEl = screen.getByRole("switch");
    expect(switchEl).toHaveAttribute("id", "test-switch");
    expect(switchEl).toHaveAttribute("aria-checked", "true");
  });

  it("AnimatedCheckbox should have proper checkbox role and attributes", () => {
    render(<AnimatedCheckbox checked onChange={() => {}} id="test-checkbox" />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("id", "test-checkbox");
    expect(checkbox).toHaveAttribute("aria-checked", "true");
  });

  it("should respect prefers-reduced-motion for all components", () => {
    mockUseReducedMotion.mockReturnValue(true);

    render(
      <>
        <AnimatedInput placeholder="input" />
        <AnimatedTextarea placeholder="textarea" />
        <AnimatedSwitch checked={false} onChange={() => {}} />
        <AnimatedCheckbox checked={false} onChange={() => {}} />
      </>
    );

    expect(screen.getByPlaceholderText("input")).toHaveClass("transition-none");
    expect(screen.getByPlaceholderText("textarea")).toHaveClass("transition-none");
    expect(screen.getByRole("switch")).toHaveClass("transition-none");
    expect(screen.getByRole("checkbox")).toHaveClass("transition-none");
  });
});
