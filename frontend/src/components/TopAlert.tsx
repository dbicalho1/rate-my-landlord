"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type TopAlertProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  durationMs?: number; // auto-dismiss duration
  className?: string;
};

export function TopAlert({
  open,
  onOpenChange,
  title,
  description,
  icon,
  variant = "default",
  durationMs = 3500,
  className,
}: TopAlertProps) {
  React.useEffect(() => {
    if (!open || !durationMs) return;
    const t = setTimeout(() => onOpenChange?.(false), durationMs);
    return () => clearTimeout(t);
  }, [open, durationMs, onOpenChange]);

  if (!open) return null;

  return (
    <div className={cn("fixed inset-x-0 top-4 z-50 flex justify-center px-4", className)}>
      <div className="w-full max-w-md">
        <Alert variant={variant}>
          {icon}
          <AlertTitle>{title}</AlertTitle>
          {description ? (
            <AlertDescription>{description}</AlertDescription>
          ) : null}
        </Alert>
      </div>
    </div>
  );
}

