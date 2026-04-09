"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { PublicSession } from "@/lib/auth/types";

async function fetchMe(): Promise<PublicSession | null> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  const data = (await res.json()) as { user: PublicSession | null };
  return data.user;
}

export function useAuth() {
  const qc = useQueryClient();
  const router = useRouter();

  const me = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });

  const logout = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auth", "me"] });
      void qc.clear();
      router.replace("/login");
    },
  });

  return {
    user: me.data ?? null,
    isLoading: me.isLoading,
    refetch: me.refetch,
    logout: logout.mutateAsync,
    isLoggingOut: logout.isPending,
  };
}
