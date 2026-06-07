import React, { useEffect, useState } from "react";
import { Card, Text, Badge, makeStyles, shorthands, tokens, mergeClasses } from "@fluentui/react-components";
import { RARITY_COLORS, UnturnedItem } from "../../utils/types";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";

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
    flexDirection: "row",
    alignItems: "center",
    ...shorthands.gap("12px"),
    minHeight: "92px",
    width: "fit-content", // Allow card to grow with content
    maxWidth: "450px",   // But not too wide
    flexGrow: 0,        // Don't force grow to fill row
    flexShrink: 0,      // Don't shrink below content width
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
    color: tokens.colorNeutralForeground3,
    fontSize: "11px",
    fontFamily: "monospace",
    marginLeft: "12px", // Space after rarity badge
  },
  rarityBadge: {
    ...shorthands.padding("1px", "6px"),
    borderRadius: "4px",
    fontWeight: "600",
    fontSize: "10px",
    textTransform: "uppercase",
    lineHeight: "1.2",
    flexShrink: 0,
  },
  imageContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "64px",
    width: "64px",
    flexShrink: 0,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    borderRadius: tokens.borderRadiusMedium,
    ...shorthands.overflow("hidden"),
  },
  itemIcon: {
    maxHeight: "56px",
    maxWidth: "56px",
    objectFit: "contain",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    justifyContent: "center",
    ...shorthands.gap("4px"),
    minWidth: "120px", // Reasonable minimum for text
  },
  nameRow: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("1px"),
    width: "100%",
  },
  primaryName: {
    fontSize: "14px",
    fontWeight: "600",
    color: tokens.colorNeutralForeground1,
    line_height: "1.2",
    whiteSpace: "nowrap", // Don't wrap, let card widen instead
  }
});

interface ItemCardProps {
  item: UnturnedItem;
  isSelected: boolean;
  gamePath?: string | null;
  onClick: (item: UnturnedItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, isSelected, gamePath, onClick }) => {
  const styles = useStyles();
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  useEffect(() => {
    if (gamePath && item.guid) {
      invoke<string | null>("resolve_item_icon", {
        gamePath,
        guid: item.guid,
        isVehicle: item.category === "vehicles"
      }).then((path) => {
        if (path) {
          setIconUrl(convertFileSrc(path));
        } else {
          setIconUrl(null);
        }
      }).catch(console.error);
    } else {
      setIconUrl(null);
    }
  }, [gamePath, item.guid, item.category]);

  const rColor = RARITY_COLORS[item.rarity];

  const nameMatch = item.name.match(/^(.*?)\s*\((.*?)\)$/);
  let primaryName = item.name;
  let secondaryName = "";
  if (nameMatch) {
    primaryName = nameMatch[2];
    secondaryName = nameMatch[1];
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
      {/* Icon Area */}
      <div className={styles.imageContainer}>
        {iconUrl ? (
          <img src={iconUrl} alt={primaryName} className={styles.itemIcon} loading="lazy" />
        ) : (
          <div style={{ color: tokens.colorNeutralForeground4, fontSize: "20px" }}>?</div>
        )}
      </div>

      {/* Info Area */}
      <div className={styles.contentContainer}>
        <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "8px" }}>
          <span
            className={styles.rarityBadge}
            style={{ color: rColor.color, backgroundColor: rColor.bg }}
          >
            {item.rarity}
          </span>
          {item.blueprints && item.blueprints.length > 0 && (
            <Badge size="small" appearance="tint" color="brand" style={{ fontSize: "10px" }}>
              制作
            </Badge>
          )}
          <span className={styles.cardId}>#{item.id}</span>
        </div>

        <div className={styles.nameRow}>
          <Text className={styles.primaryName} title={primaryName}>{primaryName}</Text>
          {secondaryName && (
            <Text
              size={100}
              style={{
                color: tokens.colorNeutralForeground4,
                fontStyle: "italic",
                lineHeight: "1.2",
              }}
              title={secondaryName}
            >
              {secondaryName}
            </Text>
          )}
        </div>
      </div>
    </Card>
  );
};
