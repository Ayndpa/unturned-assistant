import React, { useState, useMemo, useEffect } from "react";
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
} from "@fluentui/react-components";
import {
  SearchRegular,
  ArrowSyncRegular,
  SettingsRegular,
  LibraryRegular,
} from "@fluentui/react-icons";
import { CATEGORIES, UnturnedItem } from "../utils/types";
import { invoke } from "@tauri-apps/api/core";
import { ItemGrid } from "./id-search/ItemGrid";
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
  },
  leftPane: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    padding: "24px",
    boxSizing: "border-box",
    overflowY: "hidden",
    ...shorthands.gap("28px"),
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "4px",
  },
  rightPane: {
    width: "360px",
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: "rgba(255, 255, 255, 0.02)", // Very subtle overlay
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    height: "100%",
    overflowY: "auto",
    ...shorthands.gap("16px"),
  },
  searchBarContainer: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
  },
  searchInput: {
    width: "100%",
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
    zIndex: 100,
    boxShadow: tokens.shadow16,
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────

interface IdSearchViewProps {
  onNavigate: (page: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const IdSearchView: React.FC<IdSearchViewProps> = ({ onNavigate }) => {
  const styles = useStyles();

  const [items, setItems] = useState<UnturnedItem[]>([]);
  const [gamePath, setGamePath] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<UnturnedItem | null>(null);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);

  // ── Effects ──────────────────────────────────────────────────────────────

  // Load cached items and game path on mount
  useEffect(() => {
    const savedPath = localStorage.getItem("unturned_game_path");
    setGamePath(savedPath);

    invoke<UnturnedItem[]>("load_cached_index")
      .then((loadedItems) => {
        if (loadedItems && loadedItems.length > 0) {
          setItems(loadedItems);
          setSelectedItem(loadedItems[0]);
        }
      })
      .catch((err) => {
        console.log("No cache found or failed to load.", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
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
      other: 0,
    };
    items.forEach((item) => {
      if (stats[item.category] !== undefined) {
        stats[item.category]++;
      } else {
        stats.other++;
      }
    });
    return stats;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const name = item.name || "";
      const id = item.id !== undefined && item.id !== null ? item.id.toString() : "";
      const description = item.description || "";

      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        id.includes(searchQuery) ||
        description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
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
    try {
      const loadedItems = await invoke<UnturnedItem[]>("scan_unturned_directory", {
        gamePath: path,
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
    }
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
          <Spinner size="huge" label="正在扫描游戏目录并建立索引..." labelPosition="below" />
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
                {syncError}
              </MessageBarBody>
            </MessageBar>
          )}
        </>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
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
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <Input
              className={styles.searchInput}
              contentBefore={<SearchRegular />}
              placeholder="搜索物品名称、ID 或描述..."
              value={inputValue}
              onChange={(_, data) => setInputValue(data.value)}
              style={{ flex: 1 }}
            />
            <Button
              icon={<ArrowSyncRegular />}
              onClick={() => setSelectedItem(null)}
              title="查看数据索引统计与管理"
            >
              索引管理
            </Button>
          </div>
          <TabList
            selectedValue={selectedCategory}
            onTabSelect={(_, data) => setSelectedCategory(data.value as string)}
          >
            {CATEGORIES.map((cat) => (
              <Tab key={cat.key} value={cat.key}>
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
            isLoading={isLoading}
            isSyncing={isSyncing}
            visibleCount={visibleCount}
            onSelectItem={setSelectedItem}
            onLoadMore={() => setVisibleCount((prev) => Math.min(prev + 50, filteredItems.length))}
            resetDeps={[searchQuery, selectedCategory, items] as const}
          />
        )}
      </div>

      {/* Right details / management pane */}
      <div className={styles.rightPane}>
        {selectedItem !== null ? (
          <ItemDetailPane
            selectedItem={selectedItem}
            isSyncing={isSyncing}
            onCopy={handleCopy}
            onSelectItem={setSelectedItem}
            resolveItem={resolveItem}
            items={items}
          />
        ) : items.length > 0 ? (
          <IndexManagementPane
            gamePath={gamePath}
            itemCount={items.length}
            categoryStats={categoryStats}
            isSyncing={isSyncing}
            syncError={syncError}
            onSync={handleSync}
            onNavigate={onNavigate}
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
  );
};
