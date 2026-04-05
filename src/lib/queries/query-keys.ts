export const queryKeys = {
  financial: {
    summary: (filters: Record<string, string | undefined>) =>
      ["financial", "summary", filters] as const,
  },
  documents: {
    list: ["documents", "list"] as const,
    detail: (id: string) => ["documents", "detail", id] as const,
    audit: (id: string) => ["documents", "audit", id] as const,
  },
  transactions: {
    list: (filters: Record<string, string | undefined>) =>
      ["transactions", "list", filters] as const,
  },
} as const;
