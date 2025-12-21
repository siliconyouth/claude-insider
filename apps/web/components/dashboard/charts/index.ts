/**
 * Chart Components
 *
 * Reusable chart components built with Recharts for use across the site.
 * All charts support dark mode, animations, and the design system color palette.
 *
 * Features:
 * - Animated transitions with configurable duration
 * - Interactive hover and click states
 * - Dark mode support
 * - Responsive sizing
 * - Card and inline (headless) variants
 *
 * IMPORTANT: Only lazy-loaded versions are exported to prevent Recharts SSR errors.
 * The "Cannot access 'x' before initialization" error occurs when Recharts is
 * imported during SSR due to circular dependencies in the library.
 *
 * If you need direct chart imports (rare - only for components that are already
 * dynamically imported), import directly from the specific chart file:
 *   import { DonutChart } from "@/components/dashboard/charts/donut-chart";
 */

// Lazy-loaded exports - ALWAYS use these in pages and components
export {
  LazyAreaChartCard,
  LazyDonutChartCard,
  LazyDonutChart,
  LazyBarChartCard,
  LazyHorizontalBarChart,
  LazyLineChartCard,
  LazySparklineChart,
  LazyStatCardWithSparkline,
} from "./lazy-charts";

// Chart color constants matching design system
export const CHART_COLORS = {
  primary: "#8b5cf6", // violet-500
  secondary: "#3b82f6", // blue-500
  tertiary: "#06b6d4", // cyan-500
  success: "#22c55e", // green-500
  warning: "#f59e0b", // amber-500
  error: "#ef4444", // red-500
  muted: "#6b7280", // gray-500
} as const;

// Extended color palette for multi-segment charts
export const CHART_PALETTE = [
  "#8b5cf6", // violet-500
  "#3b82f6", // blue-500
  "#06b6d4", // cyan-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#a855f7", // purple-500
] as const;

// Gradient definitions for area fills
export const CHART_GRADIENTS = {
  violet: { start: "#8b5cf6", end: "#3b82f6" },
  blue: { start: "#3b82f6", end: "#06b6d4" },
  cyan: { start: "#06b6d4", end: "#8b5cf6" },
} as const;

// Animation configuration
export const CHART_ANIMATION = {
  duration: 800,
  easing: "ease-out",
} as const;

// Common chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  icon?: string;
  [key: string]: string | number | undefined;
}
