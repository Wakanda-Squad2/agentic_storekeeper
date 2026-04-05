import { storekeeperJson, toSearchParams } from "@/lib/api/storekeeper/http";
import type {
  AskDocumentRequest,
  ChatRequest,
  ChatResponse,
  DocumentList,
  DocumentResponse,
  DocumentUpdate,
  HealthInfo,
  RootInfo,
  TransactionCreate,
  TransactionResponse,
  TransactionSummary,
  TransactionUpdate,
  TransactionTypeFilter,
  UntypedJson,
} from "@/lib/api/storekeeper/types";

const V1 = "/api/v1";

/** GET / */
export async function getRoot(signal?: AbortSignal): Promise<RootInfo> {
  return storekeeperJson<RootInfo>("/", { method: "GET", signal });
}

/** GET /health */
export async function getHealth(signal?: AbortSignal): Promise<HealthInfo> {
  return storekeeperJson<HealthInfo>("/health", { method: "GET", signal });
}

// --- Documents ---

export type ListDocumentsParams = {
  page?: number;
  size?: number;
  status?: string | null;
};

/** GET /api/v1/documents/ */
export async function listDocuments(
  params: ListDocumentsParams = {},
  signal?: AbortSignal,
): Promise<DocumentList> {
  const q = toSearchParams({
    page: params.page,
    size: params.size,
    status: params.status ?? undefined,
  });
  return storekeeperJson<DocumentList>(`${V1}/documents/${q}`, { method: "GET", signal });
}

/** POST /api/v1/documents/ (multipart) */
export async function createDocument(
  file: File | Blob,
  options?: { documentType?: string | null; signal?: AbortSignal },
): Promise<DocumentResponse> {
  const fd = new FormData();
  fd.append("file", file);
  const q = toSearchParams({
    document_type: options?.documentType ?? undefined,
  });
  return storekeeperJson<DocumentResponse>(`${V1}/documents/${q}`, {
    method: "POST",
    body: fd,
    signal: options?.signal,
  });
}

/** GET /api/v1/documents/{document_id} */
export async function getDocument(
  documentId: number,
  signal?: AbortSignal,
): Promise<DocumentResponse> {
  return storekeeperJson<DocumentResponse>(`${V1}/documents/${documentId}`, {
    method: "GET",
    signal,
  });
}

/** PATCH /api/v1/documents/{document_id} */
export async function updateDocument(
  documentId: number,
  body: DocumentUpdate,
  signal?: AbortSignal,
): Promise<DocumentResponse> {
  return storekeeperJson<DocumentResponse>(`${V1}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

/** DELETE /api/v1/documents/{document_id} */
export async function deleteDocument(
  documentId: number,
  signal?: AbortSignal,
): Promise<void> {
  await storekeeperJson<unknown>(`${V1}/documents/${documentId}`, {
    method: "DELETE",
    signal,
  });
}

// --- Transactions ---

export type ListTransactionsParams = {
  page?: number;
  size?: number;
  transaction_type?: TransactionTypeFilter | null;
  start_date?: string | null;
  end_date?: string | null;
  category?: string | null;
  vendor?: string | null;
};

/** GET /api/v1/transactions/ */
export async function listTransactions(
  params: ListTransactionsParams = {},
  signal?: AbortSignal,
): Promise<TransactionResponse[]> {
  const q = toSearchParams({
    page: params.page,
    size: params.size,
    transaction_type: params.transaction_type ?? undefined,
    start_date: params.start_date ?? undefined,
    end_date: params.end_date ?? undefined,
    category: params.category ?? undefined,
    vendor: params.vendor ?? undefined,
  });
  return storekeeperJson<TransactionResponse[]>(`${V1}/transactions/${q}`, {
    method: "GET",
    signal,
  });
}

/** POST /api/v1/transactions/ */
export async function createTransaction(
  body: TransactionCreate,
  signal?: AbortSignal,
): Promise<TransactionResponse> {
  return storekeeperJson<TransactionResponse>(`${V1}/transactions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

/** GET /api/v1/transactions/{transaction_id} */
export async function getTransaction(
  transactionId: number,
  signal?: AbortSignal,
): Promise<TransactionResponse> {
  return storekeeperJson<TransactionResponse>(`${V1}/transactions/${transactionId}`, {
    method: "GET",
    signal,
  });
}

/** PATCH /api/v1/transactions/{transaction_id} */
export async function updateTransaction(
  transactionId: number,
  body: TransactionUpdate,
  signal?: AbortSignal,
): Promise<TransactionResponse> {
  return storekeeperJson<TransactionResponse>(`${V1}/transactions/${transactionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

/** DELETE /api/v1/transactions/{transaction_id} */
export async function deleteTransaction(
  transactionId: number,
  signal?: AbortSignal,
): Promise<void> {
  await storekeeperJson<unknown>(`${V1}/transactions/${transactionId}`, {
    method: "DELETE",
    signal,
  });
}

export type SummaryDateRange = {
  start_date?: string | null;
  end_date?: string | null;
};

/** GET /api/v1/transactions/summary/dashboard */
export async function getTransactionSummary(
  params: SummaryDateRange = {},
  signal?: AbortSignal,
): Promise<TransactionSummary> {
  const q = toSearchParams({
    start_date: params.start_date ?? undefined,
    end_date: params.end_date ?? undefined,
  });
  return storekeeperJson<TransactionSummary>(
    `${V1}/transactions/summary/dashboard${q}`,
    { method: "GET", signal },
  );
}

// --- Dashboard (OpenAPI schema is empty; typed loosely) ---

/** GET /api/v1/dashboard/summary */
export async function getDashboardSummary(
  params: SummaryDateRange = {},
  signal?: AbortSignal,
): Promise<UntypedJson> {
  const q = toSearchParams({
    start_date: params.start_date ?? undefined,
    end_date: params.end_date ?? undefined,
  });
  return storekeeperJson<UntypedJson>(`${V1}/dashboard/summary${q}`, {
    method: "GET",
    signal,
  });
}

export type CategoryBreakdownParams = SummaryDateRange & {
  transaction_type?: TransactionTypeFilter | null;
};

/** GET /api/v1/dashboard/category-breakdown */
export async function getCategoryBreakdown(
  params: CategoryBreakdownParams = {},
  signal?: AbortSignal,
): Promise<UntypedJson> {
  const q = toSearchParams({
    transaction_type: params.transaction_type ?? undefined,
    start_date: params.start_date ?? undefined,
    end_date: params.end_date ?? undefined,
  });
  return storekeeperJson<UntypedJson>(`${V1}/dashboard/category-breakdown${q}`, {
    method: "GET",
    signal,
  });
}

/** GET /api/v1/dashboard/trend-data */
export async function getTrendData(
  params: SummaryDateRange = {},
  signal?: AbortSignal,
): Promise<UntypedJson> {
  const q = toSearchParams({
    start_date: params.start_date ?? undefined,
    end_date: params.end_date ?? undefined,
  });
  return storekeeperJson<UntypedJson>(`${V1}/dashboard/trend-data${q}`, {
    method: "GET",
    signal,
  });
}

// --- Chat ---

/** POST /api/v1/chat/ */
export async function chatWithAi(
  body: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  return storekeeperJson<ChatResponse>(`${V1}/chat/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

/** POST /api/v1/chat/ask-about-document */
export async function askAboutDocument(
  body: AskDocumentRequest,
  signal?: AbortSignal,
): Promise<UntypedJson> {
  return storekeeperJson<UntypedJson>(`${V1}/chat/ask-about-document`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

export type AnalyzeTrendsParams = {
  timeframe?: string;
  focus?: string | null;
};

/** POST /api/v1/chat/analyze-trends */
export async function analyzeTrends(
  params: AnalyzeTrendsParams = {},
  signal?: AbortSignal,
): Promise<UntypedJson> {
  const q = toSearchParams({
    timeframe: params.timeframe ?? "month",
    focus: params.focus ?? undefined,
  });
  return storekeeperJson<UntypedJson>(`${V1}/chat/analyze-trends${q}`, {
    method: "POST",
    signal,
  });
}

/** GET /api/v1/chat/conversation-history */
export async function getConversationHistory(
  params: { limit?: number } = {},
  signal?: AbortSignal,
): Promise<UntypedJson> {
  const q = toSearchParams({ limit: params.limit });
  return storekeeperJson<UntypedJson>(`${V1}/chat/conversation-history${q}`, {
    method: "GET",
    signal,
  });
}
