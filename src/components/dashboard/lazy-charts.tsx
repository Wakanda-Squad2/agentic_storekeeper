"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const chartLoad = () => <Skeleton className="h-[320px] w-full rounded-xl" />;

export const LazyExpenseDonut = dynamic(
  () =>
    import("./expense-donut").then((m) => m.ExpenseDonut),
  { ssr: false, loading: chartLoad },
);

export const LazyMonthlyTrend = dynamic(
  () =>
    import("./monthly-trend").then((m) => m.MonthlyTrend),
  { ssr: false, loading: chartLoad },
);
