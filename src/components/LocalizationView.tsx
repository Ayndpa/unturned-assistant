import React, { useState, useEffect } from "react";
import {
  Title2,
  Title3,
  Body1,
  Card,
  Button,
  Input,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Badge,
} from "@fluentui/react-components";
import {
  ArrowDownloadRegular,
  DeleteRegular,
  SearchRegular,
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  InfoRegular,
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("20px"),
    padding: "24px",
    height: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
  },
  headerBanner: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundImage: "linear-gradient(135deg, #107c41 0%, #1f9a55 100%)", // Green theme for installation/sync
    color: "#ffffff",
    padding: "24px 32px",
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow16,
    flexShrink: 0,
  },
  bannerTitle: {
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  bannerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    maxWidth: "600px",
  },
  statusCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    ...shorthands.padding("16px"),
    flexShrink: 0,
  },
  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  statusDetails: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("6px"),
    color: tokens.colorNeutralForeground2,
    fontSize: "13px",
  },
  bold: {
    fontWeight: "bold",
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
  modCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transitionProperty: "transform, box-shadow",
    transitionDuration: "0.2s",
    transitionTimingFunction: "ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow8,
    },
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
  },
  modCardBody: {
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  modCardHeader: {
    display: "flex",
    ...shorthands.gap("12px"),
    alignItems: "center",
    marginBottom: "12px",
  },
  modIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  modTitleContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  modTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "15px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  modAuthor: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  modInfoGrid: {
    display: "grid",
    gridTemplateColumns: "85px 1fr",
    ...shorthands.gap("6px", "12px"),
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
    marginBottom: "16px",
    flex: 1,
  },
  infoLabel: {
    color: tokens.colorNeutralForeground4,
  },
  modActions: {
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    ...shorthands.padding("12px", "16px"),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: tokens.colorNeutralBackground2,
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

interface LocalizationItem {
  status: string;
  iconUrl: string;
  title: string;
  author: string;
  createdTime: string;
  updatedTime: string;
  syncTime: string;
  fileSize: string;
  downloadUrl: string;
}

export const LocalizationView: React.FC = () => {
  const styles = useStyles();
  const [mods, setMods] = useState<LocalizationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game Path Status
  const [gamePath, setGamePath] = useState("");
  const [isPathValid, setIsPathValid] = useState(false);
  const [isCheckingPath, setIsCheckingPath] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  // Installed localization tracking
  const [installedMod, setInstalledMod] = useState<string | null>(null);

  // Action status (installing/uninstalling)
  const [actionModUrl, setActionModUrl] = useState<string | null>(null); // URL of mod being installed
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  const checkInstalledStatus = async (path: string) => {
    if (!path) return;
    try {
      const installed = await invoke<boolean>("is_localization_installed", { gamePath: path });
      setIsInstalled(installed);
    } catch (err) {
      console.error("Failed to check installed status:", err);
    }
  };

  useEffect(() => {
    // Read game path and installed state from localStorage
    const savedPath = localStorage.getItem("unturned_game_path");
    const currentInstalled = localStorage.getItem("unturned_installed_localization");
    
    if (currentInstalled) {
      setInstalledMod(currentInstalled);
    }

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
      const items = parseHtml(html);
      setMods(items);
    } catch (err: any) {
      console.error("Failed to fetch mods:", err);
      setError("无法获取汉化列表，请检查网络连接或稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  const parseHtml = (htmlString: string): LocalizationItem[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const rows = doc.querySelectorAll("table.table-hover tbody tr");
    
    const parsedData: LocalizationItem[] = [];
    
    rows.forEach((row) => {
      const tds = row.querySelectorAll("td");
      if (tds.length < 8) return; // Skip invalid rows
      
      // Status
      const statusText = tds[0]?.querySelector(".label")?.textContent?.trim() || "正常";
      
      // Image / Logo
      const imgEl = tds[1]?.querySelector("img");
      let imgSrc = imgEl?.getAttribute("src") || "";
      if (imgSrc && !imgSrc.startsWith("http")) {
        imgSrc = `http://cnapi.unbbs.net/${imgSrc}`;
      }
      
      // Title & Author
      const titleTd = tds[2];
      const authorEl = titleTd?.querySelector("small");
      const authorText = authorEl?.textContent?.trim() || "";
      
      // Extract title text, removing small element
      let titleText = "";
      if (titleTd) {
        const clonedTd = titleTd.cloneNode(true) as HTMLElement;
        const smallNode = clonedTd.querySelector("small");
        if (smallNode) {
          clonedTd.removeChild(smallNode);
        }
        titleText = clonedTd.textContent?.trim() || "";
      }
      
      // Dates & Size
      const createdText = tds[3]?.textContent?.trim() || "";
      const updatedText = tds[4]?.textContent?.trim() || "";
      const syncText = tds[5]?.textContent?.trim() || "";
      const sizeText = tds[6]?.textContent?.trim() || "";
      
      // Download Link
      const actionA = tds[7]?.querySelector("a");
      let downloadLink = actionA?.getAttribute("href") || "";
      if (downloadLink && !downloadLink.startsWith("http")) {
        downloadLink = `http://cnapi.unbbs.net/${downloadLink}`;
      }
      
      if (titleText && downloadLink) {
        parsedData.push({
          status: statusText,
          iconUrl: imgSrc,
          title: titleText,
          author: authorText.replace(/作者\s*:\s*/, ""),
          createdTime: createdText.replace(/创建时间：\s*/, ""),
          updatedTime: updatedText.replace(/最后更新时间：\s*/, ""),
          syncTime: syncText.replace(/最新同步时间：\s*/, ""),
          fileSize: sizeText.replace(/文件大小：\s*/, ""),
          downloadUrl: downloadLink,
        });
      }
    });
    
    return parsedData;
  };

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

      // Update state on success
      localStorage.setItem("unturned_installed_localization", mod.title);
      setInstalledMod(mod.title);
      checkInstalledStatus(gamePath);
      setFeedbackMessage({
        type: "success",
        text: `【${mod.title}】下载并自动解压安装成功！已覆盖应用到游戏根目录。`,
      });
    } catch (err: any) {
      console.error("Install failed:", err);
      setFeedbackMessage({
        type: "error",
        text: `安装失败: ${err.toString()}`,
      });
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
      setFeedbackMessage({
        type: "success",
        text: "已成功清除所有汉化包文件，并还原官方英文版。",
      });
    } catch (err: any) {
      console.error("Failed to uninstall:", err);
      setFeedbackMessage({
        type: "error",
        text: `清除汉化失败: ${err.toString()}`,
      });
    } finally {
      setActionStatus(null);
    }
  };

  const filteredMods = mods.filter((mod) => {
    const query = searchQuery.toLowerCase();
    return (
      mod.title.toLowerCase().includes(query) ||
      mod.author.toLowerCase().includes(query)
    );
  });

  return (
    <div className={styles.container}>
      {/* Banner */}
      <div className={styles.headerBanner}>
        <Title2 className={styles.bannerTitle}>汉化补丁一键下载与安装</Title2>
        <Body1 className={styles.bannerSubtitle}>
          从《未转变者中文社区》API 服务器实时获取最新可用的汉化补丁，一键下载并自动解压覆盖到游戏根目录，告别繁琐的手动替换。
        </Body1>
      </div>

      {/* Target Path Status Section */}
      <Card className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <Title3>本地汉化状态</Title3>
          {isInstalled ? (
            <Badge color="success" icon={<CheckmarkCircleRegular />}>
              已检测到汉化补丁 {installedMod && `(${installedMod})`}
            </Badge>
          ) : (
            <Badge color="warning">
              未检测到汉化
            </Badge>
          )}
        </div>

        <div className={styles.statusDetails}>
          <div>
            <span className={styles.infoLabel}>Unturned 根目录：</span>
            <span className={styles.bold}>{gamePath || "未配置"}</span>
            <span style={{ color: tokens.colorNeutralForeground4, marginLeft: "12px", fontSize: "12px" }}>
              (下载的汉化包将自动解压并覆盖安装至此根目录下)
            </span>
          </div>
          <div>
            <span className={styles.infoLabel}>状态检测：</span>
            {isCheckingPath ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Spinner size="tiny" /> 正在检测路径...
              </span>
            ) : isPathValid ? (
              <span style={{ color: tokens.colorPaletteGreenForeground1, fontWeight: "bold" }}>
                ✓ 游戏路径有效，随时可以进行安装
              </span>
            ) : (
              <span style={{ color: tokens.colorPaletteRedForeground1, fontWeight: "bold" }}>
                ✗ 游戏路径无效或未配置，请先到「系统设置」选择正确的 Unturned 安装路径
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
          {isInstalled && (
            <Button
              appearance="secondary"
              icon={<DeleteRegular />}
              onClick={handleUninstall}
              disabled={!gamePath || !!actionStatus}
            >
              一键清除汉化并还原英文
            </Button>
          )}
          {!isPathValid && !isCheckingPath && (
            <MessageBar intent="warning">
              <MessageBarBody>
                请确保游戏路径正确（必须包含 Bundles 文件夹）以保证汉化能正常覆盖。
              </MessageBarBody>
            </MessageBar>
          )}
        </div>
      </Card>

      {/* Action / Feedback Notifications */}
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

      {feedbackMessage && (
        <MessageBar intent={feedbackMessage.type}>
          <MessageBarBody>
            <MessageBarTitle>
              {feedbackMessage.type === "success" ? "操作成功" : feedbackMessage.type === "error" ? "操作失败" : "提示"}
            </MessageBarTitle>
            {feedbackMessage.text}
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Filter and Refresh bar */}
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

      {/* Main List */}
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
          {filteredMods.map((mod, index) => {
            const isInstalling = actionModUrl === mod.downloadUrl;
            const isInstalled = installedMod === mod.title;

            return (
              <Card key={index} className={styles.modCard}>
                <div className={styles.modCardBody}>
                  <div className={styles.modCardHeader}>
                    {mod.iconUrl ? (
                      <img src={mod.iconUrl} alt={mod.title} className={styles.modIcon} />
                    ) : (
                      <div className={styles.modIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowDownloadRegular style={{ fontSize: "24px", color: tokens.colorNeutralForeground4 }} />
                      </div>
                    )}
                    <div className={styles.modTitleContainer}>
                      <span className={styles.modTitle} title={mod.title}>{mod.title}</span>
                      <span className={styles.modAuthor} title={mod.author}>作者：{mod.author}</span>
                    </div>
                    <Badge color={mod.status === "正常" ? "success" : "warning"}>
                      {mod.status}
                    </Badge>
                  </div>

                  <div className={styles.modInfoGrid}>
                    <span className={styles.infoLabel}>文件大小：</span>
                    <span>{mod.fileSize}</span>
                    
                    <span className={styles.infoLabel}>发布日期：</span>
                    <span>{mod.createdTime}</span>

                    <span className={styles.infoLabel}>最后更新：</span>
                    <span>{mod.updatedTime}</span>

                    <span className={styles.infoLabel}>同步时间：</span>
                    <span>{mod.syncTime}</span>
                  </div>
                </div>

                <div className={styles.modActions}>
                  {isInstalled ? (
                    <span style={{ color: tokens.colorPaletteGreenForeground1, display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", fontWeight: "semibold" }}>
                      <CheckmarkCircleRegular /> 已应用汉化
                    </span>
                  ) : (
                    <span></span>
                  )}
                  
                  <Button
                    appearance={isInstalled ? "secondary" : "primary"}
                    icon={isInstalling ? <Spinner size="tiny" /> : <ArrowDownloadRegular />}
                    onClick={() => handleInstall(mod)}
                    disabled={isInstalling || !!actionStatus || !isPathValid}
                  >
                    {isInstalling ? "正在安装..." : isInstalled ? "覆盖安装" : "一键安装"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
