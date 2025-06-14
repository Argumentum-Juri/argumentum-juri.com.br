
import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Skeleton } from "./skeleton";

interface LoadingOverlayProps {
  active: boolean;
  message?: string | null;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  active,
  message,
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  if (!active) return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-background/80 z-50 transition-opacity duration-300",
        fullScreen
          ? "fixed inset-0 min-h-screen"
          : "absolute inset-0 min-h-[100px]",
        className
      )}
    >
      <div className="flex flex-col items-center p-4 space-y-3 rounded-lg bg-background shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {message && (
          <p className="text-sm text-center text-muted-foreground max-w-xs">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

interface LoadingContentProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingView?: React.ReactNode;
  fallbackHeight?: string;
  showSkeleton?: boolean;
  className?: string;
}

export function LoadingContent({
  isLoading,
  children,
  loadingView,
  fallbackHeight = "16rem",
  showSkeleton = true,
  className,
}: LoadingContentProps) {
  if (isLoading) {
    if (loadingView) {
      return <>{loadingView}</>;
    }

    if (showSkeleton) {
      return (
        <div
          className={cn("w-full space-y-3", className)}
          style={{ minHeight: fallbackHeight }}
        >
          <Skeleton className="h-8 w-[80%]" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-[80%]" />
          <Skeleton className="h-4 w-[60%]" />
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center w-full",
          className
        )}
        style={{ minHeight: fallbackHeight }}
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn("animate-spin", className)} />;
}

export function GlobalLoadingIndicator() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary h-1">
      <div className="h-full w-full bg-primary animate-pulse opacity-75"></div>
    </div>
  );
}
