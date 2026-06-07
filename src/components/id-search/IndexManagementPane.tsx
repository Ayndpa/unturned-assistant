import React from "react";
import {
  Text,
  Badge,
  Button,
  Card,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Caption1,
  Title3,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { ArrowSyncRegular, SettingsRegular } from "@fluentui/react-icons";
import { CATEGORIES } from "../../utils/types";

const useStyles = makeStyles({
  detailHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
});

interface IndexManagementPaneProps {
  gamePath: string | null;
  itemCount: number;
  categoryStats: Record<string, number>;
  isSyncing: boolean;
  syncError: string | null;
  onSync: () => void;
  onNavigate: (page: string) => void;
}

export const IndexManagementPane: React.FC<IndexManagementPaneProps> = ({
  gamePath,
  itemCount,
  categoryStats,
  isSyncing,
  syncError,
  onSync,
  onNavigate,
}) => {
  const styles = useStyles();

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
          数据管理
        </Caption1>
        <Title3>索引数据管理</Title3>
      </div>

      <Divider />

      {/* Status card */}
      <Card
        style={{
          backgroundColor: tokens.colorNeutralBackground3,
          padding: "12px",
          borderLeft: `4px solid ${tokens.colorPaletteGreenBorder2}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground2 }}>
            ● 本地索引已建立
          </Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            共收录 <b>{itemCount}</b> 个物品及载具数据
          </Text>
        </div>
      </Card>

      {/* Path info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Text weight="semibold">游戏安装路径</Text>
        <Text
          size={200}
          style={{
            color: tokens.colorNeutralForeground3,
            wordBreak: "break-all",
            backgroundColor: tokens.colorNeutralBackground3,
            padding: "8px",
            borderRadius: "4px",
          }}
        >
          <code>{gamePath || "未配置"}</code>
        </Text>
      </div>

      <Divider />

      {/* Category breakdown */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Text weight="semibold">数据分类统计</Text>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {CATEGORIES.filter((cat) => cat.key !== "all").map((cat) => {
            const count = categoryStats[cat.key] || 0;
            return (
              <div
                key={cat.key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "4px 0",
                }}
              >
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
        <Button
          appearance="primary"
          icon={<ArrowSyncRegular />}
          onClick={onSync}
          disabled={isSyncing}
          style={{ width: "100%" }}
        >
          重新扫描并重建索引
        </Button>
        <Button
          appearance="secondary"
          icon={<SettingsRegular />}
          onClick={() => onNavigate("settings")}
          style={{ width: "100%" }}
        >
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
  );
};
