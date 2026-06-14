import { useState, useEffect, useCallback, useRef } from "react";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  shorthands,
  tokens,
  TabList,
  Tab,
  Text,
  Spinner,
  createLightTheme,
  createDarkTheme,
  BrandVariants,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Badge,
  useToastController,
  useId,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
} from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import {
  HomeRegular,
  LibraryRegular,
  PlayRegular,
  SettingsRegular,
  TranslateRegular,
  WrenchRegular,
  NavigationRegular,
  SparkleRegular,
  ArrowDownloadRegular,
  OpenRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import { getVersion } from "@tauri-apps/api/app";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { HomeView } from "./components/HomeView";
import { IdSearchView } from "./components/IdSearchView";
import { SettingsView } from "./components/SettingsView";
import { LocalizationView } from "./components/LocalizationView";
import { SystemOptimizationView } from "./components/SystemOptimizationView";
import { AiTranslationView } from "./components/AiTranslationView";
import { TitleBar } from "./components/TitleBar";
import { GiCargoCrate } from "react-icons/gi";
import { openUrl } from "@tauri-apps/plugin-opener";
import "./App.css";

const useStyles = makeStyles({
// ... (omitting styles which are unchanged)

  rootContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: "transparent",
    position: "relative",
  },
  appContainer: {
    display: "flex",
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "transparent", // Show acrylic through
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    position: "relative",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "var(--app-sidebar-tint)",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    ...shorthands.padding("16px", "12px"),
    boxSizing: "border-box",
    zIndex: 12000,
    transitionProperty: "transform, width, opacity",
    transitionDuration: "0.2s",
    transitionTimingFunction: "ease",
    "@media (max-width: 900px)": {
      position: "absolute",
      left: "0",
      top: "0",
      bottom: "0",
      backgroundColor: "var(--app-sidebar-tint-solid, rgba(240, 240, 240, 0.95))",
      backdropFilter: "blur(40px)",
      boxShadow: tokens.shadow16,
      transform: "translateX(-100%)",
      opacity: 0,
      pointerEvents: "none",
      borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    }
  },
  sidebarMobileOpen: {
    "@media (max-width: 900px)": {
      transform: "translateX(0)",
      opacity: 1,
      pointerEvents: "auto",
    }
  },
  sidebarOverlay: {
    display: "none",
    "@media (max-width: 900px)": {
      display: "block",
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      backdropFilter: "blur(2px)",
      zIndex: 11500,
      opacity: 0,
      pointerEvents: "none",
      transitionProperty: "opacity",
      transitionDuration: "0.2s",
    }
  },
  sidebarOverlayVisible: {
    "@media (max-width: 900px)": {
      opacity: 1,
      pointerEvents: "auto",
    }
  },
  mobileHeader: {
    display: "none",
    "@media (max-width: 900px)": {
      display: "flex",
      alignItems: "center",
      ...shorthands.padding("8px", "12px"),
      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
      backgroundColor: "var(--app-sidebar-tint)",
      ...shorthands.gap("12px"),
      flexShrink: 0,
    }
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("10px"),
    ...shorthands.padding("8px", "12px", "24px", "12px"),
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: "24px",
    color: tokens.colorBrandForeground1,
  },
  logoText: {
    fontWeight: tokens.fontWeightBold,
    letterSpacing: "0.5px",
  },
  navSection: {
    flex: 1,
  },
  tabList: {
    width: "100%",
    backgroundColor: "transparent",
  },
  tabItem: {
    width: "100%",
    justifyContent: "flex-start",
    height: "40px",
    ...shorthands.margin("4px", "0px"),
    backgroundColor: "transparent",
  },
  footerSection: {
    ...shorthands.padding("8px", "12px"),
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: "16px",
  },
  footerText: {
    color: tokens.colorNeutralForeground3,
    fontSize: "11px",
    fontWeight: tokens.fontWeightSemibold,
  },
  mainContent: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  contentWrapper: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    position: "relative",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    ...shorthands.gap("12px"),
  }
});

// Helper to parse hex color to RGB
function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Helper to convert RGB to hex
function rgbToHex(r: number, g: number, b: number) {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return "#" + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
}

// Mix two colors
function mixColors(color1: {r:number; g:number; b:number}, color2: {r:number; g:number; b:number}, weight: number) {
  return {
    r: color1.r * weight + color2.r * (1 - weight),
    g: color1.g * weight + color2.g * (1 - weight),
    b: color1.b * weight + color2.b * (1 - weight)
  };
}

type GitHubUpdateSource = "release";

type AppUpdateCheckStatus =
  | "idle"
  | "checking"
  | "upToDate"
  | "available"
  | "error";

interface RemoteVersionInfo {
  version: string;
  source: GitHubUpdateSource;
  releaseUrl?: string;
  publishedAt?: string;
  changelog?: string;
}

interface UpdateCheckResult {
  status: AppUpdateCheckStatus;
  latest: RemoteVersionInfo | null;
  message: string;
  isNewer: boolean;
}

const UPDATE_REPO_OWNER = "Ayndpa";
const UPDATE_REPO_NAME = "unturned-assistant";
const UPDATE_BRANCH = "master";
const UPDATE_RELEASE_URL = `https://api.github.com/repos/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/releases/latest`;
const UPDATE_CHANGELOG_URL = `https://raw.githubusercontent.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}/refs/heads/${UPDATE_BRANCH}/CHANGELOG.md`;
const UPDATE_REPO_URL = `https://github.com/${UPDATE_REPO_OWNER}/${UPDATE_REPO_NAME}`;

const normalizeVersion = (value: string): string =>
  (value || "").trim().replace(/^v/i, "");

const compareVersions = (left: string, right: string): number => {
  const leftParts = normalizeVersion(left).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeVersion(right).split(".").map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let i = 0; i < length; i += 1) {
    const a = leftParts[i] || 0;
    const b = rightParts[i] || 0;
    if (a > b) return 1;
    if (a < b) return -1;
  }

  return 0;
};

const readReleaseVersion = async (): Promise<RemoteVersionInfo | null> => {
  const response = await fetch(UPDATE_RELEASE_URL, {
    headers: {
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub Release API 请求失败：${response.status}`);
  }

  const data = (await response.json()) as {
    tag_name?: string;
    html_url?: string;
    published_at?: string;
  };
  const version = data.tag_name || data.html_url?.match(/\/tag\/(.+)$/)?.[1];

  if (!version) return null;

  return {
    version,
    source: "release",
    releaseUrl: data.html_url,
    publishedAt: data.published_at,
  };
};

const fetchChangelog = async (): Promise<string | null> => {
  try {
    const response = await fetch(UPDATE_CHANGELOG_URL);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
};

const fetchLatestRemoteVersion = async (): Promise<RemoteVersionInfo> => {
  const changelog = await fetchChangelog();
  
  const releaseInfo = await readReleaseVersion();
  if (releaseInfo) {
    return {
      ...releaseInfo,
      changelog: changelog || undefined,
    };
  }

  throw new Error("无法从 GitHub 获取到版本信息");
};

const formatReleaseDate = (isoDate?: string): string => {
  if (!isoDate) return "未知发布时间";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "发布时间异常";
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const normalizeDisplayVersion = (value?: string): string =>
  !value || value === "unknown"
    ? "unknown"
    : `v${normalizeVersion(value)}`;

// Generate BrandVariants from base hex
function generateBrandVariants(baseHex: string): BrandVariants {
  const base = hexToRgb(baseHex);
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };

  const mixWithBlack = (weight: number) => {
    const mixed = mixColors(base, black, weight);
    return rgbToHex(mixed.r, mixed.g, mixed.b);
  };

  const mixWithWhite = (weight: number) => {
    const mixed = mixColors(base, white, weight);
    return rgbToHex(mixed.r, mixed.g, mixed.b);
  };

  return {
    10: mixWithBlack(0.15),
    20: mixWithBlack(0.3),
    30: mixWithBlack(0.5),
    40: mixWithBlack(0.65),
    50: mixWithBlack(0.8),
    60: baseHex,
    70: mixWithWhite(0.85),
    80: mixWithWhite(0.7),
    90: mixWithWhite(0.55),
    100: mixWithWhite(0.4),
    110: mixWithWhite(0.3),
    120: mixWithWhite(0.2),
    130: mixWithWhite(0.12),
    140: mixWithWhite(0.07),
    150: mixWithWhite(0.03),
    160: mixWithWhite(0.01)
  };
}

interface AppContentProps {
  themeMode: "light" | "dark" | "system";
  setThemeMode: (mode: "light" | "dark" | "system") => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  windowsColor: string;
  isDark: boolean;
  toasterId: string;
}

function AppContent({
  themeMode,
  setThemeMode,
  themeColor,
  setThemeColor,
  windowsColor,
  isDark,
  toasterId
}: AppContentProps) {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult>({
    status: "idle",
    latest: null,
    message: "",
    isNewer: false,
  });
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string>("");
  const hasCheckedForUpdateRef = useRef(false);
  const isDownloadingRef = useRef(false);

  const handleDownloadUpdate = async () => {
    if (isDownloadingRef.current) {
      return;
    }

    isDownloadingRef.current = true;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus("正在准备下载...");

    try {
      const update = await check();
      if (!update) {
        isDownloadingRef.current = false;
        setIsDownloading(false);
        setDownloadStatus("未找到可用更新");
        return;
      }
      
      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            setDownloadStatus("正在开始下载...");
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              const progress = Math.round((downloaded / contentLength) * 100);
              setDownloadProgress(progress);
              setDownloadStatus(`正在下载: ${progress}%`);
            }
            break;
          case 'Finished':
            setDownloadStatus("下载完成，正在安装...");
            break;
        }
      });

      setDownloadStatus("安装完成，正在重启...");
      await relaunch();
    } catch (err) {
      console.error("Update failed:", err);
      isDownloadingRef.current = false;
      setIsDownloading(false);
      setDownloadStatus(`更新失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    getVersion()
      .then((version) => setAppVersion(version))
      .catch((err) => {
        console.error("Failed to get app version:", err);
        setAppVersion("unknown");
      });
  }, []);

  const { dispatchToast } = useToastController(toasterId);

  const checkForUpdate = async (manual = false) => {
    if (manual) {
      dispatchToast(
        <Toast>
          <ToastTitle>检查更新</ToastTitle>
          <ToastBody>正在获取最新版本信息...</ToastBody>
        </Toast>,
        { intent: "info" }
      );
    }

    setUpdateCheck({
      status: "checking",
      latest: null,
      message: "正在检查更新...",
      isNewer: false,
    });

    try {
      const latest = await fetchLatestRemoteVersion();
      const remote = normalizeVersion(latest.version);
      const current = normalizeVersion(appVersion);

      if (!current || current === "unknown") {
        setUpdateCheck({
          status: "error",
          latest,
          message: "当前客户端版本未知，无法进行版本比对，建议手动访问发布页检查更新。",
          isNewer: false,
        });
        if (manual) {
          dispatchToast(
            <Toast>
              <ToastTitle>检查失败</ToastTitle>
              <ToastBody>无法识别当前客户端版本。</ToastBody>
            </Toast>,
            { intent: "warning" }
          );
        }
        return;
      }

      const isNewer = compareVersions(remote, current) > 0;
      if (!isNewer) {
        setUpdateCheck({
          status: "upToDate",
          latest,
          message: `当前已是最新版本（v${current}）`,
          isNewer: false,
        });
        setUpdateDialogOpen(false);
        if (manual) {
          dispatchToast(
            <Toast>
              <ToastTitle>检查完成</ToastTitle>
              <ToastBody>当前已是最新版本。</ToastBody>
            </Toast>,
            { intent: "success" }
          );
        }
        return;
      }

      setUpdateCheck({
        status: "available",
        latest,
        message: "发现新版本",
        isNewer: true,
      });
      setUpdateDialogOpen(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "检查更新失败";
      setUpdateCheck({
        status: "error",
        latest: null,
        message: errorMsg,
        isNewer: false,
      });
      if (manual) {
        dispatchToast(
          <Toast>
            <ToastTitle>检查失败</ToastTitle>
            <ToastBody>{errorMsg}</ToastBody>
          </Toast>,
          { intent: "error" }
        );
      }
    }
  };

  useEffect(() => {
    if (appVersion && !hasCheckedForUpdateRef.current) {
      hasCheckedForUpdateRef.current = true;
      void checkForUpdate();
    }
  }, [appVersion]);

  const handleThemeModeChange = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    localStorage.setItem("theme_mode", mode);
  };

  const handleThemeColorChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem("theme_color", color);
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeView onNavigate={(page) => setActiveTab(page)} />;
      case "id-search":
        return <IdSearchView onNavigate={(page) => setActiveTab(page)} />;
      case "localization":
        return <LocalizationView />;
      case "ai-translation":
        return <AiTranslationView />;
      case "ime-compatibility":
        return <SystemOptimizationView />;
      case "settings":
        return (
          <SettingsView
            themeMode={themeMode}
            onChangeThemeMode={handleThemeModeChange}
            themeColor={themeColor}
            onChangeThemeColor={handleThemeColorChange}
            currentSystemColor={windowsColor}
            onCheckForUpdate={() => void checkForUpdate(true)}
            isUpdateAvailable={updateCheck.status === "available"}
          />
        );
      case "maps":
        return (
          <div className={styles.loadingContainer}>
            <Spinner size="huge" label="正在建设中..." labelPosition="below" />
            <Text style={{ color: tokens.colorNeutralForeground4, marginTop: "8px" }}>
              敬请期待！下一个版本将为您带来高清地图雷达。
            </Text>
          </div>
        );
      default:
        return <HomeView onNavigate={(page) => setActiveTab(page)} />;
    }
  };

  const tabNames: Record<string, string> = {
    home: "首页推荐",
    "id-search": "物品百科",
    maps: "地图雷达",
    localization: "汉化补丁",
    "ai-translation": "AI 翻译",
    "ime-compatibility": "系统优化",
    settings: "系统设置"
  };

  const activeTabText = tabNames[activeTab] || "Unturned 助手";

  return (
    <>
      <Dialog open={updateDialogOpen} onOpenChange={(_, data) => setUpdateDialogOpen(data.open)}>
        <DialogSurface style={{ padding: 0, overflow: "hidden", maxWidth: "460px" }}>
          <DialogBody style={{ padding: 0, display: "flex", flexDirection: "column", width: "100%" }}>
            <DialogTitle style={{ padding: "24px 24px 16px 24px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <SparkleRegular style={{ color: tokens.colorBrandForeground1, fontSize: "24px" }} />
                发现新版本
              </div>
            </DialogTitle>
            <DialogContent style={{ padding: "0 24px 24px 24px", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Version Card */}
                <div style={{ 
                  backgroundColor: tokens.colorNeutralBackground2,
                  borderRadius: tokens.borderRadiusMedium,
                  padding: "16px",
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <NavigationRegular style={{ fontSize: "16px", color: tokens.colorNeutralForeground3 }} />
                      <Text size={200} weight="semibold">版本信息</Text>
                    </div>
                    <Badge appearance="tint" color="brand">v{normalizeVersion(updateCheck.latest?.version || "")}</Badge>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>当前版本</Text>
                      <Text size={200}>{normalizeDisplayVersion(appVersion)}</Text>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>发布时间</Text>
                      <Text size={200}>{formatReleaseDate(updateCheck.latest?.publishedAt)}</Text>
                    </div>
                  </div>
                </div>

                {/* Release Notes */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <Text size={200} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>更新说明</Text>
                  <div style={{ 
                    maxHeight: "150px", 
                    overflowY: "auto", 
                    padding: "8px 12px",
                    backgroundColor: tokens.colorNeutralBackground3,
                    borderRadius: tokens.borderRadiusSmall,
                    borderLeft: `3px solid ${tokens.colorBrandForeground1}`
                  }}>
                    <Text 
                      size={200} 
                      style={{ 
                        color: tokens.colorNeutralForeground2, 
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        display: "block"
                      }}
                    >
                      {updateCheck.latest?.changelog || "暂无发布说明"}
                    </Text>
                  </div>
                </div>

                {/* Progress Bar */}
                {isDownloading && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={100} weight="semibold">{downloadStatus}</Text>
                      <Text size={100}>{downloadProgress}%</Text>
                    </div>
                    <div style={{ height: "6px", width: "100%", backgroundColor: tokens.colorNeutralStroke3, borderRadius: "3px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          height: "100%", 
                          width: `${downloadProgress}%`, 
                          backgroundColor: tokens.colorBrandBackground,
                          transition: "width 0.3s ease",
                          backgroundImage: "linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)",
                          backgroundSize: "1rem 1rem"
                        }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>

            <div style={{ 
              display: "flex", 
              gap: "12px",
              padding: "16px 24px",
              backgroundColor: tokens.colorNeutralBackground2,
              borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
              width: "auto",
              boxSizing: "border-box",
              flexShrink: 0,
              marginLeft: "0",
              marginRight: "0",
              alignSelf: "stretch"
            }}>
              <Button 
                style={{ flex: 1 }}
                appearance="subtle" 
                icon={<DismissRegular />}
                onClick={() => setUpdateDialogOpen(false)} 
                disabled={isDownloading}
              >
                稍后
              </Button>
              <Button
                style={{ flex: 1 }}
                appearance="outline"
                icon={<OpenRegular />}
                onClick={() => {
                  const link = updateCheck.latest?.releaseUrl || UPDATE_REPO_URL;
                  void openUrl(link);
                }}
                disabled={isDownloading}
              >
                手动下载
              </Button>
              <Button
                style={{ flex: 1 }}
                appearance="primary"
                icon={<ArrowDownloadRegular />}
                onClick={handleDownloadUpdate}
                disabled={isDownloading}
              >
                立即安装
              </Button>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>
      <div className={`${styles.rootContainer} app-acrylic-shell`} data-theme={isDark ? "dark" : "light"}>
        <TitleBar />
        <div className={styles.appContainer}>
          {/* Navigation Sidebar */}
          <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarMobileOpen : ""}`}>
            <div>
              <div className={styles.logoSection}>
                <GiCargoCrate className={styles.logoIcon} style={{ fontSize: "26px" }} />
                <Text size={400} className={styles.logoText}>Unturned 助手</Text>
              </div>
              
              <nav className={styles.navSection}>
                <TabList
                  vertical
                  selectedValue={activeTab}
                  onTabSelect={(_, data) => {
                    setActiveTab(data.value as string);
                    closeSidebar();
                  }}
                  className={`${styles.tabList} sidebar-tablist`}
                >
                  <Tab 
                    value="home" 
                    icon={<HomeRegular />}
                    className={styles.tabItem}
                  >
                    首页推荐
                  </Tab>
                  <Tab 
                    value="id-search" 
                    icon={<LibraryRegular />}
                    className={styles.tabItem}
                  >
                    物品百科
                  </Tab>
                  <Tab 
                    value="maps" 
                    icon={<PlayRegular />}
                    className={styles.tabItem}
                  >
                    地图雷达
                  </Tab>
                  <Tab 
                    value="localization" 
                    icon={<TranslateRegular />}
                    className={styles.tabItem}
                  >
                    汉化补丁
                  </Tab>
                  <Tab 
                    value="ai-translation" 
                    icon={<SparkleRegular />}
                    className={styles.tabItem}
                  >
                    AI 翻译
                  </Tab>
                  <Tab 
                    value="ime-compatibility" 
                    icon={<WrenchRegular />}
                    className={styles.tabItem}
                  >
                    系统优化
                  </Tab>
                  <Tab 
                    value="settings" 
                    icon={<SettingsRegular />}
                    className={styles.tabItem}
                  >
                    系统设置
                  </Tab>
                </TabList>
              </nav>
            </div>

            <div className={styles.footerSection}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Text 
                  className={styles.footerText} 
                  style={{ opacity: 0.8, cursor: "pointer" }}
                  onClick={() => void checkForUpdate(true)}
                  title="检查更新"
                >
                  v{appVersion || "unknown"}
                </Text>
                {updateCheck.status === "available" && (
                  <Badge 
                    size="small" 
                    color="important" 
                    appearance="filled" 
                    style={{ cursor: "pointer", fontSize: "10px" }}
                    onClick={() => void checkForUpdate(true)}
                  >
                    更新
                  </Badge>
                )}
              </div>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className={styles.mainContent}>
            {/* Mobile Nav Bar */}
            <header className={styles.mobileHeader}>
              <Button 
                appearance="subtle" 
                icon={<NavigationRegular />} 
                onClick={toggleSidebar}
              />
              <Text weight="semibold">{activeTabText}</Text>
            </header>

            <div className={styles.contentWrapper}>
              {renderContent()}
            </div>
          </main>

          {/* Mobile Overlay (Moved to bottom for stacking) */}
          <div 
            className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.sidebarOverlayVisible : ""}`} 
            onClick={closeSidebar}
          />
        </div>
      </div>
    </>
  );
}

function App() {
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");
  const [themeColor, setThemeColor] = useState<string>("windows");
  const [windowsColor, setWindowsColor] = useState<string>("#0078d4");
  const [isDark, setIsDark] = useState(false);

  // Load theme configuration on mount
  useEffect(() => {
    const savedColor = localStorage.getItem("theme_color");
    if (savedColor) {
      setThemeColor(savedColor);
    }
    const savedMode = localStorage.getItem("theme_mode") as "light" | "dark" | "system";
    if (savedMode) {
      setThemeMode(savedMode);
    }
  }, []);

  // Fetch Windows accent color when "windows" theme is active
  useEffect(() => {
    if (themeColor === "windows") {
      invoke<string>("get_windows_accent_color")
        .then((color) => {
          setWindowsColor(color);
        })
        .catch((err) => {
          console.error("Failed to get Windows accent color:", err);
        });
    }
  }, [themeColor]);

  // Determine system theme preference
  useEffect(() => {
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      setIsDark(themeMode === "dark");
    }
  }, [themeMode]);

  let currentTheme = isDark ? webDarkTheme : webLightTheme;

  const activeColor = themeColor === "windows" ? windowsColor : themeColor;

  if (activeColor && activeColor !== "#0078d4") {
    try {
      const brand = generateBrandVariants(activeColor);
      currentTheme = isDark ? createDarkTheme(brand) : createLightTheme(brand);
    } catch (err) {
      console.error("Failed to generate brand variants:", err);
    }
  }

  const toasterId = useId("toaster");

  return (
    <FluentProvider theme={currentTheme} style={{ backgroundColor: "transparent" }}>
      <Toaster toasterId={toasterId} position="top-end" pauseOnHover pauseOnWindowBlur />
      <AppContent 
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        themeColor={themeColor}
        setThemeColor={setThemeColor}
        windowsColor={windowsColor}
        isDark={isDark}
        toasterId={toasterId}
      />
    </FluentProvider>
  );
}

export default App;
