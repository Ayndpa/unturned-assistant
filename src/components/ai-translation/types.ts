export interface TranslatableField {
  key: string;
  value: string;
}

export interface MissingTranslationItem {
  dirPath: string;
  dirName: string;
  fields: TranslatableField[];
}

export interface TranslationResult {
  dirPath: string;
  writtenPath: string;
  status: "success" | "error";
  error?: string;
}

export type ItemStatus = "pending" | "translating" | "done" | "error" | "skipped";

export interface TranslationItemState {
  item: MissingTranslationItem;
  status: ItemStatus;
  result?: TranslationResult;
  error?: string;
}

export interface ModelTestResult {
  ok: boolean;
  latencyMs: number;
  replyPreview: string;
  error?: string;
}
