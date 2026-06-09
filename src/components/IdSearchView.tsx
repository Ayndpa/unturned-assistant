import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Input,
  Button,
  TabList,
  Tab,
  Text,
  Title2,
  Body1,
  Divider,
  makeStyles,
  shorthands,
  tokens,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  TeachingPopover,
  TeachingPopoverTrigger,
  TeachingPopoverSurface,
  TeachingPopoverHeader,
  TeachingPopoverBody,
  TeachingPopoverTitle,
} from "@fluentui/react-components";
import {
  SearchRegular,
  ArrowSyncRegular,
  SettingsRegular,
  LibraryRegular,
  DismissRegular
} from "@fluentui/react-icons";
import { CATEGORIES, UnturnedItem } from "../utils/types";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { ItemGrid } from "./id-search/ItemGrid";

// ── Types ────────────────────────────────────────────────────────────────────

interface IndexingProgress {
  current: number;
  total: number;
  message: string;
}
import { ItemDetailPane } from "./id-search/ItemDetailPane";
import { IndexManagementPane } from "./id-search/IndexManagementPane";

// ── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "row",
    height: "100%",
    width: "100%",
    boxSizing: "border-box",
    position: "relative",
    minWidth: "0",
    overflowX: "hidden",
  },
  leftPane: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 0",
    minWidth: "0",
    minHeight: "0",
    height: "100%",
    padding: "24px",
    boxSizing: "border-box",
    overflowY: "hidden",
    ...shorthands.gap("28px"),
  },
  rightPaneResizeHandle: {
    width: "14px",
    position: "absolute",
    left: "-7px",
    top: "0",
    bottom: "0",
    height: "100%",
    insetBlock: "0",
    background: "transparent",
    borderRadius: "999px",
    cursor: "col-resize",
    zIndex: 10050,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition:
      "transform 0.2s ease, opacity 0.2s ease, background 0.2s ease",
    "&::before": {
      content: "\"\"",
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
      width: "3px",
      height: "34px",
      borderRadius: "999px",
      background: `linear-gradient(180deg, 
        transparent,
        ${tokens.colorNeutralForeground3},
        ${tokens.colorNeutralForeground2},
        ${tokens.colorNeutralForeground3},
        transparent
      )`,
      opacity: 0.8,
      transition: "transform 0.18s, opacity 0.18s",
      pointerEvents: "none",
    },
    "&:hover": {
      background: `linear-gradient(90deg, transparent 36%, ${tokens.colorNeutralForeground3}, transparent 64%)`,
      transform: "translateX(1px)",
      opacity: 1,
      boxShadow: `0 0 0 1px ${tokens.colorNeutralStroke1}`,
      "&::before": {
        transform: "translateX(-50%) scaleY(1.2)",
        opacity: 0.98,
      }
    },
    "&:active": {
      transform: "translateX(1px)",
      opacity: 0.98,
      boxShadow: `0 0 0 1px ${tokens.colorNeutralStroke1}, 0 0 0 2px ${tokens.colorNeutralBackground5}`,
      "&::before": {
        transform: "translateX(-50%) scaleY(1.3)",
        opacity: 1,
      }
    },
    "& span": { pointerEvents: "none" },
    touchAction: "none",
    userSelect: "none",
  },
  rightPaneResizeHandleGrip: {
    width: "8px",
    height: "12px",
    borderRadius: "999px",
    background: `linear-gradient(90deg, ${tokens.colorNeutralForeground4}, ${tokens.colorNeutralForeground2})`,
    boxShadow: `0 0 0 1px ${tokens.colorNeutralStroke1}, inset 0 0 0 1px ${tokens.colorNeutralStroke2}`,
    opacity: 0.95,
  },
  rightPaneContent: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
    flex: "1 1 auto",
    minHeight: 0,
    minWidth: 0,
    overflowY: "auto",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "4px",
    flexShrink: 0,
  },
  rightPane: {
    width: "360px",
    position: "relative",
    flexShrink: 0,
    minHeight: 0,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "rgba(255, 255, 255, 0.02)", // Very subtle overlay
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    height: "100%",
    overflowY: "hidden",
    ...shorthands.gap("16px"),
    zIndex: 10000,
    transitionProperty: "transform, opacity",
    transitionDuration: "0.2s",
    transitionTimingFunction: "ease",
    "@media (max-width: 1200px)": {
      position: "absolute",
      right: "0",
      top: "0",
      bottom: "0",
      backgroundColor: "var(--app-sidebar-tint-solid, rgba(240, 240, 240, 0.95))",
      backdropFilter: "blur(40px)",
      boxShadow: tokens.shadow16,
      transform: "translateX(100%)",
      opacity: 0,
      pointerEvents: "none",
      borderLeft: `1px solid ${tokens.colorNeutralStroke1}`,
    }
  },
  rightPaneOpen: {
    "@media (max-width: 1200px)": {
      transform: "translateX(0)",
      opacity: 1,
      pointerEvents: "auto",
    }
  },
  rightPaneOverlay: {
    display: "none",
    "@media (max-width: 1200px)": {
      display: "block",
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      backdropFilter: "blur(2px)",
      zIndex: 9000,
      opacity: 0,
      pointerEvents: "none",
      transitionProperty: "opacity",
      transitionDuration: "0.2s",
    }
  },
  rightPaneOverlayVisible: {
    "@media (max-width: 1200px)": {
      opacity: 1,
      pointerEvents: "auto",
    }
  },
  closeButtonRow: {
    display: "none",
    "@media (max-width: 1200px)": {
      display: "flex",
      justifyContent: "flex-end",
      marginBottom: "8px",
    }
  },
  searchBarContainer: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },
  searchTopRow: {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    alignItems: "flex-start",
    gap: "8px",
  },
  categoryTabs: {
    width: "100%",
    minWidth: "0",
    display: "flex",
    flexWrap: "wrap",
    overflow: "visible",
    flexShrink: 0,
    ...shorthands.gap("8px"),
  },
  categoryTab: {
    minWidth: "0",
    flexShrink: 0,
    paddingLeft: "10px",
    paddingRight: "10px",
    whiteSpace: "normal",
    textAlign: "left",
  },
  searchInput: {
    width: "100%",
  },
  searchInputField: {
    flex: "1 1 260px",
    minWidth: "220px",
  },
  indexManagementButton: {
    flex: "0 0 auto",
    whiteSpace: "nowrap",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: tokens.colorNeutralForeground4,
    ...shorthands.gap("12px"),
    textAlign: "center",
  },
  messageBar: {
    position: "absolute",
    top: "12px",
    left: "12px",
    right: "12px",
    zIndex: 20000, // Higher than rightPane (10000)
    boxShadow: tokens.shadow16,
  },
  popoverContent: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
    maxWidth: "240px",
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface IdSearchViewProps {
  onNavigate: (page: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const IdSearchView: React.FC<IdSearchViewProps> = ({ onNavigate }) => {
  const styles = useStyles();
  const containerRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<UnturnedItem[]>([]);
  const [gamePath, setGamePath] = useState<string | null>(null);
  const [extraPaths, setExtraPaths] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress | null>(null);
  const [hasMissingIcons, setHasMissingIcons] = useState(false);
  const [isIndexingImages, setIsIndexingImages] = useState(false);
  const [isRemovingModule, setIsRemovingModule] = useState(false);
  const [isImageIndexModuleInstalled, setIsImageIndexModuleInstalled] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isTeachingPopoverOpen, setIsTeachingPopoverOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleIconMissing = React.useCallback(() => {
    if (!hasMissingIcons) {
      setHasMissingIcons(true);
      setIsTeachingPopoverOpen(true);
    }
  }, [hasMissingIcons]);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<UnturnedItem | null>(null);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);
  const [isRightPaneOpen, setIsRightPaneOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 1200);
  const getRightPaneMaxWidth = (containerWidth?: number) => {
    const viewportWidth = window.innerWidth;
    const baseWidth = typeof containerWidth === "number" && containerWidth > 0 ? containerWidth : viewportWidth;

    if (viewportWidth > 1200) {
      return Math.max(120, baseWidth - 12);
    }
    return Math.max(120, Math.floor(baseWidth * 0.85));
  };
  const [rightPaneWidth, setRightPaneWidth] = useState(() => {
    const savedWidth = window.localStorage?.getItem("idsearch_right_pane_width");
    const parsed = savedWidth ? parseInt(savedWidth, 10) : NaN;
    const minWidth = 120;
    const fallback = 360;
    const clampedDefault = Number.isFinite(parsed) ? parsed : fallback;
    return Math.min(Math.max(minWidth, clampedDefault), getRightPaneMaxWidth());
  });
  const resizingRef = useRef(false);
  const resizeStartXRef = useRef(0);
  const resizeStartWidthRef = useRef(360);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      const large = window.innerWidth > 1200;
      setIsLargeScreen(large);
      if (large) setIsRightPaneOpen(false);
      const maxWidth = getRightPaneMaxWidth(containerRef.current?.clientWidth);
      setRightPaneWidth((prevWidth) => Math.min(Math.max(120, prevWidth), maxWidth));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("idsearch_right_pane_width", String(rightPaneWidth));
  }, [rightPaneWidth]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!resizingRef.current) return;
      const moveX = event.clientX;
      const delta = moveX - resizeStartXRef.current;
      const startWidth = resizeStartWidthRef.current;
      const maxWidth = getRightPaneMaxWidth();
      const nextWidth = Math.min(Math.max(120, startWidth - delta), maxWidth);
      setRightPaneWidth(nextWidth);
    };

    const stopResize = () => {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };
  }, []);

  const handleRightPaneResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button === 2 || event.button === 1) return;
    event.preventDefault();
    event.stopPropagation();
    resizingRef.current = true;
    resizeStartXRef.current = event.clientX;
    resizeStartWidthRef.current = rightPaneWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some environments do not support pointer capture for this element.
    }
  };

  // Automatically open right pane when an item is selected or management pane is shown (if not on large screen)
  useEffect(() => {
    if (!isLargeScreen && selectedItem) {
      setIsRightPaneOpen(true);
    }
  }, [selectedItem, isLargeScreen]);

  // ── Effects ──────────────────────────────────────────────────────────────

  // Load cached items and game path on mount
  useEffect(() => {
    const savedPath = localStorage.getItem("unturned_game_path");
    setGamePath(savedPath);

    const savedExtraPaths = localStorage.getItem("unturned_extra_paths");
    if (savedExtraPaths) {
      try {
        setExtraPaths(JSON.parse(savedExtraPaths));
      } catch (e) {
        console.error("Failed to parse extra paths", e);
      }
    }

    if (savedPath) {
      invoke<boolean>("is_image_index_module_installed", { gamePath: savedPath })
        .then(installed => setIsImageIndexModuleInstalled(installed))
        .catch(err => console.error("Failed to check if module is installed", err));
    }

    invoke<UnturnedItem[]>("load_cached_index")
      .then((loadedItems) => {
        if (loadedItems && loadedItems.length > 0) {
          // Wrap state updates to keep UI responsive
          setItems(loadedItems);
          // Only select the first item if nothing is selected
          setSelectedItem(prev => prev || loadedItems[0]);
        }
      })
      .catch((err) => {
        console.log("No cache found or failed to load.", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Set up event listener for indexing progress
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setupListener = async () => {
      const unsubscribe = await listen<IndexingProgress>("indexing-progress", (event) => {
        setIndexingProgress(event.payload);
      });
      unlisten = unsubscribe;
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Debounce search query input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 150);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Reset visible items count when filter or items change
  useEffect(() => {
    setVisibleCount(50);
  }, [searchQuery, selectedCategory, items]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      weapons: 0,
      ammo: 0,
      apparel: 0,
      vehicles: 0,
      medical: 0,
      structures: 0,
      resources: 0,
    };
    for (let i = 0; i < items.length; i++) {
      const cat = items[i].category;
      if (stats[cat] !== undefined) {
        stats[cat]++;
      } else {
        stats.other++;
      }
    }
    return stats;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery && selectedCategory === "all") return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;
      
      return (item.name || "").toLowerCase().includes(query) ||
             (item.id !== undefined && item.id !== null && item.id.toString().includes(query)) ||
             (item.description || "").toLowerCase().includes(query);
    });
  }, [items, searchQuery, selectedCategory]);

  // Build lookup map by ID and GUID to resolve ingredients quickly
  const itemMap = useMemo(() => {
    const map: Record<string, UnturnedItem> = {};
    items.forEach((item) => {
      map[item.id.toString()] = item;
      if (item.guid) {
        map[item.guid] = item;
        map[item.guid.toLowerCase()] = item;
      }
    });
    return map;
  }, [items]);

  const resolveItem = (idOrGuid: string): UnturnedItem | null => {
    return itemMap[idOrGuid] || itemMap[idOrGuid.toLowerCase()] || null;
  };

  // Detect if the loaded cache is missing blueprints
  const isCacheMissingBlueprints = useMemo(() => {
    if (items.length === 0) return false;
    return !items.some((item) => item.blueprints && item.blueprints.length > 0);
  }, [items]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSync = async () => {
    const path = localStorage.getItem("unturned_game_path");
    if (!path) {
      setSyncError("游戏安装路径未配置，请先前往系统设置配置路径。");
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setIndexingProgress({ current: 0, total: 100, message: "准备扫描..." });

    try {
      const loadedItems = await invoke<UnturnedItem[]>("scan_unturned_directory", {
        gamePath: path,
        extraPaths: extraPaths,
        preferredLang: "Chinese",
      });
      if (loadedItems && loadedItems.length > 0) {
        setItems(loadedItems);
        setSelectedItem(loadedItems[0]);
      } else {
        setSyncError("未在指定目录中扫描到任何有效的物品或车辆数据。");
      }
    } catch (err: any) {
      setSyncError(err.toString() || "同步索引失败，请检查安装路径。");
    } finally {
      setIsSyncing(false);
      setIndexingProgress(null);
    }
  };

  const handleIndexImagesClick = () => {
    const path = localStorage.getItem("unturned_game_path");
    if (!path) {
      setSyncError("游戏安装路径未配置，无法执行图片索引。");
      return;
    }
    setIsConfirmDialogOpen(true);
  };

  const executeIndexImages = async () => {
    setIsConfirmDialogOpen(false);
    setIsIndexingImages(true);
    setSyncError(null);

    const path = localStorage.getItem("unturned_game_path");
    try {
      await invoke("index_game_images", { gamePath: path });
      setRefreshKey(prev => prev + 1);
      setHasMissingIcons(false);
    } catch (err: any) {
      setSyncError(err.toString() || "索引游戏图片失败，请确保 src-tauri/resources/UnturnedImages.zip 已准备好。");
    } finally {
      setIsIndexingImages(false);
      if (path) {
        invoke<boolean>("is_image_index_module_installed", { gamePath: path })
          .then(installed => setIsImageIndexModuleInstalled(installed));
      }
    }
  };

  const handleRemoveImageIndexModuleClick = async () => {
    const path = localStorage.getItem("unturned_game_path");
    if (!path) {
      setSyncError("游戏安装路径未配置，无法执行操作。");
      return;
    }
    
    setIsRemovingModule(true);
    setSyncError(null);
    try {
      await invoke("remove_image_index_module", { gamePath: path });
    } catch (err: any) {
      setSyncError(err.toString() || "移除图片索引模组失败。");
    } finally {
      setIsRemovingModule(false);
      if (path) {
        invoke<boolean>("is_image_index_module_installed", { gamePath: path })
          .then(installed => setIsImageIndexModuleInstalled(installed));
      }
    }
  };

  const handleAddExtraPath = async () => {
    try {
      const selected = await invoke<string | null>("pick_folder");
      if (selected && !extraPaths.includes(selected)) {
        const newPaths = [...extraPaths, selected];
        setExtraPaths(newPaths);
        localStorage.setItem("unturned_extra_paths", JSON.stringify(newPaths));
      }
    } catch (err) {
      console.error("Failed to pick folder:", err);
    }
  };

  const handleRemoveExtraPath = (pathToRemove: string) => {
    const newPaths = extraPaths.filter(p => p !== pathToRemove);
    setExtraPaths(newPaths);
    localStorage.setItem("unturned_extra_paths", JSON.stringify(newPaths));
  };

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setShowCopyAlert(true);
    setTimeout(() => {
      setShowCopyAlert(false);
    }, 2000);
  };

  // ── Empty-state left pane (no items loaded yet) ───────────────────────────

  const renderEmptyLeftPane = () => (
    <div className={styles.emptyState} style={{ gap: "16px", padding: "32px", boxSizing: "border-box" }}>
      {isSyncing ? (
        <>
          <Spinner size="huge" label={indexingProgress?.message || "正在扫描游戏目录并建立索引..."} labelPosition="below" />
          {indexingProgress && (
            <div style={{ width: "300px", marginTop: "12px" }}>
              <Text size={200} style={{ color: tokens.colorNeutralForeground4, display: "block", textAlign: "center", marginBottom: "4px" }}>
                进度: {indexingProgress.current} / {indexingProgress.total}
              </Text>
              <div style={{ width: "100%", height: "4px", backgroundColor: tokens.colorNeutralBackground3, borderRadius: "2px", overflow: "hidden" }}>
                <div 
                  style={{ 
                    width: `${Math.min(100, (indexingProgress.current / (indexingProgress.total || 1)) * 100)}%`, 
                    height: "100%", 
                    backgroundColor: tokens.colorBrandBackground,
                    transition: "width 0.3s ease"
                  }} 
                />
              </div>
            </div>
          )}
          <Text size={300} style={{ color: tokens.colorNeutralForeground4, maxWidth: "300px", textAlign: "center" }}>
            解析 Unturned 物品与载具配置可能需要几秒钟，请稍候。
          </Text>
        </>
      ) : (
        <>
          {gamePath ? (
            <>
              <Text size={300} style={{ color: tokens.colorNeutralForeground3, textAlign: "center", wordBreak: "break-all", maxWidth: "350px" }}>
                当前配置路径：<code style={{ backgroundColor: tokens.colorNeutralBackground3, padding: "2px 4px", borderRadius: "4px" }}>{gamePath}</code>
              </Text>
              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <Button appearance="primary" icon={<ArrowSyncRegular />} onClick={handleSync}>
                  一键重建数据索引
                </Button>
                <Button appearance="secondary" icon={<SettingsRegular />} onClick={() => onNavigate("settings")}>
                  修改游戏路径
                </Button>
              </div>
            </>
          ) : (
            <>
              <Text size={300} style={{ color: tokens.colorNeutralForeground4, textAlign: "center", maxWidth: "300px" }}>
                尚未配置 Unturned 游戏路径，无法同步索引数据。
              </Text>
              <Button appearance="primary" icon={<SettingsRegular />} onClick={() => onNavigate("settings")} style={{ marginTop: "8px" }}>
                一键前往设置配置路径
              </Button>
            </>
          )}

          {syncError && (
            <MessageBar intent="error" style={{ marginTop: "16px", maxWidth: "360px" }}>
              <MessageBarBody>
                <MessageBarTitle>索引失败</MessageBarTitle>
                <div style={{ whiteSpace: 'pre-wrap' }}>{syncError}</div>
              </MessageBarBody>
            </MessageBar>
          )}
        </>
      )}
    </div>
  );

  const onSelectItem = (item: UnturnedItem) => {
    setSelectedItem(item);
    if (!isLargeScreen) {
      setIsRightPaneOpen(true);
    }
  };

  const effectiveRightPaneWidth = Math.min(
    rightPaneWidth,
    getRightPaneMaxWidth(containerRef.current?.clientWidth)
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      const maxWidth = getRightPaneMaxWidth(node.clientWidth);
      setRightPaneWidth((prevWidth) => Math.min(Math.max(120, prevWidth), maxWidth));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container} ref={containerRef}>
      {/* Toast Alert */}
      {showCopyAlert && (
        <div className={styles.messageBar}>
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle>复制成功</MessageBarTitle>
              已将指令 <code>{copiedCommand}</code> 复制到剪贴板。
            </MessageBarBody>
          </MessageBar>
        </div>
      )}

      {/* Left items list pane */}
      <div className={styles.leftPane}>
        {/* Page header */}
        <div className={styles.pageHeader}>
          <Title2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LibraryRegular /> 物品百科
          </Title2>
          <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
            快速查询 Unturned 物品与载具 ID，查看合成配方、生成指令与详细属性。
          </Body1>
          <Divider />
        </div>

        <div className={styles.searchBarContainer}>
          <div className={styles.searchTopRow}>
            <Input
              className={styles.searchInputField}
              contentBefore={<SearchRegular />}
              placeholder="搜索物品名称、ID 或描述..."
              value={inputValue}
              onChange={(_, data) => setInputValue(data.value)}
            />
            
            <TeachingPopover
              open={isTeachingPopoverOpen}
              onOpenChange={(_, data) => {
                if (!data.open) {
                  setIsTeachingPopoverOpen(false);
                }
              }}
            >
              <TeachingPopoverTrigger>
                <Button
                  icon={<ArrowSyncRegular />}
                  onClick={() => {
                    setSelectedItem(null);
                    setIsTeachingPopoverOpen(false);
                    if (!isLargeScreen) setIsRightPaneOpen(true);
                  }}
                  title="查看数据索引统计与管理"
                  className={styles.indexManagementButton}
                >
                  索引管理
                </Button>
              </TeachingPopoverTrigger>
              <TeachingPopoverSurface>
                <TeachingPopoverHeader>功能提醒</TeachingPopoverHeader>
                <TeachingPopoverBody>
                  <TeachingPopoverTitle>发现缺失图标</TeachingPopoverTitle>
                  <Text>
                    检测到当前列表中存在无法显示图标的物品。您可以前往“索引管理”面板，通过启动游戏来生成缺失的图标。
                  </Text>
                </TeachingPopoverBody>
              </TeachingPopoverSurface>
            </TeachingPopover>
          </div>
          <TabList
            className={styles.categoryTabs}
            selectedValue={selectedCategory}
            onTabSelect={(_, data) => setSelectedCategory(data.value as string)}
          >
            {CATEGORIES.map((cat) => (
              <Tab key={cat.key} value={cat.key} className={styles.categoryTab}>
                {cat.label}
              </Tab>
            ))}
          </TabList>
        </div>

        {/* Warning Banner if cache has no blueprints */}
        {isCacheMissingBlueprints && !isSyncing && (
          <MessageBar intent="warning" style={{ marginBottom: "16px", boxShadow: tokens.shadow4 }}>
            <MessageBarBody>
              <MessageBarTitle>需要重建数据索引</MessageBarTitle>
              检测到当前的本地缓存数据未包含合成配方，请点击右侧的「索引管理」进入数据面板重建索引以解锁配方和用途查询。
            </MessageBarBody>
          </MessageBar>
        )}

        {isLoading ? (
          <div className={styles.emptyState} style={{ gap: "16px", padding: "32px", boxSizing: "border-box" }}>
            <Spinner size="huge" label="正在读取本地缓存索引..." labelPosition="below" />
          </div>
        ) : items.length === 0 ? (
          renderEmptyLeftPane()
        ) : (
          <ItemGrid
            items={items}
            filteredItems={filteredItems}
            selectedItem={selectedItem}
            gamePath={gamePath}
            refreshKey={refreshKey}
            isLoading={isLoading}
            isSyncing={isSyncing}
            visibleCount={visibleCount}
            onSelectItem={onSelectItem}
            onLoadMore={() => setVisibleCount((prev) => Math.min(prev + 50, filteredItems.length))}
            onIconMissing={handleIconMissing}
            resetDeps={[searchQuery, selectedCategory, items] as const}
          />
        )}
      </div>

      {/* Right Pane Overlay (Mobile) */}
      <div 
        className={`${styles.rightPaneOverlay} ${isRightPaneOpen ? styles.rightPaneOverlayVisible : ""}`}
        onClick={() => setIsRightPaneOpen(false)}
      />

      {/* Right details / management pane */}
      <div
        className={`${styles.rightPane} ${isRightPaneOpen ? styles.rightPaneOpen : ""}`}
        style={{ width: `${effectiveRightPaneWidth}px` }}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (Math.abs(event.clientX - rect.left) <= 16) {
            handleRightPaneResizeStart(event);
          }
        }}
      >
        <div
          className={styles.rightPaneResizeHandle}
          style={{
            display: isLargeScreen || isRightPaneOpen ? "flex" : "none",
          }}
          onPointerDown={handleRightPaneResizeStart}
          title="拖动调整详情栏宽度"
        >
          <span className={styles.rightPaneResizeHandleGrip} />
        </div>
        {/* Mobile Close Button */}
        <div className={styles.closeButtonRow}>
          <Button
            appearance="subtle"
            icon={<DismissRegular />}
            onClick={() => setIsRightPaneOpen(false)}
          >
            关闭详情
          </Button>
        </div>

        <div className={styles.rightPaneContent}>
          {selectedItem !== null ? (
            <ItemDetailPane
              selectedItem={selectedItem}
              gamePath={gamePath}
              isSyncing={isSyncing}
              onCopy={handleCopy}
              onSelectItem={setSelectedItem}
              resolveItem={resolveItem}
              items={items}
            />
          ) : items.length > 0 ? (
            <IndexManagementPane
              gamePath={gamePath}
              extraPaths={extraPaths}
              itemCount={items.length}
              categoryStats={categoryStats}
              isSyncing={isSyncing}
              indexingProgress={indexingProgress}
              syncError={syncError}
              hasMissingIcons={hasMissingIcons}
              isIndexingImages={isIndexingImages}
              isRemovingModule={isRemovingModule}
              isImageIndexModuleInstalled={isImageIndexModuleInstalled}
              onSync={handleSync}
              onAddExtraPath={handleAddExtraPath}
              onRemoveExtraPath={handleRemoveExtraPath}
              onNavigate={onNavigate}
              onIndexImages={handleIndexImagesClick}
              onRemoveImageIndexModule={handleRemoveImageIndexModuleClick}
            />
          ) : (
            <ItemDetailPane
              selectedItem={null}
              isSyncing={isSyncing}
              onCopy={handleCopy}
            />
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={(_, data) => setIsConfirmDialogOpen(data.open)}>
        <DialogSurface backdrop={{ style: { zIndex: 20000 } }} style={{ zIndex: 20001, backgroundColor: tokens.colorNeutralBackground1 }}>
          <DialogBody>
            <DialogTitle>启动游戏确认</DialogTitle>
            <DialogContent>
              助手将启动 Unturned 游戏以自动扫描并生成物品图标。游戏将在索引完成后自动关闭。在此期间请勿手动关闭游戏，是否继续？
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">取消</Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={executeIndexImages}>
                立即开始
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};
