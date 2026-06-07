import React, { useState, useMemo } from "react";
import {
  Input,
  Button,
  TabList,
  Tab,
  Card,
  CardHeader,
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
  Caption1
} from "@fluentui/react-components";
import {
  SearchRegular,
  CopyRegular,
  ClipboardRegular
} from "@fluentui/react-icons";
import { MOCK_ITEMS, CATEGORIES, RARITY_COLORS, UnturnedItem } from "../utils/mockData";

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

export const IdSearchView: React.FC = () => {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<UnturnedItem | null>(MOCK_ITEMS[0] || null);
  const [showCopyAlert, setShowCopyAlert] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState("");

  const filteredItems = useMemo(() => {
    return MOCK_ITEMS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.id.toString().includes(searchQuery) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

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
          <Input
            className={styles.searchInput}
            contentBefore={<SearchRegular />}
            placeholder="搜索物品名称、ID 或描述..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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

        {filteredItems.length > 0 ? (
          <div className={styles.itemsGrid}>
            {filteredItems.map(item => {
              const rColor = RARITY_COLORS[item.rarity];
              const isSelected = selectedItem?.id === item.id;
              return (
                <Card
                  key={item.id}
                  className={`${styles.itemCard} ${isSelected ? styles.selectedCard : ""}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <CardHeader
                    header={
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <Text weight="semibold" style={{ wordBreak: "break-word" }}>{item.name.split(' (')[0]}</Text>
                        <span className={styles.cardId}>#{item.id}</span>
                      </div>
                    }
                    description={
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                        <span 
                          className={styles.rarityBadge}
                          style={{ color: rColor.color, backgroundColor: rColor.bg }}
                        >
                          {item.rarity}
                        </span>
                      </div>
                    }
                  />
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
        {selectedItem ? (
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
                <div>{selectedItem.spawnCommand}</div>
                <Button 
                  icon={<CopyRegular />} 
                  appearance="secondary"
                  size="small"
                  style={{ alignSelf: "flex-end" }}
                  onClick={() => handleCopy(selectedItem.spawnCommand)}
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
