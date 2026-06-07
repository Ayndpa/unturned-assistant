import React, { useRef, useEffect } from "react";
import { Text, makeStyles, shorthands, tokens, Spinner } from "@fluentui/react-components";
import { SearchRegular, ClipboardRegular } from "@fluentui/react-icons";
import { UnturnedItem } from "../../utils/types";
import { ItemCard } from "./ItemCard";

const useStyles = makeStyles({
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
    ...shorthands.gap("12px"),
    overflowY: "auto",
    ...shorthands.padding("4px", "4px", "24px", "4px"),
    flex: 1,
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
});

interface ItemGridProps {
  items: UnturnedItem[];
  filteredItems: UnturnedItem[];
  selectedItem: UnturnedItem | null;
  isLoading: boolean;
  isSyncing: boolean;
  visibleCount: number;
  onSelectItem: (item: UnturnedItem) => void;
  onLoadMore: () => void;
  /** Reset scroll + visible count when these change */
  resetDeps: readonly unknown[];
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  filteredItems,
  selectedItem,
  isLoading,
  isSyncing,
  visibleCount,
  onSelectItem,
  onLoadMore,
  resetDeps,
}) => {
  const styles = useStyles();
  const gridRef = useRef<HTMLDivElement>(null);

  // Scroll back to top whenever the filter changes
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...resetDeps]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 150) {
      onLoadMore();
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyState} style={{ gap: "16px", padding: "32px", boxSizing: "border-box" }}>
        {isLoading ? (
          <Spinner size="huge" label="正在读取本地缓存索引..." labelPosition="below" />
        ) : isSyncing ? (
          <>
            <Spinner size="huge" label="正在扫描游戏目录并建立索引..." labelPosition="below" />
            <Text
              size={300}
              style={{ color: tokens.colorNeutralForeground4, maxWidth: "300px", textAlign: "center" }}
            >
              解析 Unturned 物品与载具配置可能需要几秒钟，请稍候。
            </Text>
          </>
        ) : (
          <>
            <ClipboardRegular style={{ fontSize: "56px", color: tokens.colorNeutralForeground4 }} />
            <Text size={500} weight="semibold">
              未检测到本地数据索引
            </Text>
          </>
        )}
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className={styles.emptyState}>
        <SearchRegular style={{ fontSize: "48px" }} />
        <div>
          <Text size={500} weight="semibold">
            未找到匹配的物品
          </Text>
          <br />
          <Text size={300} style={{ color: tokens.colorNeutralForeground4 }}>
            尝试更换搜索关键词或选择不同的分类。
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.itemsGrid} ref={gridRef} onScroll={handleScroll}>
      {filteredItems.slice(0, visibleCount).map((item) => (
        <ItemCard
          key={`${item.category}-${item.id}`}
          item={item}
          isSelected={selectedItem?.id === item.id && selectedItem?.category === item.category}
          onClick={onSelectItem}
        />
      ))}
    </div>
  );
};
