import React from "react";
import {
  Card,
  Button,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  Badge,
  mergeClasses,
} from "@fluentui/react-components";
import {
  ArrowDownloadRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";
import { LocalizationItem } from "./types";

const useStyles = makeStyles({
  modCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transitionProperty: "transform, box-shadow",
    transitionDuration: "0.2s",
    transitionTimingFunction: "ease",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: tokens.shadow8,
    },
    display: "flex",
    flexDirection: "column",
    height: "100%",
    justifyContent: "space-between",
  },
  modCardBody: {
    ...shorthands.padding("16px"),
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  modCardHeader: {
    display: "flex",
    ...shorthands.gap("12px"),
    alignItems: "center",
    marginBottom: "12px",
  },
  modIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "8px",
    objectFit: "cover",
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  },
  modTitleContainer: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    overflow: "hidden",
  },
  modTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "15px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  modAuthor: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground4,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  modInfoGrid: {
    display: "grid",
    gridTemplateColumns: "85px 1fr",
    ...shorthands.gap("6px", "12px"),
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
    marginBottom: "16px",
    flex: 1,
  },
  infoLabel: {
    color: tokens.colorNeutralForeground4,
  },
  modActions: {
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    ...shorthands.padding("12px", "16px"),
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

interface ModCardProps {
  mod: LocalizationItem;
  isInstalled: boolean;
  isInstalling: boolean;
  isPathValid: boolean;
  actionStatus: string | null;
  onInstall: (mod: LocalizationItem) => void;
}

export const ModCard: React.FC<ModCardProps> = ({
  mod,
  isInstalled,
  isInstalling,
  isPathValid,
  actionStatus,
  onInstall,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.modCard}>
      <div className={styles.modCardBody}>
        <div className={styles.modCardHeader}>
          {mod.iconUrl ? (
            <img src={mod.iconUrl} alt={mod.title} className={styles.modIcon} />
          ) : (
            <div
              className={styles.modIcon}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ArrowDownloadRegular
                style={{ fontSize: "24px", color: tokens.colorNeutralForeground4 }}
              />
            </div>
          )}
          <div className={styles.modTitleContainer}>
            <span className={styles.modTitle} title={mod.title}>
              {mod.title}
            </span>
            <span className={styles.modAuthor} title={mod.author}>
              作者：{mod.author}
            </span>
          </div>
          <Badge color={mod.status === "正常" ? "success" : "warning"}>{mod.status}</Badge>
        </div>

        <div className={styles.modInfoGrid}>
          <span className={styles.infoLabel}>文件大小：</span>
          <span>{mod.fileSize}</span>

          <span className={styles.infoLabel}>发布日期：</span>
          <span>{mod.createdTime}</span>

          <span className={styles.infoLabel}>最后更新：</span>
          <span>{mod.updatedTime}</span>

          <span className={styles.infoLabel}>同步时间：</span>
          <span>{mod.syncTime}</span>
        </div>
      </div>

      <div className={mergeClasses(styles.modActions, "card-actions-area")}>
        {isInstalled ? (
          <span
            style={{
              color: tokens.colorPaletteGreenForeground1,
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "13px",
              fontWeight: "semibold",
            }}
          >
            <CheckmarkCircleRegular /> 已应用汉化
          </span>
        ) : (
          <span />
        )}

        <Button
          appearance="primary"
          icon={isInstalling ? <Spinner size="tiny" /> : <ArrowDownloadRegular />}
          onClick={() => onInstall(mod)}
          disabled={isInstalling || !!actionStatus || !isPathValid}
        >
          {isInstalling ? "正在安装..." : isInstalled ? "覆盖安装" : "一键安装"}
        </Button>
      </div>
    </Card>
  );
};
