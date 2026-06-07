import React, { useState, useEffect } from "react";
import {
  Title3,
  Card,
  CardHeader,
  Button,
  makeStyles,
  shorthands,
  tokens,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Badge,
  ProgressBar,
} from "@fluentui/react-components";
import {
  StorageRegular,
  WarningRegular,
  ArrowClockwiseRegular,
  CheckmarkCircleRegular,
  ArrowResetRegular,
  StarRegular,
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";
import { SystemPageFileStatus } from "./types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtGb = (n: number) => `${n.toFixed(1)} GB`;
const fmtMb = (n: number) => `${n} MB (${(n / 1024).toFixed(1)} GB)`;

// ── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
    fontWeight: tokens.fontWeightSemibold,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  statusCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    ...shorthands.padding("20px"),
  },
  statusHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  statusIndicator: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  statusTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: "16px",
  },
  explainerCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  bulletList: {
    paddingLeft: "20px",
    marginTop: "8px",
    marginBottom: "8px",
    "& li": {
      marginBottom: "6px",
      lineHeight: "1.5",
    },
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    ...shorthands.gap("12px"),
    marginTop: "16px",
  },
  diskList: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("10px"),
    marginTop: "12px",
  },
  diskItem: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("4px"),
    ...shorthands.padding("12px", "16px"),
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transitionProperty: "border-color",
    transitionDuration: "0.15s",
  },
  diskItemRecommended: {
    border: `1.5px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  diskRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  diskLabel: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("8px"),
  },
  diskSizeText: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
  },
  pageFileList: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("6px"),
    marginTop: "10px",
  },
  pageFileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    ...shorthands.padding("8px", "14px"),
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  pageFileLabel: {
    fontFamily: "monospace",
    fontSize: "13px",
  },
});

// ── Component ────────────────────────────────────────────────────────────────

export const PageFileSection: React.FC = () => {
  const styles = useStyles();

  const [loading, setLoading] = useState(true);
  const [pfStatus, setPfStatus] = useState<SystemPageFileStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const loadPfStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const status: SystemPageFileStatus = await invoke("get_pagefile_status");
      setPfStatus(status);
    } catch (err: any) {
      setError(err.toString() || "无法获取虚拟内存状态");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPfStatus();
  }, []);

  const handleSetCustomPagefile = async () => {
    setError(null);
    setSuccess(null);
    setWorking(true);
    try {
      await invoke("set_custom_pagefile");
      setSuccess("虚拟内存已成功设置为 8 GB 固定大小！设置将在重启电脑后完全生效。");
      await loadPfStatus();
    } catch (err: any) {
      setError(
        err.toString() || "设置虚拟内存失败，请确保以管理员身份运行或同意 UAC 提权请求。"
      );
    } finally {
      setWorking(false);
    }
  };

  const handleSetAutoPagefile = async () => {
    setError(null);
    setSuccess(null);
    setWorking(true);
    try {
      await invoke("set_automatic_pagefile");
      setSuccess("已恢复系统自动管理虚拟内存。重启后生效。");
      await loadPfStatus();
    } catch (err: any) {
      setError(err.toString() || "恢复自动管理失败，请确保同意 UAC 提权请求。");
    } finally {
      setWorking(false);
    }
  };

  const recommendedDisk = pfStatus?.disks.find((d) => d.isRecommended);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.section}>
      <Title3 className={styles.sectionTitle}>
        <StorageRegular style={{ fontSize: "20px", color: tokens.colorBrandForeground1 }} />
        系统虚拟内存
      </Title3>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px" }}>
          <Spinner size="medium" />
          <Text>正在读取磁盘与虚拟内存配置...</Text>
        </div>
      ) : (
        <>
          <Card className={styles.statusCard}>
            {/* Current pagefile status */}
            <div className={styles.statusHeader}>
              <div className={styles.statusIndicator}>
                <CheckmarkCircleRegular
                  style={{
                    color: pfStatus?.automaticManaged
                      ? tokens.colorPaletteGreenForeground1
                      : tokens.colorBrandForeground1,
                    fontSize: "24px",
                  }}
                />
                <span className={styles.statusTitle}>
                  {pfStatus?.automaticManaged
                    ? "当前由 Windows 自动管理虚拟内存"
                    : "当前使用自定义虚拟内存设置"}
                </span>
              </div>
              <Badge
                appearance="filled"
                color={pfStatus?.automaticManaged ? "informative" : "brand"}
              >
                {pfStatus?.automaticManaged ? "自动管理" : "手动配置"}
              </Badge>
            </div>

            {/* Current pagefiles */}
            {!pfStatus?.automaticManaged && pfStatus && pfStatus.pageFiles.length > 0 && (
              <div className={styles.pageFileList}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  当前页面文件配置：
                </Text>
                {pfStatus.pageFiles.map((pf, i) => (
                  <div key={i} className={styles.pageFileItem}>
                    <span className={styles.pageFileLabel}>{pf.name}</span>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      初始: {fmtMb(pf.initialSizeMb)} / 最大: {fmtMb(pf.maximumSizeMb)}
                    </Text>
                  </div>
                ))}
              </div>
            )}

            {/* Disk list */}
            {pfStatus && pfStatus.disks.length > 0 && (
              <div className={styles.diskList}>
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                  本地磁盘剩余空间：
                </Text>
                {pfStatus.disks.map((disk) => {
                  const usedRatio =
                    disk.totalSizeGb > 0
                      ? (disk.totalSizeGb - disk.freeSpaceGb) / disk.totalSizeGb
                      : 0;
                  return (
                    <div
                      key={disk.deviceId}
                      className={`${styles.diskItem} ${
                        disk.isRecommended ? styles.diskItemRecommended : ""
                      }`}
                    >
                      <div className={styles.diskRow}>
                        <div className={styles.diskLabel}>
                          <StorageRegular
                            style={{
                              fontSize: "18px",
                              color: disk.isRecommended
                                ? tokens.colorBrandForeground1
                                : tokens.colorNeutralForeground3,
                            }}
                          />
                          <Text weight="semibold">{disk.deviceId}</Text>
                          {disk.isRecommended && (
                            <Badge
                              appearance="filled"
                              color="brand"
                              icon={<StarRegular />}
                              size="small"
                            >
                              推荐
                            </Badge>
                          )}
                        </div>
                        <Text className={styles.diskSizeText}>
                          剩余 {fmtGb(disk.freeSpaceGb)} / 共 {fmtGb(disk.totalSizeGb)}
                        </Text>
                      </div>
                      <ProgressBar
                        value={usedRatio}
                        color={
                          usedRatio > 0.9 ? "error" : usedRatio > 0.7 ? "warning" : "brand"
                        }
                        thickness="medium"
                        style={{ marginTop: "4px" }}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Feedback messages */}
            {success && (
              <MessageBar intent="success" style={{ marginTop: "16px" }}>
                <MessageBarBody>
                  <MessageBarTitle>操作成功</MessageBarTitle>
                  {success}
                </MessageBarBody>
              </MessageBar>
            )}
            {error && (
              <MessageBar intent="error" style={{ marginTop: "16px" }}>
                <MessageBarBody>
                  <MessageBarTitle>错误</MessageBarTitle>
                  {error}
                </MessageBarBody>
              </MessageBar>
            )}

            {/* Action buttons */}
            <div className={styles.actionRow}>
              <Button
                appearance="primary"
                icon={working ? <Spinner size="tiny" /> : <StorageRegular />}
                onClick={handleSetCustomPagefile}
                disabled={working}
              >
                {working
                  ? "正在设置，请等待..."
                  : `一键调整至 ${recommendedDisk?.deviceId ?? "最空磁盘"} (8 GB 固定)`}
              </Button>
              <Button
                appearance="outline"
                icon={<ArrowResetRegular />}
                onClick={handleSetAutoPagefile}
                disabled={working || !!pfStatus?.automaticManaged}
              >
                恢复系统自动管理
              </Button>
              <Button
                appearance="subtle"
                icon={<ArrowClockwiseRegular />}
                onClick={loadPfStatus}
                disabled={working}
              >
                刷新
              </Button>
            </div>
          </Card>

          {/* Warning note */}
          <Card className={styles.explainerCard}>
            <CardHeader
              header={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontWeight: tokens.fontWeightSemibold,
                  }}
                >
                  <WarningRegular style={{ color: tokens.colorPaletteYellowForeground1 }} />
                  操作说明与注意事项
                </div>
              }
            />
            <div style={{ padding: "0 12px 16px 12px" }}>
              <ul className={styles.bulletList}>
                <li>
                  <strong>操作需要管理员权限：</strong>系统将弹出 UAC 提权提示，请点击"是"以允许操作。
                </li>
                <li>
                  <strong>需要重启生效：</strong>虚拟内存的变更在 Windows 中需要重启电脑后才能完全生效。
                </li>
                <li>
                  <strong>一键调整逻辑：</strong>自动选取当前剩余空间最多的磁盘（标记为"推荐"），将所有其他磁盘的页面文件清除，并在该磁盘上创建初始与最大均为 8 GB 的固定大小页面文件。
                </li>
                <li>
                  <strong>为什么设置 8 GB：</strong>8 GB 的虚拟内存对于大多数游戏而言已足够，且固定大小可避免 Windows 动态扩展页面文件时产生的磁盘碎片，提升整体性能。
                </li>
              </ul>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
