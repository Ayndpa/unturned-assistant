import React, { useState, useEffect } from "react";
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
  RadioGroup,
  Radio,
  Divider,
  Badge,
  mergeClasses
} from "@fluentui/react-components";
import {
  SettingsRegular,
  FolderRegular,
  InfoRegular,
  ColorRegular,
  PersonRegular,
  CodeRegular
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { FaGithub } from "react-icons/fa";
import { GiCargoCrate } from "react-icons/gi";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("28px"),
    padding: "24px",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "4px",
    flexShrink: 0,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  row: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  pathInputGroup: {
    display: "flex",
    ...shorthands.gap("8px"),
    width: "100%",
  },
  aboutCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    ...shorthands.padding("20px"),
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
    position: "relative",
    overflow: "hidden",
  },
  aboutHeader: {
    display: "flex",
    flexDirection: "row",
    ...shorthands.gap("16px"),
    alignItems: "center",
  },
  aboutLogoContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(4px)",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow4,
    flexShrink: 0,
  },
  aboutContent: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  aboutTitleRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    ...shorthands.gap("8px"),
    flexWrap: "wrap",
  },
  aboutTitle: {
    fontWeight: tokens.fontWeightBold,
    fontSize: "18px",
    color: tokens.colorNeutralForeground1,
  },
  aboutDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: "13px",
    lineHeight: "20px",
  },
  aboutMetaSection: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(4px)",
    ...shorthands.padding("12px"),
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  aboutMetaRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    ...shorthands.gap("8px"),
    flexWrap: "wrap",
  },
  aboutMetaLabel: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("4px"),
    color: tokens.colorNeutralForeground3,
    fontSize: "12px",
    fontWeight: tokens.fontWeightSemibold,
    width: "80px",
    flexShrink: 0,
  },
  aboutMetaBadgeContainer: {
    display: "flex",
    flexDirection: "row",
    ...shorthands.gap("6px"),
    flexWrap: "wrap",
  },
  aboutActions: {
    display: "flex",
    flexDirection: "row",
    ...shorthands.gap("12px"),
    marginTop: "16px",
    ...shorthands.padding("12px", "20px"),
    ...shorthands.margin("0px", "-20px", "-20px", "-20px"),
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  colorPickerContainer: {
    display: "flex",
    flexDirection: "row",
    ...shorthands.gap("12px"),
    marginTop: "4px",
    marginBottom: "4px",
    flexWrap: "wrap", // Allow wrapping if there are many colors!
  },
  colorButton: {
    width: "28px",
    height: "28px",
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.border("2px", "solid", "transparent"),
    cursor: "pointer",
    boxShadow: tokens.shadow4,
    transitionProperty: "transform, border-color, box-shadow",
    transitionDuration: "0.2s",
    "&:hover": {
      transform: "scale(1.1)",
      boxShadow: tokens.shadow8,
    },
    "&:active": {
      transform: "scale(0.95)",
    }
  },
  colorButtonSelected: {
    ...shorthands.borderColor(tokens.colorNeutralForeground1),
    boxShadow: tokens.shadow16,
    transform: "scale(1.1)",
  },
});

const colorPresets = [
  { value: "#0078d4", label: "默认蓝 (Default)", color: "#0078d4" },
  { value: "#2e914c", label: "生存绿 (Green)", color: "#2e914c" },
  { value: "#8700db", label: "皇家紫 (Purple)", color: "#8700db" },
  { value: "#e65100", label: "辐射橙 (Orange)", color: "#e65100" },
  { value: "#e6002c", label: "末日红 (Red)", color: "#e6002c" },
  { value: "#008c90", label: "青色 (Teal)", color: "#008c90" },
  { value: "#dc0096", label: "霓虹粉 (Pink)", color: "#dc0096" },
  { value: "#ca9f00", label: "警戒黄 (Yellow)", color: "#ca9f00" },
  { value: "#646f79", label: "简约灰 (Gray)", color: "#646f79" },
] as const;

const normalizeVersion = (value: string): string =>
  (value || "").trim().replace(/^v/i, "");

const formatReleaseDate = (isoDate?: string): string => {
  if (!isoDate) return "发布时间未知";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "发布时间异常";
  return date.toLocaleString();
};

const formatSourceLabel = (source: string): string => source;

type UpdateCheckStatus =
  | "idle"
  | "checking"
  | "upToDate"
  | "available"
  | "downloading"
  | "error";

interface RemoteVersionInfo {
  version: string;
  source: string;
  releaseUrl?: string;
  publishedAt?: string;
}

interface UpdateCheckResult {
  status: UpdateCheckStatus;
  latest: RemoteVersionInfo | null;
  message: string;
}

interface SettingsViewProps {
  themeMode: "light" | "dark" | "system";
  onChangeThemeMode: (mode: "light" | "dark" | "system") => void;
  themeColor: string;
  onChangeThemeColor: (color: string) => void;
  currentSystemColor: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themeMode,
  onChangeThemeMode,
  themeColor,
  onChangeThemeColor,
  currentSystemColor
}) => {
  const styles = useStyles();
  const [gamePath, setGamePath] = useState("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Unturned");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);
  const [customColor, setCustomColor] = useState(themeColor === "windows" ? "" : themeColor);
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult>({
    status: "idle",
    latest: null,
    message: "点击“检查更新”以获取最新版本信息",
  });
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  useEffect(() => {
    const savedPath = localStorage.getItem("unturned_game_path");
    if (savedPath) {
      setGamePath(savedPath);
    }
  }, []);

  useEffect(() => {
    if (themeColor !== "windows") {
      setCustomColor(themeColor);
    }
  }, [themeColor]);

  useEffect(() => {
    getVersion()
      .then((_version) => setAppVersion("0.1.7")) // 强制设为旧版本用于测试更新
      .catch((err) => {
        console.error("Failed to get app version:", err);
        setAppVersion("unknown");
      });
  }, []);

  useEffect(() => {
    if (appVersion) {
      void checkForUpdate();
    }
  }, [appVersion]);

  const checkForUpdate = async () => {
    setUpdateCheck({
      status: "checking",
      latest: null,
      message: "正在检查更新...",
    });
    try {
      const update = await check();
      
      if (!update) {
        setUpdateCheck({
          status: "upToDate",
          latest: null,
          message: `当前已是最新版本（v${appVersion}）`,
        });
        return;
      }

      setUpdateCheck({
        status: "available",
        latest: {
          version: update.version,
          source: "GitHub Releases",
        },
        message: `发现新版本：v${update.version}。`,
      });
    } catch (err) {
      console.error("Update check failed:", err);
      setUpdateCheck({
        status: "error",
        latest: null,
        message: err instanceof Error ? err.message : "检查更新失败",
      });
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      const update = await check();
      if (!update) return;

      setUpdateCheck((prev: UpdateCheckResult) => ({ ...prev, status: "downloading", message: "正在下载并安装更新..." }));
      
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            break;
        }
      });

      setUpdateCheck((prev: UpdateCheckResult) => ({ ...prev, message: "安装完成，正在重启..." }));
      await relaunch();
    } catch (err) {
      console.error("Update failed:", err);
      setUpdateCheck({
        status: "error",
        latest: null,
        message: `更新失败: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  };

  const verifyPath = async (path: string) => {
    if (!path) return;
    setIsVerifying(true);
    try {
      const result = await invoke<string>("verify_unturned_path", { gamePath: path });
      setVerificationResult({ success: true, message: result });
    } catch (err) {
      setVerificationResult({ success: false, message: err as string });
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      verifyPath(gamePath);
    }, 1000);
    return () => clearTimeout(timer);
  }, [gamePath]);

  const handlePickFolder = async () => {
    try {
      const selected = await invoke<string | null>("pick_folder");
      if (selected) {
        setGamePath(selected);
        localStorage.setItem("unturned_game_path", selected);
      }
    } catch (err) {
      console.error("Failed to pick folder:", err);
    }
  };

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <Title2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <SettingsRegular /> 助手设置
        </Title2>
        <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
          自定义助手外观主题、配置游戏路径并查看版本详情。
        </Body1>
        <Divider />
      </div>

      {/* Theme Settings */}
      <div className={styles.section}>
        <Title3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ColorRegular /> 外观主题
        </Title3>
        <Card className={styles.aboutCard} style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(10px)" }}>
          <div className={styles.row}>
            <Label id="theme-label" weight="semibold">显示主题：</Label>
            <RadioGroup 
              aria-labelledby="theme-label"
              value={themeMode}
              onChange={(_, data) => onChangeThemeMode(data.value as "light" | "dark" | "system")}
              layout="horizontal"
            >
              <Radio value="light" label="浅色模式 (Light)" />
              <Radio value="dark" label="深色模式 (Dark)" />
              <Radio value="system" label="跟随系统 (System)" />
            </RadioGroup>
          </div>
          
          <Divider appearance="subtle" />

          <div className={styles.row}>
            <Label id="accent-source-label" weight="semibold">强调色来源：</Label>
            <RadioGroup 
              aria-labelledby="accent-source-label"
              value={themeColor === "windows" ? "auto" : "manual"}
              onChange={(_, data) => {
                if (data.value === "auto") {
                  onChangeThemeColor("windows");
                } else {
                  onChangeThemeColor(currentSystemColor);
                }
              }}
              layout="horizontal"
            >
              <Radio value="auto" label="自动 (同步系统)" />
              <Radio value="manual" label="手动 (自选颜色)" />
            </RadioGroup>
          </div>

          <div className={styles.row}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Label id="color-label" weight="semibold">预设与自定义：</Label>
              {themeColor !== "windows" && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div 
                    style={{ 
                      width: "16px", 
                      height: "16px", 
                      borderRadius: "4px", 
                      backgroundColor: customColor || tokens.colorBrandBackground,
                      border: `1px solid ${tokens.colorNeutralStroke1}`
                    }} 
                  />
                  <Input
                    size="small"
                    value={customColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomColor(val);
                      if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(val)) {
                        onChangeThemeColor(val);
                      }
                    }}
                    placeholder="#十六进制"
                    style={{ width: "100px" }}
                  />
                </div>
              )}
            </div>
            <div 
              className={styles.colorPickerContainer}
              style={{ 
                opacity: themeColor === "windows" ? 0.5 : 1,
                pointerEvents: themeColor === "windows" ? "none" : "auto",
                transition: "opacity 0.2s ease"
              }}
            >
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  title={preset.label}
                  disabled={themeColor === "windows"}
                  onClick={() => onChangeThemeColor(preset.value)}
                  className={`${styles.colorButton} ${themeColor === preset.value ? styles.colorButtonSelected : ""}`}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
            </div>
            <Body1 style={{ color: tokens.colorNeutralForeground4, fontSize: "12px" }}>
              {themeColor === "windows" 
                ? `当前检测到系统色: ${currentSystemColor}` 
                : "选择预设颜色或在上方输入代码。"}
            </Body1>
          </div>
        </Card>
      </div>

      {/* Game Paths & Verification */}
      <div className={styles.section}>
        <Title3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FolderRegular /> 游戏路径配置
        </Title3>
        <Card className={styles.aboutCard} style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", backdropFilter: "blur(10px)" }}>
          <div className={styles.row}>
            <Label htmlFor="game-path-input" weight="semibold">安装路径：</Label>
            <div className={styles.pathInputGroup}>
              <Input
                id="game-path-input"
                value={gamePath}
                onChange={(e) => {
                  setGamePath(e.target.value);
                  localStorage.setItem("unturned_game_path", e.target.value);
                  setVerificationResult(null);
                }}
                style={{
                  flex: 1,
                  borderRadius: "4px",
                  border: verificationResult
                    ? `1.5px solid ${verificationResult.success ? "#22c55e" : "#d13438"}`
                    : isVerifying
                      ? `1.5px solid ${tokens.colorNeutralStroke2}`
                      : `1px solid ${tokens.colorNeutralStroke1}`,
                  transition: "border-color 0.2s ease",
                }}
              />
              <Button icon={<FolderRegular />} onClick={handlePickFolder}>
                浏览...
              </Button>
            </div>
            <Body1 style={{
              color: verificationResult
                ? (verificationResult.success ? "#22c55e" : "#d13438")
                : tokens.colorNeutralForeground4,
              fontSize: "12px",
            }}>
              {isVerifying
                ? "正在检测..."
                : verificationResult
                  ? verificationResult.message
                  : "请指向包含 Bundles 文件夹的 Unturned 根目录。"}
            </Body1>
          </div>
        </Card>
      </div>

      {/* About */}
      <div className={styles.section}>
        <Title3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <InfoRegular /> 关于助手
        </Title3>
        <Card className={styles.aboutCard}>
          <div className={styles.aboutHeader}>
            <div className={styles.aboutLogoContainer}>
              <GiCargoCrate style={{ fontSize: "32px", color: tokens.colorBrandForeground1 }} />
            </div>
            <div className={styles.aboutContent}>
              <div className={styles.aboutTitleRow}>
                <span className={styles.aboutTitle}>Unturned 游戏助手</span>
                <Badge color="brand" appearance="tint">v{appVersion || "unknown"}</Badge>
              </div>
              <p className={styles.aboutDescription} style={{ margin: "4px 0 0 0" }}>
                这是一款专为生存联机游戏《Unturned》打造的高效辅助桌面客户端。致力于为玩家提供优质便捷的代码查询、合成查询与地图支持。
              </p>
            </div>
          </div>

          <div className={styles.aboutMetaSection}>
            <div className={styles.aboutMetaRow}>
              <div className={styles.aboutMetaLabel}>
                <InfoRegular style={{ fontSize: "14px" }} /> 更新状态：
              </div>
              <div className={styles.aboutMetaBadgeContainer}>
                <Badge appearance="outline">{updateCheck.status}</Badge>
              </div>
            </div>

            <div className={styles.aboutMetaRow} style={{ marginTop: "4px" }}>
              <div className={styles.aboutMetaLabel}>
                <InfoRegular style={{ fontSize: "14px" }} /> 检查结果：
              </div>
              <div className={styles.aboutMetaBadgeContainer}>
                <Body1 style={{ margin: 0 }}>{updateCheck.message}</Body1>
              </div>
            </div>

            {updateCheck.latest && (
              <div className={styles.aboutMetaRow} style={{ marginTop: "4px" }}>
                <div className={styles.aboutMetaLabel}>
                  <InfoRegular style={{ fontSize: "14px" }} /> 远端版本：
                </div>
                <div className={styles.aboutMetaBadgeContainer}>
                  <Badge appearance="outline">v{normalizeVersion(updateCheck.latest.version)}</Badge>
                  <Badge appearance="outline">{formatSourceLabel(updateCheck.latest.source)}</Badge>
                  <Badge appearance="outline">{formatReleaseDate(updateCheck.latest.publishedAt)}</Badge>
                </div>
              </div>
            )}

            {updateCheck.status === "available" && (
              <div className={styles.aboutActions} style={{ borderTop: "none", marginTop: "8px", paddingTop: "0px" }}>
                <Button
                  appearance="primary"
                  onClick={handleDownloadUpdate}
                >
                  立即下载并安装
                </Button>
                <Button
                  appearance="subtle"
                  onClick={() => openUrl(`https://github.com/Ayndpa/unturned-assistant/releases/latest`)}
                >
                  手动下载
                </Button>
              </div>
            )}

            {updateCheck.status === "downloading" && (
              <div className={styles.row} style={{ marginTop: "8px" }}>
                <div style={{ height: "4px", width: "100%", backgroundColor: tokens.colorNeutralStroke3, borderRadius: "2px", overflow: "hidden" }}>
                  <div 
                    style={{ 
                      height: "100%", 
                      width: `${downloadProgress}%`, 
                      backgroundColor: tokens.colorBrandBackground,
                      transition: "width 0.3s ease" 
                    }} 
                  />
                </div>
                <Body1 style={{ fontSize: "12px", textAlign: "center", color: tokens.colorNeutralForeground4 }}>
                  正在下载: {downloadProgress}%
                </Body1>
              </div>
            )}

            <Divider />

            <div className={styles.aboutMetaRow}>
              <div className={styles.aboutMetaLabel}>
                <CodeRegular style={{ fontSize: "14px" }} /> 主要依赖：
              </div>
              <div className={styles.aboutMetaBadgeContainer}>
                <Badge appearance="outline">React 19</Badge>
                <Badge appearance="outline">Tauri v2</Badge>
                <Badge appearance="outline">Fluent UI v9</Badge>
              </div>
            </div>

            <div className={styles.aboutMetaRow} style={{ marginTop: "4px" }}>
              <div className={styles.aboutMetaLabel}>
                <PersonRegular style={{ fontSize: "14px" }} /> 开发者：
              </div>
              <div className={styles.aboutMetaBadgeContainer}>
                <Badge appearance="outline">Ayndpa</Badge>
              </div>
            </div>
          </div>

          <div className={mergeClasses(styles.aboutActions, "card-actions-area")}>
            <Button
              appearance="primary"
              icon={<FaGithub />}
              onClick={() => openUrl("https://github.com/Ayndpa/unturned-assistant")}
            >
              GitHub 仓库
            </Button>
            <Button
              appearance="outline"
              onClick={() => openUrl("https://github.com/Ayndpa/unturned-assistant/issues")}
            >
              问题反馈
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
