/**
 * Request/response types aligned with FastAPI OpenAPI 3.1
 * (Agentic Storekeeper API). Regenerate when the backend schema changes.
 */

/** Field-level validation errors from FastAPI (HTTP 422). */
export type ValidationErrorItem = {
  loc: (string | number)[];
  msg: string;
  type: string;
};

export type HTTPValidationErrorBody = {
  detail: ValidationErrorItem[];
};

export type AskDocumentRequest = {
  document_id: number;
  question: string;
};

export type ChatRequest = {
  message: string;
  tenant_id?: string | null;
};

export type ChatResponse = {
  answer: string;
  data: Record<string, unknown>;
};

export type DocumentResponse = {
  id: number;
  tenant_id: number;
  filename: string;
  file_path: string;
  file_type: string;
  document_type?: string | null;
  status: string;
  created_at: string;
  updated_at?: string | null;
};

export type DocumentUpdate = {
  filename?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  document_type?: string | null;
  status?: string | null;
};

export type DocumentList = {
  items: DocumentResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
};

/** Decimal amounts as strings (matches backend pattern). */
export type DecimalString = string;

export type TransactionCreate = {
  date: string;
  description: string;
  amount: number | DecimalString;
  currency?: string;
  type: string;
  category?: string | null;
  vendor?: string | null;
  reference?: string | null;
  confidence?: number | null;
  tenant_id: number;
  document_id?: number | null;
};

export type TransactionResponse = {
  id: number;
  tenant_id: number;
  date: string;
  description: string;
  amount: DecimalString;
  currency: string;
  type: string;
  category?: string | null;
  vendor?: string | null;
  reference?: string | null;
  confidence?: number | null;
  document_id?: number | null;
  created_at: string;
};

export type TransactionUpdate = {
  date?: string | null;
  description?: string | null;
  amount?: number | DecimalString | null;
  currency?: string | null;
  type?: string | null;
  category?: string | null;
  vendor?: string | null;
  reference?: string | null;
  confidence?: number | null;
};

export type TransactionSummary = {
  total_income: DecimalString;
  total_expense: DecimalString;
  net_flow: DecimalString;
  count: number;
};

export type TransactionTypeFilter = "income" | "expense";

/** OpenAPI leaves some dashboard/chat responses untyped; narrow at call sites when known. */
export type UntypedJson = Record<string, unknown>;

export type RootInfo = UntypedJson;
export type HealthInfo = UntypedJson;
