"use client";

/**
 * Lazy-loaded Chart Components
 *
 * Recharts has circular dependency issues that cause "Cannot access 'L' before initialization"
 * errors during SSR. This wrapper uses dynamic imports to completely skip SSR for chart components.
 */

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// Loading placeholder for charts
function ChartLoadingPlaceholder({ height = 200 }: { height?: number }) {
  return (
    <div
      className="rounded-xl border border-gray-800 bg-gray-900/50 animate-pulse"
      style={{ height: height + 80 }}
    />
  );
}

// Dynamically import each chart component with SSR disabled
export const LazyAreaChartCard = dynamic(
  () => import("./area-chart").then((mod) => mod.AreaChartCard),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder />,
  }
) as ComponentType<Parameters<typeof import("./area-chart").AreaChartCard>[0]>;

export const LazyDonutChartCard = dynamic(
  () => import("./donut-chart").then((mod) => mod.DonutChartCard),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder />,
  }
) as ComponentType<Parameters<typeof import("./donut-chart").DonutChartCard>[0]>;

export const LazyDonutChart = dynamic(
  () => import("./donut-chart").then((mod) => mod.DonutChart),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder height={140} />,
  }
) as ComponentType<Parameters<typeof import("./donut-chart").DonutChart>[0]>;

export const LazyBarChartCard = dynamic(
  () => import("./bar-chart").then((mod) => mod.BarChartCard),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder />,
  }
) as ComponentType<Parameters<typeof import("./bar-chart").BarChartCard>[0]>;

export const LazyHorizontalBarChart = dynamic(
  () => import("./bar-chart").then((mod) => mod.HorizontalBarChart),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder height={160} />,
  }
) as ComponentType<Parameters<typeof import("./bar-chart").HorizontalBarChart>[0]>;

export const LazyLineChartCard = dynamic(
  () => import("./line-chart").then((mod) => mod.LineChartCard),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder />,
  }
) as ComponentType<Parameters<typeof import("./line-chart").LineChartCard>[0]>;

export const LazySparklineChart = dynamic(
  () => import("./sparkline-chart").then((mod) => mod.SparklineChart),
  {
    ssr: false,
    loading: () => <div className="h-8 w-16 bg-gray-800 rounded animate-pulse" />,
  }
) as ComponentType<Parameters<typeof import("./sparkline-chart").SparklineChart>[0]>;

export const LazyStatCardWithSparkline = dynamic(
  () => import("./sparkline-chart").then((mod) => mod.StatCardWithSparkline),
  {
    ssr: false,
    loading: () => <ChartLoadingPlaceholder height={80} />,
  }
) as ComponentType<Parameters<typeof import("./sparkline-chart").StatCardWithSparkline>[0]>;
