import React, { useState, useRef } from "react";
import {
  Title2,
  Title3,
  Body1,
  Card,
  Button,
  Input,
  Label,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Badge,
  Divider,
  ProgressBar,
  Tooltip,
  mergeClasses,
  Combobox,
  Option,
} from "@fluentui/react-components";
import {
  SparkleRegular,
  FolderRegular,
  SearchRegular,
  TranslateRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ArrowClockwiseRegular,
  EyeRegular,
  EyeOffRegular,
  DocumentRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  CloudSyncRegular,
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import type {
  MissingTranslationItem,
  TranslationItemState,
  TranslationResult,
  ModelTestResult,
} from "./ai-translation/types";

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100%",
    boxSizing: "border-box",
    overflowY: "auto",   // 允许页面级滚动
  },
  // 上方固定区：页头 + 配置 + 目录选择 + 反馈
  fixedTop: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("20px"),
    padding: "24px 24px 0 24px",
    flexShrink: 0,
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "4px",
    flexShrink: 0,
  },
  configCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    ...shorthands.padding("16px", "20px"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  configHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    userSelect: "none",
  },
  configHeaderLeft: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  configGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    ...shorthands.gap("12px"),
    "@media (max-width: 700px)": {
      gridTemplateColumns: "1fr",
    },
  },
  configRow: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("6px"),
  },
  configRowFull: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("6px"),
    gridColumn: "1 / -1",
  },
  keyInputWrapper: {
    display: "flex",
    ...shorthands.gap("8px"),
    alignItems: "center",
  },
  pickSection: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
    flexShrink: 0,
  },
  pickRow: {
    display: "flex",
    ...shorthands.gap("12px"),
    alignItems: "center",
    flexWrap: "wrap",
  },
  pathDisplay: {
    flex: 1,
    minWidth: "200px",
    padding: "6px 12px",
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    color: tokens.colorNeutralForeground2,
    fontSize: "13px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: tokens.fontFamilyMonospace,
  },
  statsRow: {
    display: "flex",
    ...shorthands.gap("16px"),
    alignItems: "center",
    flexWrap: "wrap",
  },
  statBadge: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("6px"),
  },
  listSection: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    overflow: "hidden",
    padding: "0 24px 24px 24px",
    marginTop: "20px",
  },
  testModelRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  testModelButton: {
    minWidth: "132px",
    whiteSpace: "nowrap",
  },
  listHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    ...shorthands.gap("12px"),
  },
  listHeaderLeft: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  listHeaderActions: {
    display: "flex",
    ...shorthands.gap("8px"),
    flexWrap: "wrap",
  },
  itemList: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    overflowY: "visible",  // 列表随页面滚动，不再单独限制高度
    paddingRight: "4px",   // 给滚动条留空间
  },
  itemCard: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    ...shorthands.padding("12px", "16px"),
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(4px)",
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    borderRadius: tokens.borderRadiusMedium,
    transitionProperty: "border-color, background-color",
    transitionDuration: "0.2s",
  },
  itemCardSuccess: {
    border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
    backgroundColor: "rgba(16, 124, 65, 0.06)",
  },
  itemCardError: {
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
    backgroundColor: "rgba(196, 49, 75, 0.06)",
  },
  itemCardTranslating: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: "rgba(0, 120, 212, 0.06)",
  },
  itemIcon: {
    flexShrink: 0,
    fontSize: "20px",
    color: tokens.colorNeutralForeground3,
    display: "flex",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("2px"),
    minWidth: 0,
  },
  itemName: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "14px",
    color: tokens.colorNeutralForeground1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemMeta: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  itemActions: {
    flexShrink: 0,
    display: "flex",
    ...shorthands.gap("8px"),
    alignItems: "center",
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 24px",
    ...shorthands.gap("12px"),
    color: tokens.colorNeutralForeground4,
    textAlign: "center",
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const LS_KEY_API_URL = "ai_api_url";
const LS_KEY_API_KEY = "ai_api_key";
const LS_KEY_MODEL = "ai_model";

function loadConfig() {
  return {
    apiUrl: localStorage.getItem(LS_KEY_API_URL) || "https://api.openai.com/v1",
    apiKey: localStorage.getItem(LS_KEY_API_KEY) || "",
    model: localStorage.getItem(LS_KEY_MODEL) || "gpt-4o-mini",
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AiTranslationView: React.FC = () => {
  const styles = useStyles();
  const cfg = loadConfig();

  // LLM config state
  const [apiUrl, setApiUrl] = useState(cfg.apiUrl);
  const [apiKey, setApiKey] = useState(cfg.apiKey);
  const [model, setModel] = useState(cfg.model);
  const [showKey, setShowKey] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(!!cfg.apiKey);

  // Model list state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [modelFetchError, setModelFetchError] = useState<string | null>(null);

  // Model test state
  const [isTestingModel, setIsTestingModel] = useState(false);
  const [modelTestResult, setModelTestResult] = useState<ModelTestResult | null>(null);

  // Folder + scan state
  const [modPath, setModPath] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Items state
  const [items, setItems] = useState<TranslationItemState[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const batchCancelRef = useRef(false);

  // Feedback
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    title: string;
    text: string;
  } | null>(null);

  // ── Config persistence ────────────────────────────────────────────────────

  const saveConfig = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  // ── Fetch available models ─────────────────────────────────────────────────

  const handleFetchModels = async () => {
    if (!apiUrl.trim()) return;
    setIsFetchingModels(true);
    setModelFetchError(null);
    try {
      const models = await invoke<string[]>("fetch_available_models", {
        apiUrl,
        apiKey,
      });
      setAvailableModels(models);
      // Auto-select current model if it's in the list, else pick first
      if (models.length > 0 && !models.includes(model)) {
        setModel(models[0]);
        saveConfig(LS_KEY_MODEL, models[0]);
      }
    } catch (err: any) {
      setModelFetchError(String(err));
    } finally {
      setIsFetchingModels(false);
    }
  };

  // ── Test model availability ────────────────────────────────────────────────

  const handleTestModel = async () => {
    if (!model.trim() || !apiUrl.trim()) return;
    setIsTestingModel(true);
    setModelTestResult(null);
    try {
      const result = await invoke<ModelTestResult>("test_model_availability", {
        apiUrl,
        apiKey,
        model,
      });
      setModelTestResult(result);
    } catch (err: any) {
      setModelTestResult({
        ok: false,
        latencyMs: 0,
        replyPreview: "",
        error: String(err),
      });
    } finally {
      setIsTestingModel(false);
    }
  };

  // ── Folder picker ─────────────────────────────────────────────────────────

  const handlePickFolder = async () => {
    try {
      const selected = await invoke<string | null>("pick_folder");
      if (selected) {
        setModPath(selected);
        setItems([]);
        setScanError(null);
        setFeedback(null);
      }
    } catch (err) {
      console.error("Failed to pick folder:", err);
    }
  };

  // ── Scan ──────────────────────────────────────────────────────────────────

  const handleScan = async () => {
    if (!modPath) return;
    setIsScanning(true);
    setScanError(null);
    setItems([]);
    setFeedback(null);

    try {
      const found = await invoke<MissingTranslationItem[]>(
        "scan_missing_translations",
        { modPath }
      );
      setItems(
        found.map((item) => ({ item, status: "pending" as const }))
      );
      if (found.length === 0) {
        setFeedback({
          type: "info",
          title: "扫描完成",
          text: "该目录下所有条目均已有中文翻译，无需处理。",
        });
      }
    } catch (err: any) {
      setScanError(String(err));
    } finally {
      setIsScanning(false);
    }
  };

  // ── Single item translate ─────────────────────────────────────────────────

  const translateItem = async (index: number): Promise<void> => {
    const state = items[index];
    if (!state || state.status === "done") return;

    setItems((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status: "translating" } : s))
    );

    try {
      const result = await invoke<TranslationResult>(
        "translate_and_write_schinese",
        {
          item: state.item,
          apiUrl,
          apiKey,
          model,
        }
      );
      setItems((prev) =>
        prev.map((s, i) =>
          i === index ? { ...s, status: "done", result } : s
        )
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((s, i) =>
          i === index
            ? { ...s, status: "error", error: String(err) }
            : s
        )
      );
    }
  };

  // ── Batch translate ───────────────────────────────────────────────────────

  const handleBatchTranslate = async () => {
    if (!apiKey.trim()) {
      setFeedback({
        type: "error",
        title: "配置缺失",
        text: "请先在上方配置区填写 API Key。",
      });
      return;
    }

    setIsBatchRunning(true);
    batchCancelRef.current = false;
    setFeedback(null);

    const pendingIndices = items
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.status === "pending" || s.status === "error")
      .map(({ i }) => i);

    let successCount = 0;
    let errorCount = 0;

    for (const idx of pendingIndices) {
      if (batchCancelRef.current) break;
      await translateItem(idx);
      const result = items[idx];
      if (result?.status === "done") successCount++;
      else errorCount++;
    }

    setIsBatchRunning(false);

    // Refresh items to get final counts
    setItems((prev) => {
      const done = prev.filter((s) => s.status === "done").length;
      const errors = prev.filter((s) => s.status === "error").length;
      successCount = done;
      errorCount = errors;
      return prev;
    });

    setFeedback({
      type: errorCount > 0 ? "error" : "success",
      title: "批量翻译完成",
      text: `成功 ${successCount} 条，失败 ${errorCount} 条。`,
    });
  };

  const handleCancelBatch = () => {
    batchCancelRef.current = true;
  };

  // ── Derived stats ─────────────────────────────────────────────────────────

  const totalCount = items.length;
  const doneCount = items.filter((s) => s.status === "done").length;
  const errorCount = items.filter((s) => s.status === "error").length;
  const pendingCount = items.filter(
    (s) => s.status === "pending" || s.status === "translating"
  ).length;
  const progressValue = totalCount > 0 ? doneCount / totalCount : 0;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* ── Fixed top area: header + config + folder + feedback ── */}
      <div className={styles.fixedTop}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <Title2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <SparkleRegular /> AI 翻译
        </Title2>
        <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
          选择 Mod 目录，自动扫描缺少 Schinese.dat 的条目，通过 AI 生成简体中文翻译并写入游戏目录。
        </Body1>
        <Divider />
      </div>

      {/* LLM Config Card */}
      <Card className={styles.configCard}>
        <div
          className={styles.configHeader}
          onClick={() => setConfigCollapsed((v) => !v)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setConfigCollapsed((v) => !v)}
          aria-expanded={!configCollapsed}
        >
          <div className={styles.configHeaderLeft}>
            <SparkleRegular style={{ fontSize: "18px", color: tokens.colorBrandForeground1 }} />
            <Text weight="semibold" size={400}>AI 接口配置</Text>
            {apiKey && (
              <Badge color="success" appearance="tint" size="small">
                已配置
              </Badge>
            )}
          </div>
          {configCollapsed ? <ChevronDownRegular /> : <ChevronUpRegular />}
        </div>

        {!configCollapsed && (
          <div className={styles.configGrid}>
            <div className={styles.configRowFull}>
              <Label htmlFor="ai-api-url" weight="semibold">
                API Base URL
              </Label>
              <Input
                id="ai-api-url"
                value={apiUrl}
                onChange={(e) => {
                  setApiUrl(e.target.value);
                  saveConfig(LS_KEY_API_URL, e.target.value);
                }}
                placeholder="https://api.openai.com/v1"
                style={{ fontFamily: tokens.fontFamilyMonospace }}
              />
              <Body1 style={{ fontSize: "12px", color: tokens.colorNeutralForeground4 }}>
                支持任何 OpenAI 兼容接口（如 Azure、DeepSeek、Ollama 等）
              </Body1>
            </div>

            <div className={styles.configRow}>
              <Label htmlFor="ai-api-key" weight="semibold">
                API Key
              </Label>
              <div className={styles.keyInputWrapper}>
                <Input
                  id="ai-api-key"
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    saveConfig(LS_KEY_API_KEY, e.target.value);
                  }}
                  placeholder="sk-..."
                  style={{ flex: 1, fontFamily: tokens.fontFamilyMonospace }}
                />
                <Tooltip
                  content={showKey ? "隐藏 Key" : "显示 Key"}
                  relationship="label"
                >
                  <Button
                    appearance="subtle"
                    icon={showKey ? <EyeOffRegular /> : <EyeRegular />}
                    onClick={() => setShowKey((v) => !v)}
                  />
                </Tooltip>
              </div>
            </div>

            <div className={styles.configRow}>
              <Label htmlFor="ai-model" weight="semibold">
                模型名称
              </Label>
              <div className={styles.keyInputWrapper}>
                {availableModels.length > 0 ? (
                  <Combobox
                    id="ai-model"
                    value={model}
                    onOptionSelect={(_, data) => {
                      if (data.optionValue) {
                        setModel(data.optionValue);
                        saveConfig(LS_KEY_MODEL, data.optionValue);
                      }
                    }}
                    onChange={(e) => {
                      setModel(e.target.value);
                      saveConfig(LS_KEY_MODEL, e.target.value);
                    }}
                    placeholder="选择或输入模型名称"
                    style={{ flex: 1, fontFamily: tokens.fontFamilyMonospace }}
                    freeform
                  >
                    {availableModels.map((m) => (
                      <Option key={m} value={m} text={m}>
                        {m}
                      </Option>
                    ))}
                  </Combobox>
                ) : (
                  <Input
                    id="ai-model"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      saveConfig(LS_KEY_MODEL, e.target.value);
                    }}
                    placeholder="gpt-4o-mini"
                    style={{ flex: 1, fontFamily: tokens.fontFamilyMonospace }}
                  />
                )}
                <Tooltip content="从接口获取可用模型列表" relationship="label">
                  <Button
                    appearance="subtle"
                    icon={isFetchingModels ? <Spinner size="tiny" /> : <CloudSyncRegular />}
                    onClick={handleFetchModels}
                    disabled={isFetchingModels || !apiUrl.trim()}
                  />
                </Tooltip>
              </div>
              {modelFetchError && (
                <Text size={100} style={{ color: tokens.colorPaletteRedForeground1 }}>
                  {modelFetchError}
                </Text>
              )}
              {availableModels.length > 0 && (
                <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
                  已获取 {availableModels.length} 个模型
                </Text>
              )}
            </div>

            {/* Model test row */}
            <div className={styles.configRowFull}>
              <div className={styles.testModelRow}>
                <Button
                  id="btn-test-model"
                  appearance="secondary"
                  className={styles.testModelButton}
                  icon={
                    isTestingModel
                      ? <Spinner size="tiny" />
                      : <CheckmarkCircleRegular style={{
                          color: modelTestResult
                            ? modelTestResult.ok
                              ? tokens.colorPaletteGreenForeground1
                              : tokens.colorPaletteRedForeground1
                            : undefined
                        }} />
                  }
                  onClick={handleTestModel}
                  disabled={isTestingModel || !model.trim() || !apiUrl.trim()}
                >
                  {isTestingModel ? "测试中…" : "测试连通性"}
                </Button>

                {modelTestResult && (
                  modelTestResult.ok ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <Badge appearance="tint" color="success" size="small">
                        ✓ 连通正常
                      </Badge>
                      <Badge appearance="outline" color="subtle" size="small">
                        延迟 {modelTestResult.latencyMs} ms
                      </Badge>
                      {modelTestResult.replyPreview && (
                        <Text
                          size={100}
                          style={{
                            color: tokens.colorNeutralForeground3,
                            fontStyle: "italic",
                            maxWidth: "320px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          回复：{modelTestResult.replyPreview}
                        </Text>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Badge appearance="tint" color="danger" size="small">
                        ✗ 测试失败
                      </Badge>
                      {modelTestResult.latencyMs > 0 && (
                        <Badge appearance="outline" color="subtle" size="small">
                          {modelTestResult.latencyMs} ms
                        </Badge>
                      )}
                      <Text
                        size={100}
                        style={{
                          color: tokens.colorPaletteRedForeground1,
                          maxWidth: "360px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={modelTestResult.error ?? ""}
                      >
                        {modelTestResult.error}
                      </Text>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Folder Picker + Scan */}
      <div className={styles.pickSection}>
        <Title3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FolderRegular /> 选择 Mod 目录
        </Title3>
        <div className={styles.pickRow}>
          <Button
            appearance="primary"
            icon={<FolderRegular />}
            onClick={handlePickFolder}
            disabled={isScanning || isBatchRunning}
          >
            选择文件夹
          </Button>
          <div className={styles.pathDisplay}>
            {modPath || "尚未选择目录…"}
          </div>
          <Button
            appearance="secondary"
            icon={isScanning ? <Spinner size="tiny" /> : <SearchRegular />}
            onClick={handleScan}
            disabled={!modPath || isScanning || isBatchRunning}
          >
            {isScanning ? "扫描中…" : "扫描"}
          </Button>
        </div>
        <Body1 style={{ fontSize: "12px", color: tokens.colorNeutralForeground4 }}>
          将递归扫描所选目录，找出包含 English.dat 但缺少 Schinese.dat 的所有子目录。
        </Body1>

        {scanError && (
          <MessageBar intent="error">
            <MessageBarBody>
              <MessageBarTitle>扫描失败</MessageBarTitle>
              {scanError}
            </MessageBarBody>
          </MessageBar>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <MessageBar intent={feedback.type}>
          <MessageBarBody>
            <MessageBarTitle>{feedback.title}</MessageBarTitle>
            {feedback.text}
          </MessageBarBody>
        </MessageBar>
      )}

      </div>{/* end fixedTop */}

      {/* Results */}
      {items.length > 0 && (
        <div className={styles.listSection}>
          {/* List header */}
          <div className={styles.listHeader}>
            <div className={styles.listHeaderLeft}>
              <Title3>翻译列表</Title3>
              <div className={styles.statsRow}>
                <div className={styles.statBadge}>
                  <Badge appearance="tint" color="informative">
                    共 {totalCount} 条
                  </Badge>
                </div>
                {doneCount > 0 && (
                  <div className={styles.statBadge}>
                    <Badge appearance="tint" color="success">
                      ✓ {doneCount} 完成
                    </Badge>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className={styles.statBadge}>
                    <Badge appearance="tint" color="danger">
                      ✗ {errorCount} 失败
                    </Badge>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div className={styles.statBadge}>
                    <Badge appearance="tint" color="subtle">
                      {pendingCount} 待翻译
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.listHeaderActions}>
              {isBatchRunning ? (
                <Button
                  appearance="secondary"
                  onClick={handleCancelBatch}
                  icon={<DismissCircleRegular />}
                >
                  停止
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  icon={<TranslateRegular />}
                  onClick={handleBatchTranslate}
                  disabled={pendingCount === 0}
                >
                  全部翻译 ({pendingCount})
                </Button>
              )}
              <Button
                appearance="subtle"
                icon={<ArrowClockwiseRegular />}
                onClick={handleScan}
                disabled={isScanning || isBatchRunning}
              >
                重新扫描
              </Button>
            </div>
          </div>

          {/* Progress bar (batch mode) */}
          {(isBatchRunning || (doneCount > 0 && doneCount < totalCount)) && (
            <div className={styles.progressSection}>
              <ProgressBar
                value={progressValue}
                color={errorCount > 0 ? "error" : "brand"}
                shape="rounded"
                thickness="large"
              />
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {doneCount} / {totalCount} 条已完成
                {isBatchRunning && " — 翻译中，请稍候…"}
              </Text>
            </div>
          )}

          {/* Item list */}
          <div className={styles.itemList}>
            {items.map((state, idx) => {
              const nameField = state.item.fields.find((f) => f.key === "Name");
              const descField = state.item.fields.find(
                (f) => f.key === "Description"
              );
              const preview = nameField?.value || state.item.dirName;
              const descPreview = descField?.value
                ? descField.value.length > 60
                  ? descField.value.slice(0, 60) + "…"
                  : descField.value
                : `${state.item.fields.length} 个可翻译字段`;

              const cardClass = mergeClasses(
                styles.itemCard,
                state.status === "done"
                  ? styles.itemCardSuccess
                  : state.status === "error"
                  ? styles.itemCardError
                  : state.status === "translating"
                  ? styles.itemCardTranslating
                  : ""
              );

              return (
                <div key={state.item.dirPath} className={cardClass}>
                  {/* Status icon */}
                  <div className={styles.itemIcon}>
                    {state.status === "translating" ? (
                      <Spinner size="tiny" />
                    ) : state.status === "done" ? (
                      <CheckmarkCircleRegular
                        style={{ color: tokens.colorPaletteGreenForeground1 }}
                      />
                    ) : state.status === "error" ? (
                      <DismissCircleRegular
                        style={{ color: tokens.colorPaletteRedForeground1 }}
                      />
                    ) : (
                      <DocumentRegular />
                    )}
                  </div>

                  {/* Content */}
                  <div className={styles.itemContent}>
                    <span className={styles.itemName}>
                      {preview}
                      <Text
                        size={200}
                        style={{
                          color: tokens.colorNeutralForeground4,
                          fontWeight: "normal",
                          marginLeft: "8px",
                          fontFamily: tokens.fontFamilyMonospace,
                        }}
                      >
                        {state.item.dirName}
                      </Text>
                    </span>
                    <span className={styles.itemMeta}>
                      {state.status === "error"
                        ? `错误: ${state.error}`
                        : state.status === "done"
                        ? `✓ 已写入 Schinese.dat`
                        : descPreview}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className={styles.itemActions}>
                    {state.status !== "done" && (
                      <Tooltip
                        content={
                          state.status === "error"
                            ? "重试翻译"
                            : "单独翻译此条目"
                        }
                        relationship="label"
                      >
                        <Button
                          appearance={
                            state.status === "error" ? "primary" : "subtle"
                          }
                          size="small"
                          icon={
                            state.status === "translating" ? (
                              <Spinner size="tiny" />
                            ) : (
                              <TranslateRegular />
                            )
                          }
                          disabled={
                            state.status === "translating" || isBatchRunning
                          }
                          onClick={() => translateItem(idx)}
                        >
                          {state.status === "error" ? "重试" : "翻译"}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when scanned but no results */}
      {!isScanning && items.length === 0 && modPath && !scanError && (
        <div className={styles.emptyState}>
          <CheckmarkCircleRegular
            style={{ fontSize: "48px", color: tokens.colorPaletteGreenForeground2 }}
          />
          <Text size={400} weight="semibold">
            无缺失翻译
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3 }}>
            选择目录后点击「扫描」开始检测
          </Text>
        </div>
      )}
    </div>
  );
};
