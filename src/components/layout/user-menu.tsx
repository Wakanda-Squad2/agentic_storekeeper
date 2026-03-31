"use client";

import { LogOut, User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export function UserMenu() {
  const { user, logout, isLoggingOut } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "max-w-[200px] gap-2 font-normal",
        )}
      >
        <User className="size-4 shrink-0 opacity-70" />
        <span className="truncate">{user.email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">
          <p className="truncate font-medium text-foreground">{user.name}</p>
          <p className="truncate">{user.tenantId}</p>
        </div>
        <Badge variant="secondary" className="mx-2 mb-1">
          {user.role}
        </Badge>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void logout()}
          disabled={isLoggingOut}
          variant="destructive"
        >
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
