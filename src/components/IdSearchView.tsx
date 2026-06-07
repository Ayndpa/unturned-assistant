import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Input,
  Button,
  TabList,
  Tab,
  Card,
  Text,
  Badge,
  makeStyles,
  shorthands,
  tokens,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  Divider,
  Title3,
  Caption1,
  Spinner,
  mergeClasses
} from "@fluentui/react-components";
import {
  SearchRegular,
  CopyRegular,
  ClipboardRegular,
  ArrowSyncRegular,
  SettingsRegular
} from "@fluentui/react-icons";
import { CATEGORIES, RARITY_COLORS, UnturnedItem } from "../utils/types";
import { invoke } from "@tauri-apps/api/core";

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
  },
  rightPane: {
    width: "360px",
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
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
    marginBottom: "16px",
  },
  searchInput: {
    width: "100%",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    ...shorthands.gap("12px"),
    overflowY: "auto",
    paddingBottom: "24px",
    flex: 1,
  },
  itemCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    cursor: "pointer",
    transitionProperty: "transform, box-shadow, border-color",
    transitionDuration: "0.15s",
    transitionTimingFunction: "ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow8,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    }
  },
  selectedCard: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
    boxShadow: tokens.shadow8,
  },
  cardId: {
    fontWeight: "bold",
    color: tokens.colorBrandForeground1,
    fontSize: "16px",
  },
  rarityBadge: {
    alignSelf: "flex-start",
    ...shorthands.padding("2px", "8px"),
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "11px",
  },
  detailHeader: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  detailCardId: {
    fontSize: "28px",
    fontWeight: "bold",
    color: tokens.colorBrandForeground1,
  },
  commandBox: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding("12px"),
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: "Consolas, Monaco, monospace",
    fontSize: "13px",
    wordBreak: "break-all",
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  commandLabel: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground4,
    textTransform: "uppercase",
    fontWeight: "bold",
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
  }
});

interface IdSearchViewProps {
  onNavigate: (page: string) => void;
}

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
  const gridRef = useRef<HTMLDivElement>(null);

  const spawnCommand = selectedItem ? `@give @p/${selectedItem.id}/1` : "";

  // Load cached items and path on mount
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

  // Debounce search query input to prevent rendering lag on typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 150);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Reset visible items count and scroll back to top when query, category or items change
  useEffect(() => {
    setVisibleCount(50);
    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedCategory, items]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
      setVisibleCount(prev => Math.min(prev + 50, filteredItems.length));
    }
  };

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
        preferredLang: "Chinese" 
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
    items.forEach(item => {
      if (stats[item.category] !== undefined) {
        stats[item.category]++;
      } else {
        stats.other++;
      }
    });
    return stats;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const name = item.name || "";
      const id = item.id !== undefined && item.id !== null ? item.id.toString() : "";
      const description = item.description || "";
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            id.includes(searchQuery) ||
                            description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleCopy = (command: string) => {
    navigator.clipboard.writeText(command);
    setCopiedCommand(command);
    setShowCopyAlert(true);
    setTimeout(() => {
      setShowCopyAlert(false);
    }, 2000);
  };

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
            {CATEGORIES.map(cat => (
              <Tab key={cat.key} value={cat.key}>
                {cat.label}
              </Tab>
            ))}
          </TabList>
        </div>

        {items.length === 0 ? (
          <div className={styles.emptyState} style={{ gap: "16px", padding: "32px", boxSizing: "border-box" }}>
            {isLoading ? (
              <Spinner size="huge" label="正在读取本地缓存索引..." labelPosition="below" />
            ) : isSyncing ? (
              <>
                <Spinner size="huge" label="正在扫描游戏目录并建立索引..." labelPosition="below" />
                <Text size={300} style={{ color: tokens.colorNeutralForeground4, maxWidth: "300px", textAlign: "center" }}>
                  解析 Unturned 物品与载具配置可能需要几秒钟，请稍候。
                </Text>
              </>
            ) : (
              <>
                <ClipboardRegular style={{ fontSize: "56px", color: tokens.colorNeutralForeground4 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
                  <Text size={500} weight="semibold">未检测到本地数据索引</Text>
                  
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
                </div>
              </>
            )}
          </div>
        ) : filteredItems.length > 0 ? (
          <div className={styles.itemsGrid} ref={gridRef} onScroll={handleScroll}>
            {filteredItems.slice(0, visibleCount).map(item => {
              const rColor = RARITY_COLORS[item.rarity];
              const isSelected = selectedItem?.id === item.id && selectedItem?.category === item.category;
              
              // Extract bilingual names if formatted as "English (Chinese)"
              const nameMatch = item.name.match(/^(.*?)\s*\((.*?)\)$/);
              let primaryName = item.name;
              let secondaryName = "";
              if (nameMatch) {
                primaryName = nameMatch[2]; // Chinese
                secondaryName = nameMatch[1]; // English
              }

              return (
                <Card
                  key={`${item.category}-${item.id}`}
                  className={mergeClasses(styles.itemCard, isSelected && styles.selectedCard)}
                  onClick={() => setSelectedItem(item)}
                  style={{
                    borderLeft: `4px solid ${rColor.color}`,
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "84px",
                    ...(isSelected ? {
                      borderColor: tokens.colorBrandStroke1,
                      borderLeftColor: rColor.color,
                    } : {})
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "6px" }}>
                    {/* Top Row: Rarity Badge and ID */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                      <span 
                        className={styles.rarityBadge}
                        style={{ color: rColor.color, backgroundColor: rColor.bg, margin: 0 }}
                      >
                        {item.rarity}
                      </span>
                      <span className={styles.cardId}>#{item.id}</span>
                    </div>

                    {/* Content Row: Names */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <Text weight="bold" style={{ fontSize: "14px", lineHeight: "1.3", color: tokens.colorNeutralForeground1, wordBreak: "break-all" }}>
                        {primaryName}
                      </Text>
                      {secondaryName && (
                        <Text size={100} style={{ color: tokens.colorNeutralForeground4, wordBreak: "break-all", fontStyle: "italic" }}>
                          {secondaryName}
                        </Text>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <SearchRegular style={{ fontSize: "48px" }} />
            <div>
              <Text size={500} weight="semibold">未找到匹配的物品</Text>
              <br />
              <Text size={300} style={{ color: tokens.colorNeutralForeground4 }}>
                尝试更换搜索关键词或选择不同的分类。
              </Text>
            </div>
          </div>
        )}
      </div>

      {/* Right details display pane */}
      <div className={styles.rightPane}>
        {isSyncing ? (
          <div className={styles.emptyState}>
            <Spinner size="huge" label="正在扫描游戏目录并建立索引..." labelPosition="below" />
            <Text size={200} style={{ color: tokens.colorNeutralForeground4, textAlign: "center", maxWidth: "250px" }}>
              这可能需要几秒钟，请稍候。
            </Text>
          </div>
        ) : selectedItem ? (
          <>
            <div className={styles.detailHeader}>
              <Caption1 style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", fontWeight: "bold" }}>
                物品详情
              </Caption1>
              <Title3>{selectedItem.name}</Title3>
              
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                <span 
                  className={styles.rarityBadge}
                  style={{ 
                    color: RARITY_COLORS[selectedItem.rarity].color, 
                    backgroundColor: RARITY_COLORS[selectedItem.rarity].bg,
                    fontSize: "12px",
                    padding: "4px 10px"
                  }}
                >
                  {selectedItem.rarity}
                </span>
                <Badge appearance="outline">
                  {CATEGORIES.find(c => c.key === selectedItem.category)?.label || "其他"}
                </Badge>
              </div>
            </div>

            <Divider />

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Text weight="semibold">物品 ID</Text>
              <div className={styles.detailCardId}>{selectedItem.id}</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Text weight="semibold">物品描述</Text>
              <Text style={{ color: tokens.colorNeutralForeground2, lineHeight: "20px" }}>
                {selectedItem.description}
              </Text>
            </div>

            <Divider />

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Text weight="semibold">获取指令</Text>
              
              <div className={styles.commandBox}>
                <span className={styles.commandLabel}>单人 / 房主 指令</span>
                <div>{spawnCommand}</div>
                <Button 
                  icon={<CopyRegular />} 
                  appearance="secondary"
                  size="small"
                  style={{ alignSelf: "flex-end" }}
                  onClick={() => handleCopy(spawnCommand)}
                >
                  复制指令
                </Button>
              </div>

              <div className={styles.commandBox}>
                <span className={styles.commandLabel}>服务器控制台指令</span>
                <div>give {selectedItem.id}</div>
                <Button 
                  icon={<CopyRegular />} 
                  appearance="secondary"
                  size="small"
                  style={{ alignSelf: "flex-end" }}
                  onClick={() => handleCopy(`give ${selectedItem.id}`)}
                >
                  复制指令
                </Button>
              </div>
            </div>

            <Divider />

            <div style={{ color: tokens.colorNeutralForeground4, fontSize: "12px" }}>
              <p>💡 提示：</p>
              <ul style={{ paddingLeft: "16px", margin: "4px 0" }}>
                <li><code>@p</code> 代表当前玩家。</li>
                <li>复制指令后，在游戏聊天框直接按 <code>Ctrl+V</code> 发送即可。</li>
                <li>如果是服务器后台，请复制控制台指令。</li>
              </ul>
            </div>
          </>
        ) : items.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className={styles.detailHeader}>
              <Caption1 style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", fontWeight: "bold" }}>
                数据管理
              </Caption1>
              <Title3>索引数据管理</Title3>
            </div>

            <Divider />

            {/* Status card */}
            <Card style={{ backgroundColor: tokens.colorNeutralBackground3, padding: "12px", borderLeft: `4px solid ${tokens.colorPaletteGreenBorder2}` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground2 }}>● 本地索引已建立</Text>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  共收录 <b>{items.length}</b> 个物品及载具数据
                </Text>
              </div>
            </Card>

            {/* Path info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Text weight="semibold">游戏安装路径</Text>
              <Text size={200} style={{ color: tokens.colorNeutralForeground3, wordBreak: "break-all", backgroundColor: tokens.colorNeutralBackground3, padding: "8px", borderRadius: "4px" }}>
                <code>{gamePath || "未配置"}</code>
              </Text>
            </div>

            <Divider />

            {/* Category Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Text weight="semibold">数据分类统计</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {CATEGORIES.filter(cat => cat.key !== "all").map(cat => {
                  const count = categoryStats[cat.key] || 0;
                  return (
                    <div key={cat.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                      <Text size={200}>{cat.label}</Text>
                      <Badge appearance="filled" style={{ minWidth: "32px", textAlign: "center" }}>
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <Divider />

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Button appearance="primary" icon={<ArrowSyncRegular />} onClick={handleSync} style={{ width: "100%" }}>
                重新扫描并重建索引
              </Button>
              <Button appearance="secondary" icon={<SettingsRegular />} onClick={() => onNavigate("settings")} style={{ width: "100%" }}>
                前往系统设置修改路径
              </Button>
            </div>

            {syncError && (
              <MessageBar intent="error" style={{ marginTop: "8px" }}>
                <MessageBarBody>
                  <MessageBarTitle>重建索引失败</MessageBarTitle>
                  {syncError}
                </MessageBarBody>
              </MessageBar>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <ClipboardRegular style={{ fontSize: "48px" }} />
            <Text>请在左侧列表中选择一个物品以查看详细信息。</Text>
          </div>
        )}
      </div>
    </div>
  );
};
