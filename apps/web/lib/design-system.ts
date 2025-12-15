/**
 * Claude Insider Design System
 * Stripe/Vercel/Linear-inspired design tokens for consistent UI
 *
 * Based on:
 * - Stripe's gradient aesthetic (purple → blue → cyan)
 * - Vercel's Geist Design System (https://vercel.com/geist)
 * - Linear's modern UI patterns
 * - AWE Project patterns (Seven Pillars)
 *
 * Color Palette: Purple → Blue → Cyan
 * - Primary: violet-600 (#7c3aed) → blue-500 (#3b82f6) → cyan-500 (#06b6d4)
 * - Accents: purple-500 (#a855f7), indigo-500 (#6366f1), cyan-400 (#22d3ee)
 */

export const designSystem = {
  // ============================================
  // TYPOGRAPHY (Geist-style semantic scale)
  // ============================================
  typography: {
    // Display - Hero sections (marketing)
    display: {
      72: 'text-6xl sm:text-7xl font-bold tracking-tight leading-none',
      64: 'text-5xl sm:text-6xl font-bold tracking-tight leading-none',
      56: 'text-4xl sm:text-5xl font-bold tracking-tight leading-tight',
      48: 'text-3xl sm:text-4xl font-bold tracking-tight leading-tight',
    },
    // Headings - Section titles
    heading: {
      40: 'text-3xl sm:text-4xl font-semibold tracking-tight',
      32: 'text-2xl sm:text-3xl font-semibold tracking-tight',
      24: 'text-xl sm:text-2xl font-semibold tracking-tight',
      20: 'text-lg sm:text-xl font-semibold tracking-tight',
      16: 'text-base font-semibold tracking-tight',
      14: 'text-sm font-semibold tracking-tight',
    },
    // Labels - Single-line text (menus, buttons)
    label: {
      20: 'text-xl font-medium leading-tight',
      18: 'text-lg font-medium leading-tight',
      16: 'text-base font-medium leading-tight',
      14: 'text-sm font-medium leading-tight',
      13: 'text-[13px] font-medium leading-tight',
      12: 'text-xs font-medium leading-tight uppercase tracking-wide',
    },
    // Copy - Multi-line body text
    copy: {
      24: 'text-xl sm:text-2xl leading-relaxed',
      20: 'text-lg sm:text-xl leading-relaxed',
      18: 'text-base sm:text-lg leading-relaxed',
      16: 'text-base leading-relaxed',
      14: 'text-sm leading-relaxed',
      13: 'text-[13px] leading-relaxed',
    },
    // Code - Monospace
    code: {
      14: 'font-mono text-sm',
      13: 'font-mono text-[13px]',
      12: 'font-mono text-xs',
    },
  },

  // ============================================
  // COLORS (Semantic Vercel-style 10-scale)
  // ============================================
  colors: {
    // Backgrounds (1-2)
    background: {
      1: 'bg-white dark:bg-ds-background-1',           // Primary page background
      2: 'bg-gray-50 dark:bg-ds-background-2',         // Secondary/subtle background
    },
    // Component backgrounds (1-3)
    surface: {
      1: 'bg-white dark:bg-ds-surface-1',              // Default
      2: 'bg-gray-50 dark:bg-ds-surface-2',            // Hover
      3: 'bg-gray-100 dark:bg-ds-surface-3',           // Active/pressed
    },
    // Borders (4-6)
    border: {
      1: 'border-gray-200 dark:border-ds-border-1',    // Default
      2: 'border-gray-300 dark:border-ds-border-2',    // Hover
      3: 'border-gray-400 dark:border-ds-border-3',    // Active/focus
    },
    // High contrast backgrounds (7-8)
    contrast: {
      1: 'bg-gray-100 dark:bg-ds-contrast-1',          // High contrast bg
      2: 'bg-gray-200 dark:bg-ds-contrast-2',          // Hover high contrast
    },
    // Text and icons (9-10)
    text: {
      primary: 'text-gray-900 dark:text-ds-text-primary',
      secondary: 'text-gray-600 dark:text-ds-text-secondary',
      muted: 'text-gray-500 dark:text-ds-text-muted',
    },
    // Brand/Accent (Stripe-inspired Purple → Blue → Cyan)
    accent: {
      solid: 'bg-blue-500 dark:bg-blue-500',
      hover: 'hover:bg-blue-600 dark:hover:bg-blue-400',
      text: 'text-blue-600 dark:text-cyan-400',
      border: 'border-blue-500 dark:border-cyan-400',
      gradient: 'bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500',
      // Additional gradient variants
      gradientSubtle: 'bg-gradient-to-r from-violet-500/80 via-blue-500/80 to-cyan-500/80',
      gradientText: 'bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent',
      // Individual colors for fine-tuning
      violet: 'text-violet-500 dark:text-violet-400',
      blue: 'text-blue-500 dark:text-blue-400',
      cyan: 'text-cyan-500 dark:text-cyan-400',
    },
    // Status colors
    status: {
      success: 'text-green-600 dark:text-green-400',
      successBg: 'bg-green-100 dark:bg-green-900/30',
      warning: 'text-amber-600 dark:text-amber-400',
      warningBg: 'bg-amber-100 dark:bg-amber-900/30',
      error: 'text-red-600 dark:text-red-400',
      errorBg: 'bg-red-100 dark:bg-red-900/30',
      info: 'text-blue-600 dark:text-blue-400',
      infoBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
  },

  // ============================================
  // MATERIALS (Elevation levels per Vercel Geist)
  // ============================================
  materials: {
    // Surface levels (on the page)
    base: 'rounded-md border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-1 shadow-sm',
    small: 'rounded-md border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-1 shadow',
    medium: 'rounded-xl border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-2 shadow-md',
    large: 'rounded-xl border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-2 shadow-lg',

    // Floating levels (above the page)
    tooltip: 'rounded-md border border-gray-200 dark:border-ds-border-2 bg-white dark:bg-ds-surface-2 shadow-lg',
    menu: 'rounded-xl border border-gray-200 dark:border-ds-border-2 bg-white dark:bg-ds-surface-2 shadow-xl',
    modal: 'rounded-xl border border-gray-200 dark:border-ds-border-2 bg-white dark:bg-ds-surface-2 shadow-2xl',
    fullscreen: 'rounded-2xl border border-gray-200 dark:border-ds-border-2 bg-white dark:bg-ds-surface-2 shadow-2xl',
  },

  // ============================================
  // SPACING (Consistent rhythm)
  // ============================================
  spacing: {
    page: 'px-4 sm:px-6 lg:px-8',
    section: 'py-12 sm:py-16 lg:py-24',
    sectionSmall: 'py-8 sm:py-12 lg:py-16',
    container: 'mx-auto max-w-7xl',
    card: 'p-4 sm:p-6',
    cardLarge: 'p-6 sm:p-8',
  },

  // ============================================
  // RADIUS (Nested radius rule: child ≤ parent)
  // ============================================
  radius: {
    sm: 'rounded-sm',      // 2px  - inline elements
    md: 'rounded-md',      // 6px  - buttons, inputs, badges
    lg: 'rounded-lg',      // 8px  - cards (base level)
    xl: 'rounded-xl',      // 12px - elevated cards, menus
    '2xl': 'rounded-2xl',  // 16px - modals, fullscreen
    full: 'rounded-full',  // pills, avatars
  },

  // ============================================
  // SHADOWS (Layered: ambient + direct light)
  // ============================================
  shadows: {
    none: 'shadow-none',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
    // Vercel-style subtle border shadow
    border: 'shadow-[0_0_0_1px_rgba(0,0,0,0.05)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.05)]',
    // Glow effect for focus/accent (purple/blue/cyan)
    glow: 'shadow-[0_0_24px_rgba(59,130,246,0.2)]',
    glowStrong: 'shadow-[0_0_32px_rgba(59,130,246,0.3)]',
    glowViolet: 'shadow-[0_0_30px_rgba(139,92,246,0.3)]',
    glowCyan: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]',
    // Card hover shadow
    cardHover: 'shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]',
  },

  // ============================================
  // ANIMATIONS (GPU-accelerated, interruptible)
  // ============================================
  animations: {
    // Entrance animations
    fadeIn: 'animate-in fade-in duration-300',
    fadeInUp: 'animate-in fade-in slide-in-from-bottom-2 duration-300',
    fadeInDown: 'animate-in fade-in slide-in-from-top-2 duration-300',
    scaleIn: 'animate-in fade-in zoom-in-95 duration-200',

    // Exit animations
    fadeOut: 'animate-out fade-out duration-200',
    scaleOut: 'animate-out fade-out zoom-out-95 duration-200',

    // Hover effects (GPU-friendly: transform + opacity only)
    hover: {
      lift: 'transition-transform duration-200 hover:-translate-y-0.5',
      liftWithShadow: 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
      scale: 'transition-transform duration-200 hover:scale-[1.02]',
      glow: 'transition-shadow duration-200 hover:shadow-[0_0_24px_rgba(59,130,246,0.2)]',
      glowGradient: 'transition-shadow duration-200 hover:shadow-[0_0_30px_rgba(139,92,246,0.2),0_0_60px_rgba(59,130,246,0.15)]',
      brighten: 'transition-opacity duration-200 hover:opacity-80',
    },

    // Focus effects
    focus: {
      ring: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ds-background-1',
      ringInset: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
      ringViolet: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
      ringCyan: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2',
    },

    // Loading
    pulse: 'animate-pulse',
    spin: 'animate-spin',
    bounce: 'animate-bounce',
  },

  // ============================================
  // GRADIENTS (Stripe-inspired Purple → Blue → Cyan)
  // ============================================
  gradients: {
    // Text gradients
    text: {
      primary: 'bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent',
      accent: 'bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent',
      brand: 'bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent',
      stripe: 'bg-gradient-to-r from-violet-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent',
      aurora: 'bg-gradient-to-r from-pink-400 via-violet-500 via-blue-500 to-cyan-400 bg-clip-text text-transparent',
    },
    // Background gradients
    background: {
      subtle: 'bg-gradient-to-b from-gray-50 to-white dark:from-ds-background-1 dark:to-ds-background-2',
      radial: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-100 via-white to-white dark:from-ds-surface-2 dark:via-ds-background-1 dark:to-ds-background-1',
      mesh: 'bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-gray-100 via-gray-50 to-white dark:from-ds-surface-2 dark:via-ds-background-2 dark:to-ds-background-1',
      hero: 'bg-gradient-to-b from-violet-50/30 via-blue-50/20 to-white dark:from-violet-950/20 dark:via-blue-950/10 dark:to-ds-background-1',
      heroRadial: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-100/40 via-blue-50/30 to-white dark:from-violet-900/30 dark:via-blue-950/20 dark:to-ds-background-1',
      stripe: 'bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10',
    },
    // Border gradients (for special elements)
    border: {
      subtle: 'bg-gradient-to-r from-gray-200 to-gray-100 dark:from-ds-border-1 dark:to-ds-surface-2',
      accent: 'bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500',
      stripe: 'bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-400',
    },
    // Button gradients
    button: {
      primary: 'bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500',
      secondary: 'bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20',
    },
    // Glow effects for lens flares
    glow: {
      violet: 'bg-[radial-gradient(circle,rgba(139,92,246,0.4)_0%,transparent_70%)]',
      blue: 'bg-[radial-gradient(circle,rgba(59,130,246,0.4)_0%,transparent_70%)]',
      cyan: 'bg-[radial-gradient(circle,rgba(34,211,238,0.4)_0%,transparent_70%)]',
      combined: 'bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.3)_0%,transparent_50%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.25)_0%,transparent_50%),radial-gradient(circle_at_50%_80%,rgba(34,211,238,0.2)_0%,transparent_50%)]',
    },
  },

  // ============================================
  // PATTERNS (Dot grid, line grid - Vercel aesthetic)
  // ============================================
  patterns: {
    dots: 'bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#333333_1px,transparent_1px)] [background-size:16px_16px]',
    dotsLarge: 'bg-[radial-gradient(#d1d5db_1.5px,transparent_1.5px)] dark:bg-[radial-gradient(#333333_1.5px,transparent_1.5px)] [background-size:32px_32px]',
    grid: 'bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] [background-size:24px_24px]',
    gridLarge: 'bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)] [background-size:48px_48px]',
  },

  // ============================================
  // GLASS MORPHISM (Frosted glass effect)
  // ============================================
  glass: {
    light: 'bg-white/70 dark:bg-ds-background-1/70 backdrop-blur-xl',
    medium: 'bg-white/50 dark:bg-ds-background-1/50 backdrop-blur-lg',
    heavy: 'bg-white/30 dark:bg-ds-background-1/30 backdrop-blur-md',
    header: 'bg-white/80 dark:bg-ds-background-1/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-ds-background-1/60',
  },

  // ============================================
  // COMPONENT PRESETS
  // ============================================
  components: {
    // Card variants
    card: {
      default: 'rounded-xl border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-2 shadow-sm',
      hover: 'rounded-xl border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-2 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-300 dark:hover:border-ds-border-2',
      elevated: 'rounded-xl border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-2 shadow-md',
      interactive: 'rounded-xl border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-surface-2 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 dark:hover:border-blue-500/50',
      ghost: 'rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-ds-border-1 bg-transparent hover:bg-gray-50 dark:hover:bg-ds-surface-2 transition-all duration-200',
      gradient: 'rounded-xl border border-transparent bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
    },

    // Button variants
    button: {
      primary: 'inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      secondary: 'inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 transition-colors hover:bg-gray-50 dark:bg-ds-surface-2 dark:text-white dark:border-ds-border-1 dark:hover:bg-ds-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      ghost: 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-ds-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      accent: 'inline-flex items-center justify-center rounded-md bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
      link: 'inline-flex items-center text-sm font-medium text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 underline-offset-4 hover:underline',
      gradient: 'inline-flex items-center justify-center rounded-md bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 hover:shadow-lg hover:shadow-blue-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    },

    // Input variants
    input: {
      default: 'flex h-10 w-full rounded-md border border-gray-200 dark:border-ds-border-1 bg-white dark:bg-ds-background-1 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
      error: 'flex h-10 w-full rounded-md border border-red-500 bg-white dark:bg-ds-background-1 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500',
    },

    // Badge variants
    badge: {
      base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
      primary: 'bg-gray-900 text-white dark:bg-white dark:text-gray-900',
      secondary: 'bg-gray-100 text-gray-800 dark:bg-ds-surface-3 dark:text-gray-200',
      outline: 'border border-gray-200 text-gray-600 dark:border-ds-border-2 dark:text-gray-400',
      accent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-cyan-400',
      gradient: 'bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-cyan-400',
      success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },

    // Navigation
    nav: {
      header: 'sticky top-0 z-50 w-full border-b border-gray-200 dark:border-ds-border-1 bg-white/80 dark:bg-ds-background-1/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-ds-background-1/60',
      sidebar: 'w-64 border-r border-gray-200 dark:border-ds-border-1 bg-gray-50/50 dark:bg-ds-background-1/50',
      item: 'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-ds-surface-2 hover:text-gray-900 dark:hover:text-white',
      itemActive: 'bg-gray-100 dark:bg-ds-surface-2 text-gray-900 dark:text-white',
    },

    // Code blocks
    code: {
      inline: 'rounded-md bg-gray-100 dark:bg-ds-surface-2 px-1.5 py-0.5 text-sm font-mono text-blue-600 dark:text-cyan-400',
      block: 'rounded-xl border border-gray-200 dark:border-ds-border-1 bg-gray-900 dark:bg-ds-surface-1 p-4 overflow-x-auto font-mono text-sm',
    },

    // Skeleton loading
    skeleton: {
      base: 'animate-pulse rounded-md bg-gray-200 dark:bg-ds-surface-3',
      text: 'animate-pulse rounded h-4 bg-gray-200 dark:bg-ds-surface-3',
      avatar: 'animate-pulse rounded-full bg-gray-200 dark:bg-ds-surface-3',
    },

    // ============================================
    // HIGH CONTRAST SYNCED COMPONENTS (MANDATORY FOR MODALS)
    // ============================================
    // These components maintain EQUAL contrast ratio in both themes.
    // Use for: Auth modals, onboarding, CTAs, important actions.
    // Rule: Light and dark should feel equally prominent.
    // ============================================
    contrastSynced: {
      // Primary CTA - Always gradient, always high visibility
      // Use for: Sign in, Sign up, Submit, Confirm actions
      buttonPrimary: 'inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ds-background-1 disabled:opacity-50 disabled:pointer-events-none',

      // Secondary CTA - Bordered with high contrast text
      // Use for: Cancel, Back, Alternative actions
      buttonSecondary: 'inline-flex items-center justify-center rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-ds-surface-2 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-ds-surface-3 hover:border-gray-400 dark:hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ds-background-1 disabled:opacity-50 disabled:pointer-events-none',

      // Ghost/Tertiary - Subtle but visible in both themes
      // Use for: Skip, Dismiss, Less important actions
      buttonGhost: 'inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-100 dark:hover:bg-ds-surface-2 hover:text-gray-900 dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ds-background-1',

      // Destructive - Red gradient, same in both themes
      // Use for: Delete, Remove, Dangerous actions
      buttonDestructive: 'inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition-all hover:from-red-500 hover:to-red-400 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ds-background-1',

      // Modal container - Equal prominence in both themes
      modal: 'rounded-2xl border border-gray-200 dark:border-ds-border-2 bg-white dark:bg-ds-surface-2 shadow-2xl dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]',

      // Modal header - Subtle gradient that works in both themes
      modalHeader: 'border-b border-gray-200 dark:border-ds-border-1 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-ds-surface-1 dark:via-ds-surface-2 dark:to-ds-surface-1 px-6 py-4',

      // Input - High contrast border and focus states
      input: 'flex h-12 w-full rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-ds-background-1 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-400',

      // Input with error
      inputError: 'flex h-12 w-full rounded-lg border-2 border-red-500 dark:border-red-400 bg-white dark:bg-ds-background-1 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500',

      // Label - Always visible text
      label: 'text-sm font-semibold text-gray-900 dark:text-white',

      // Helper text - Muted but readable
      helperText: 'text-sm text-gray-600 dark:text-gray-400',

      // Error text - Red in both themes
      errorText: 'text-sm font-medium text-red-600 dark:text-red-400',

      // Link - Accent color that pops in both themes
      link: 'text-sm font-medium text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 underline-offset-4 hover:underline',

      // Divider with "or" text
      divider: 'relative flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 before:absolute before:left-0 before:top-1/2 before:h-px before:w-[calc(50%-2rem)] before:bg-gray-300 dark:before:bg-gray-600 after:absolute after:right-0 after:top-1/2 after:h-px after:w-[calc(50%-2rem)] after:bg-gray-300 dark:after:bg-gray-600',

      // Checkbox/Radio - Visible checked state
      checkbox: 'h-5 w-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 dark:text-cyan-400 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-ds-background-1 bg-white dark:bg-ds-background-1',

      // Social/OAuth buttons - Equal prominence
      socialButton: 'inline-flex items-center justify-center gap-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-ds-surface-2 px-6 py-3 text-sm font-medium text-gray-900 dark:text-white transition-all hover:bg-gray-50 dark:hover:bg-ds-surface-3 hover:border-gray-400 dark:hover:border-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
    },
  },

  // ============================================
  // UTILITIES
  // ============================================
  utils: {
    // Focus states (WCAG 2.1 AA compliant)
    focusRing: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ds-background-1',
    focusWithin: 'focus-within:ring-2 focus-within:ring-blue-500',

    // Transition defaults
    transition: 'transition-all duration-200 ease-out',
    transitionFast: 'transition-all duration-150 ease-out',
    transitionSlow: 'transition-all duration-300 ease-out',
    transitionColors: 'transition-colors duration-200',

    // Truncation
    truncate: 'truncate',
    lineClamp2: 'line-clamp-2',
    lineClamp3: 'line-clamp-3',

    // Accessibility
    srOnly: 'sr-only',
    notSrOnly: 'not-sr-only',

    // Print
    printHidden: 'print:hidden',

    // Disabled state
    disabled: 'opacity-50 pointer-events-none',
  },
} as const

// Type export for TypeScript support
export type DesignSystem = typeof designSystem
export type TypographyScale = keyof typeof designSystem.typography
export type ColorScale = keyof typeof designSystem.colors
export type MaterialLevel = keyof typeof designSystem.materials

/**
 * Utility function to combine Tailwind classes
 * Filters out falsy values for conditional class application
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Helper to get typography classes by category and size
 */
export function getTypography(
  category: 'display' | 'heading' | 'label' | 'copy' | 'code',
  size: number
): string {
  const scale = designSystem.typography[category] as Record<number, string>
  return scale[size] || ''
}

/**
 * Helper to get component preset classes
 */
export function getComponent(
  component: keyof typeof designSystem.components,
  variant: string
): string {
  const variants = designSystem.components[component] as Record<string, string>
  return variants[variant] || ''
}
