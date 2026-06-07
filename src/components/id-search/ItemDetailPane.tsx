import React, { useMemo } from "react";
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
  Card,
} from "@fluentui/react-components";
import { CopyRegular, ClipboardRegular, WrenchRegular, InfoRegular } from "@fluentui/react-icons";
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(4px)",
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
  onSelectItem?: (item: UnturnedItem) => void;
  resolveItem?: (idOrGuid: string) => UnturnedItem | null;
  items?: UnturnedItem[];
}

export const ItemDetailPane: React.FC<ItemDetailPaneProps> = ({
  selectedItem,
  isSyncing,
  onCopy,
  onSelectItem,
  resolveItem,
  items = [],
}) => {
  const styles = useStyles();

  // Find recipes where this item is used as an input
  const usages = useMemo(() => {
    if (!selectedItem || !items) return [];
    const itemIdStr = selectedItem.id.toString();
    const itemGuid = selectedItem.guid;

    return items.filter((item) => {
      if (!item.blueprints) return false;
      return item.blueprints.some((bp) => {
        return bp.inputs.some((input) => {
          return (
            input.idOrGuid === itemIdStr ||
            (itemGuid && input.idOrGuid.toLowerCase() === itemGuid.toLowerCase())
          );
        });
      });
    });
  }, [selectedItem, items]);

  // Helper to parse bilingual names (e.g. "English (Chinese)")
  const getBilingualNames = (fullName: string) => {
    const nameMatch = fullName.match(/^(.*?)\s*\((.*?)\)$/);
    if (nameMatch) {
      return { primary: nameMatch[2], secondary: nameMatch[1] }; // Chinese, English
    }
    return { primary: fullName, secondary: "" };
  };

  // Render clickable ingredient / output button
  const renderItemButton = (
    idOrGuid: string,
    amount: number,
    isTool: boolean
  ) => {
    const targetItem = resolveItem ? resolveItem(idOrGuid) : null;
    if (!targetItem) {
      return (
        <Button
          key={idOrGuid}
          appearance="outline"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "left",
            width: "100%",
            padding: "8px 12px",
            height: "auto",
            gap: "8px",
            marginBottom: "6px",
          }}
          icon={<InfoRegular />}
          disabled
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <Text weight="semibold" style={{ fontSize: "13px" }}>未知物品 ({idOrGuid})</Text>
            <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
              {isTool ? "工具 (不消耗)" : `数量: ${amount}`}
            </Caption1>
          </div>
        </Button>
      );
    }

    const { primary, secondary } = getBilingualNames(targetItem.name);
    const rColor = RARITY_COLORS[targetItem.rarity];

    return (
      <Button
        key={`${targetItem.id}-${idOrGuid}`}
        appearance="subtle"
        onClick={() => onSelectItem && onSelectItem(targetItem)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          textAlign: "left",
          width: "100%",
          padding: "8px 12px",
          height: "auto",
          gap: "8px",
          borderLeft: `3px solid ${rColor.color}`,
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(4px)",
          boxShadow: tokens.shadow2,
          marginBottom: "6px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text weight="semibold" style={{ fontSize: "13px" }}>
              {primary}
            </Text>
            <Text size={100} style={{ color: tokens.colorNeutralForeground4, fontWeight: "bold" }}>
              #{targetItem.id}
            </Text>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
            <Caption1 style={{ color: tokens.colorNeutralForeground3, fontStyle: secondary ? "italic" : "normal" }}>
              {secondary || targetItem.rarity}
            </Caption1>
            <Badge size="small" appearance="filled" color={isTool ? "brand" : "subtle"}>
              {isTool ? "工具 (不消耗)" : `数量: x${amount}`}
            </Badge>
          </div>
        </div>
      </Button>
    );
  };

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

  const bilingualNames = getBilingualNames(selectedItem.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
        <Title3>{bilingualNames.primary}</Title3>
        {bilingualNames.secondary && (
          <Text size={200} style={{ color: tokens.colorNeutralForeground3, display: "block", fontStyle: "italic", marginTop: "-4px" }}>
            {bilingualNames.secondary}
          </Text>
        )}

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

      <Divider />

      {/* Synthesize Recipes (How to craft) */}
      <div>
        <Text weight="semibold" style={{ display: "block", marginBottom: "10px" }}>
          🔨 合成配方 (如何制作)
        </Text>

        {selectedItem.blueprints && selectedItem.blueprints.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selectedItem.blueprints.map((bp, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  backdropFilter: "blur(4px)",
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                  borderRadius: tokens.borderRadiusMedium,
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {/* Recipe Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Badge appearance="outline" color="brand">
                    配方 {selectedItem.blueprints!.length > 1 ? `#${index + 1}` : ""}
                  </Badge>
                  {bp.skill && (
                    <Badge appearance="tint" color="warning" icon={<WrenchRegular />}>
                      技能: {bp.skill}
                    </Badge>
                  )}
                  {bp.typeOrCategory && bp.typeOrCategory !== "Barricade" && bp.typeOrCategory !== "Tool" && bp.typeOrCategory !== "Supply" && (
                    <Caption1 style={{ color: tokens.colorNeutralForeground4 }}>
                      {bp.typeOrCategory}
                    </Caption1>
                  )}
                </div>

                {/* Inputs */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Caption1 style={{ color: tokens.colorNeutralForeground4, marginBottom: "6px", fontWeight: "bold" }}>
                    所需材料：
                  </Caption1>
                  {bp.inputs.map((input) =>
                    renderItemButton(input.idOrGuid, input.amount, input.isTool)
                  )}
                </div>

                {/* Output indicator if multiple or different amount */}
                {bp.outputs.length > 0 && (bp.outputs[0].amount > 1 || bp.outputs[0].idOrGuid !== selectedItem.id.toString()) && (
                  <div style={{ display: "flex", flexDirection: "column", borderTop: `1px dashed ${tokens.colorNeutralStroke2}`, paddingTop: "8px", marginTop: "4px" }}>
                    <Caption1 style={{ color: tokens.colorNeutralForeground4, marginBottom: "6px", fontWeight: "bold" }}>
                      合成产物：
                    </Caption1>
                    {bp.outputs.map((out) =>
                      renderItemButton(out.idOrGuid, out.amount, false)
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(4px)", padding: "12px", border: "none" }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
              该物品无法直接合成。（这通常是基础材料或地图自然刷新物品，如废金属、原木等）
            </Text>
          </Card>
        )}
      </div>

      <Divider />

      {/* Downstream Usages (What this crafts) */}
      <div>
        <Text weight="semibold" style={{ display: "block", marginBottom: "10px" }}>
          💡 物品用途 (可合成什么)
        </Text>

        {usages.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {usages.map((usageItem) =>
              renderItemButton(usageItem.id.toString(), 1, false)
            )}
          </div>
        ) : (
          <Card style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(4px)", padding: "12px", border: "none" }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
              该物品暂无其他合成配方用途。
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
};
