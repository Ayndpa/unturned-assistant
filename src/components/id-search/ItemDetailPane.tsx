import React from "react";
import {
  Text,
  Badge,
  Button,
  Divider,
  Caption1,
  Title3,
  Spinner,
  makeStyles,
  shorthands,
  tokens,
} from "@fluentui/react-components";
import { CopyRegular, ClipboardRegular } from "@fluentui/react-icons";
import { CATEGORIES, RARITY_COLORS, UnturnedItem } from "../../utils/types";

const useStyles = makeStyles({
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
  rarityBadge: {
    alignSelf: "flex-start",
    ...shorthands.padding("2px", "8px"),
    borderRadius: "12px",
    fontWeight: "600",
    fontSize: "11px",
  },
});

interface ItemDetailPaneProps {
  selectedItem: UnturnedItem | null;
  isSyncing: boolean;
  onCopy: (command: string) => void;
}

export const ItemDetailPane: React.FC<ItemDetailPaneProps> = ({
  selectedItem,
  isSyncing,
  onCopy,
}) => {
  const styles = useStyles();

  if (isSyncing) {
    return (
      <div className={styles.emptyState}>
        <Spinner size="huge" label="正在扫描游戏目录并建立索引..." labelPosition="below" />
        <Text
          size={200}
          style={{ color: tokens.colorNeutralForeground4, textAlign: "center", maxWidth: "250px" }}
        >
          这可能需要几秒钟，请稍候。
        </Text>
      </div>
    );
  }

  if (!selectedItem) {
    return (
      <div className={styles.emptyState}>
        <ClipboardRegular style={{ fontSize: "48px" }} />
        <Text>请在左侧列表中选择一个物品以查看详细信息。</Text>
      </div>
    );
  }

  const spawnCommand = `@give @p/${selectedItem.id}/1`;

  return (
    <>
      <div className={styles.detailHeader}>
        <Caption1
          style={{
            color: tokens.colorNeutralForeground4,
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
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
              padding: "4px 10px",
            }}
          >
            {selectedItem.rarity}
          </span>
          <Badge appearance="outline">
            {CATEGORIES.find((c) => c.key === selectedItem.category)?.label || "其他"}
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
            onClick={() => onCopy(spawnCommand)}
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
            onClick={() => onCopy(`give ${selectedItem.id}`)}
          >
            复制指令
          </Button>
        </div>
      </div>

      <Divider />

      <div style={{ color: tokens.colorNeutralForeground4, fontSize: "12px" }}>
        <p>💡 提示：</p>
        <ul style={{ paddingLeft: "16px", margin: "4px 0" }}>
          <li>
            <code>@p</code> 代表当前玩家。
          </li>
          <li>复制指令后，在游戏聊天框直接按 <code>Ctrl+V</code> 发送即可。</li>
          <li>如果是服务器后台，请复制控制台指令。</li>
        </ul>
      </div>
    </>
  );
};
