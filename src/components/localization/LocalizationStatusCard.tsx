import React from "react";
import {
  Title3,
  Card,
  Button,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  Badge,
  mergeClasses,
} from "@fluentui/react-components";
import {
  CheckmarkCircleRegular,
  DeleteRegular,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  statusCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    ...shorthands.padding("16px"),
    flexShrink: 0,
  },
  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    ...shorthands.gap("12px"),
    marginBottom: "12px",
  },
  statusBadge: {
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    display: "inline-flex",
    alignItems: "center",
  },
  statusDetails: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    color: tokens.colorNeutralForeground2,
    fontSize: "13px",
  },
  bold: {
    fontWeight: "bold",
    wordBreak: "break-all",
  },
  infoLabel: {
    color: tokens.colorNeutralForeground4,
  },
  actionRow: {
    marginTop: "16px",
    display: "flex",
    gap: "12px",
    ...shorthands.padding("12px", "16px"),
    ...shorthands.margin("16px", "-16px", "-16px", "-16px"),
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
  },
});

interface LocalizationStatusCardProps {
  gamePath: string;
  isInstalled: boolean;
  installedMod: string | null;
  isPathValid: boolean;
  isCheckingPath: boolean;
  actionStatus: string | null;
  onUninstall: () => void;
}

export const LocalizationStatusCard: React.FC<LocalizationStatusCardProps> = ({
  gamePath,
  isInstalled,
  installedMod,
  isPathValid,
  isCheckingPath,
  actionStatus,
  onUninstall,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.statusCard}>
      <div className={styles.statusHeader}>
        <Title3>本地汉化状态</Title3>
        {isInstalled ? (
          <Badge 
            color="success" 
            icon={<CheckmarkCircleRegular />} 
            className={styles.statusBadge}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              已检测到汉化补丁 {installedMod && `(${installedMod})`}
            </span>
          </Badge>
        ) : (
          <Badge color="warning" className={styles.statusBadge}>未检测到汉化</Badge>
        )}
      </div>

      <div className={styles.statusDetails}>
        <div>
          <span className={styles.infoLabel}>Unturned 根目录：</span>
          <span className={styles.bold}>{gamePath || "未配置"}</span>
          <div
            style={{
              color: tokens.colorNeutralForeground4,
              marginTop: "4px",
              fontSize: "12px",
            }}
          >
            (下载的汉化包将自动解压并覆盖安装至此根目录下)
          </div>
        </div>
        <div>
          <span className={styles.infoLabel}>状态检测：</span>
          {isCheckingPath ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Spinner size="tiny" /> 正在检测路径...
            </span>
          ) : isPathValid ? (
            <span
              style={{ color: tokens.colorPaletteGreenForeground1, fontWeight: "bold" }}
            >
              ✓ 游戏路径有效，随时可以进行安装
            </span>
          ) : (
            <span
              style={{ color: tokens.colorPaletteRedForeground1, fontWeight: "bold" }}
            >
              ✗ 游戏路径无效或未配置，请先到「系统设置」选择正确的 Unturned 安装路径
            </span>
          )}
        </div>
      </div>

      <div className={mergeClasses(styles.actionRow, "card-actions-area")}>
        {isInstalled && (
          <Button
            appearance="primary"
            icon={<DeleteRegular />}
            onClick={onUninstall}
            disabled={!gamePath || !!actionStatus}
          >
            一键清除汉化并还原英文
          </Button>
        )}
        {!isPathValid && !isCheckingPath && (
          <MessageBar intent="warning">
            <MessageBarBody>
              请确保游戏路径正确（必须包含 Bundles 文件夹）以保证汉化能正常覆盖。
            </MessageBarBody>
          </MessageBar>
        )}
      </div>
    </Card>
  );
};
