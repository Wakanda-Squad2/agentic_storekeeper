"use client";

import { Bell, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import { Badge } from "@/components/ui/badge";

export function NotificationBell() {
  const items = useNotificationStore((s) => s.items);
  const dismiss = useNotificationStore((s) => s.dismiss);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "relative",
        )}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {items.length > 0 ? (
          <span className="absolute end-1 top-1 flex size-2 rounded-full bg-destructive" />
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-50 w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Alerts</span>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <ul className="max-h-72 overflow-y-auto p-1">
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No alerts yet — uploads, anomalies, and failures appear here.
            </li>
          ) : (
            items.map((n) => (
              <li
                key={n.id}
                className="flex gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-tight">{n.title}</p>
                  <p className="text-muted-foreground text-xs">{n.message}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 shrink-0"
                  onClick={() => dismiss(n.id)}
                  aria-label="Dismiss"
                >
                  <X className="size-3.5" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
