import React from "react";
import { Card, Text, Badge, makeStyles, shorthands, tokens, mergeClasses } from "@fluentui/react-components";
import { RARITY_COLORS, UnturnedItem } from "../../utils/types";

const useStyles = makeStyles({
  itemCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    cursor: "pointer",
    transitionProperty: "transform, box-shadow, border-color, background-color",
    transitionDuration: "0.15s",
    transitionTimingFunction: "ease",
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "84px",
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow8,
      ...shorthands.borderColor(tokens.colorBrandStroke1),
    },
  },
  selectedCard: {
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
});

interface ItemCardProps {
  item: UnturnedItem;
  isSelected: boolean;
  onClick: (item: UnturnedItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected, onClick }) => {
  const styles = useStyles();
  const rColor = RARITY_COLORS[item.rarity];

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
      onClick={() => onClick(item)}
      style={{
        borderColor: isSelected ? rColor.color : undefined,
        backgroundColor: isSelected ? rColor.bg : undefined,
        borderWidth: isSelected ? "1.5px" : "1px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          gap: "6px",
        }}
      >
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Text
              weight="bold"
              style={{
                fontSize: "14px",
                lineHeight: "1.3",
                color: tokens.colorNeutralForeground1,
                wordBreak: "break-all",
                flex: 1,
              }}
            >
              {primaryName}
            </Text>
            {item.blueprints && item.blueprints.length > 0 && (
              <Badge size="small" appearance="tint" color="brand" title={`${item.blueprints.length} 个合成配方`} style={{ marginLeft: "4px", flexShrink: 0 }}>
                制作
              </Badge>
            )}
          </div>
          {secondaryName && (
            <Text
              size={100}
              style={{
                color: tokens.colorNeutralForeground4,
                wordBreak: "break-all",
                fontStyle: "italic",
              }}
            >
              {secondaryName}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};
