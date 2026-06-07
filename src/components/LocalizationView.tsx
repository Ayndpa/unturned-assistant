import React, { useState, useEffect } from "react";
import {
  Title2,
  Body1,
  Input,
  Button,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Divider,
} from "@fluentui/react-components";
import {
  ArrowClockwiseRegular,
  SearchRegular,
  InfoRegular,
  TranslateRegular,
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { LocalizationItem } from "./localization/types";
import { parseModListHtml } from "./localization/modParser";
import { LocalizationStatusCard } from "./localization/LocalizationStatusCard";
import { ModCard } from "./localization/ModCard";

// ── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("28px"),
    padding: "24px",
    height: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "4px",
  },
  searchBarRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    width: "100%",
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
    ...shorthands.gap("16px"),
    marginTop: "8px",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    ...shorthands.gap("12px"),
    color: tokens.colorNeutralForeground4,
  },
});

// ── Component ────────────────────────────────────────────────────────────────

export const LocalizationView: React.FC = () => {
  const styles = useStyles();

  const [mods, setMods] = useState<LocalizationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game path & validation
  const [gamePath, setGamePath] = useState("");
  const [isPathValid, setIsPathValid] = useState(false);
  const [isCheckingPath, setIsCheckingPath] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installedMod, setInstalledMod] = useState<string | null>(null);

  // Action state
  const [actionModUrl, setActionModUrl] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const checkInstalledStatus = async (path: string) => {
    if (!path) return;
    try {
      const installed = await invoke<boolean>("is_localization_installed", { gamePath: path });
      setIsInstalled(installed);
    } catch (err) {
      console.error("Failed to check installed status:", err);
    }
  };

  const verifyPath = async (path: string) => {
    setIsCheckingPath(true);
    try {
      await invoke("verify_unturned_path", { gamePath: path });
      setIsPathValid(true);
      checkInstalledStatus(path);
    } catch {
      setIsPathValid(false);
    } finally {
      setIsCheckingPath(false);
    }
  };

  const fetchOnlineMods = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const html = await invoke<string>("fetch_html", { url: "http://cnapi.unbbs.net/" });
      setMods(parseModListHtml(html));
    } catch (err: any) {
      console.error("Failed to fetch mods:", err);
      setError("无法获取汉化列表，请检查网络连接或稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const savedPath = localStorage.getItem("unturned_game_path");
    const currentInstalled = localStorage.getItem("unturned_installed_localization");
    if (currentInstalled) setInstalledMod(currentInstalled);

    if (savedPath) {
      setGamePath(savedPath);
      verifyPath(savedPath);
      checkInstalledStatus(savedPath);
    } else {
      setIsCheckingPath(false);
      setIsPathValid(false);
    }

    fetchOnlineMods();
  }, []);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleInstall = async (mod: LocalizationItem) => {
    if (!isPathValid) {
      setFeedbackMessage({
        type: "error",
        text: "无法安装：未检测到有效的游戏路径，请前往[系统设置]进行配置。",
      });
      return;
    }

    setActionModUrl(mod.downloadUrl);
    setActionStatus("正在下载并提取汉化补丁...");
    setFeedbackMessage(null);

    try {
      await invoke("install_localization_mod", {
        downloadUrl: mod.downloadUrl,
        gamePath: gamePath,
      });
      localStorage.setItem("unturned_installed_localization", mod.title);
      setInstalledMod(mod.title);
      checkInstalledStatus(gamePath);
      setFeedbackMessage({
        type: "success",
        text: `【${mod.title}】下载并自动解压安装成功！已覆盖应用到游戏根目录。`,
      });
    } catch (err: any) {
      console.error("Install failed:", err);
      setFeedbackMessage({ type: "error", text: `安装失败: ${err.toString()}` });
    } finally {
      setActionModUrl(null);
      setActionStatus(null);
    }
  };

  const handleUninstall = async () => {
    if (!gamePath) return;
    setActionStatus("正在清除汉化包并还原官方英文...");
    setFeedbackMessage(null);
    try {
      await invoke("uninstall_localization_mod", { gamePath });
      localStorage.removeItem("unturned_installed_localization");
      setInstalledMod(null);
      setIsInstalled(false);
      setFeedbackMessage({ type: "success", text: "已成功清除所有汉化包文件，并还原官方英文版。" });
    } catch (err: any) {
      console.error("Failed to uninstall:", err);
      setFeedbackMessage({ type: "error", text: `清除汉化失败: ${err.toString()}` });
    } finally {
      setActionStatus(null);
    }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredMods = mods.filter((mod) => {
    const query = searchQuery.toLowerCase();
    return (
      mod.title.toLowerCase().includes(query) || mod.author.toLowerCase().includes(query)
    );
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <Title2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <TranslateRegular /> 汉化补丁
        </Title2>
        <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
          从《未转变者中文社区》API 服务器实时获取最新可用的汉化补丁，一键下载并自动解压覆盖到游戏根目录。
        </Body1>
        <Divider />
      </div>

      {/* Status card */}
      <LocalizationStatusCard
        gamePath={gamePath}
        isInstalled={isInstalled}
        installedMod={installedMod}
        isPathValid={isPathValid}
        isCheckingPath={isCheckingPath}
        actionStatus={actionStatus}
        onUninstall={handleUninstall}
      />

      {/* Action status */}
      {actionStatus && (
        <MessageBar intent="info">
          <MessageBarBody>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Spinner size="tiny" />
              <Text>{actionStatus}</Text>
            </div>
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Feedback */}
      {feedbackMessage && (
        <MessageBar intent={feedbackMessage.type}>
          <MessageBarBody>
            <MessageBarTitle>
              {feedbackMessage.type === "success"
                ? "操作成功"
                : feedbackMessage.type === "error"
                ? "操作失败"
                : "提示"}
            </MessageBarTitle>
            {feedbackMessage.text}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Search + Refresh */}
      <div className={styles.searchBarRow}>
        <Input
          contentBefore={<SearchRegular />}
          placeholder="搜索汉化补丁或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
          disabled={isLoading}
        />
        <Button
          icon={<ArrowClockwiseRegular />}
          onClick={fetchOnlineMods}
          disabled={isLoading || !!actionStatus}
        >
          刷新列表
        </Button>
      </div>

      {/* Mod list */}
      {isLoading ? (
        <div className={styles.emptyState}>
          <Spinner size="large" label="正在拉取最新汉化补丁列表..." />
        </div>
      ) : error ? (
        <MessageBar intent="error">
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      ) : filteredMods.length === 0 ? (
        <div className={styles.emptyState}>
          <InfoRegular style={{ fontSize: "32px" }} />
          <Text>没有找到匹配的汉化补丁</Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredMods.map((mod, index) => (
            <ModCard
              key={index}
              mod={mod}
              isInstalled={installedMod === mod.title}
              isInstalling={actionModUrl === mod.downloadUrl}
              isPathValid={isPathValid}
              actionStatus={actionStatus}
              onInstall={handleInstall}
            />
          ))}
        </div>
      )}
    </div>
  );
};
