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
  Spinner,
} from "@fluentui/react-components";
import {
  ArrowSyncRegular,
  SettingsRegular,
  BoxRegular,
  FolderAddRegular,
  DismissRegular,
  FolderRegular,
  ImageSearchRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
} from "@fluentui/react-icons";
import { CATEGORIES } from "../../utils/types";

const useStyles = makeStyles({
  detailHeader: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "bold",
    marginBottom: "4px",
  },
  pathItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 8px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "4px",
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    marginTop: "4px",
  },
  pathText: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
    marginRight: "8px",
  }
});

interface IndexManagementPaneProps {
  gamePath: string | null;
  extraPaths: string[];
  itemCount: number;
  categoryStats: Record<string, number>;
  isSyncing: boolean;
  indexingProgress: { current: number; total: number; message: string } | null;
  syncError: string | null;
  hasMissingIcons: boolean;
  isIndexingImages: boolean;
  isRemovingModule: boolean;
  isImageIndexModuleInstalled: boolean;
  cloudSyncStatus: "idle" | "syncing" | "done" | "error";
  cloudSyncMessage: string | null;
  onSync: () => void;
  onAddExtraPath: () => void;
  onRemoveExtraPath: (path: string) => void;
  onNavigate: (page: string) => void;
  onIndexImages: () => void;
  onRemoveImageIndexModule: () => void;
}

export const IndexManagementPane: React.FC<IndexManagementPaneProps> = ({
  gamePath,
  extraPaths,
  itemCount,
  categoryStats,
  isSyncing,
  indexingProgress,
  syncError,
  hasMissingIcons,
  isIndexingImages,
  isRemovingModule,
  isImageIndexModuleInstalled,
  cloudSyncStatus,
  cloudSyncMessage,
  onSync,
  onAddExtraPath,
  onRemoveExtraPath,
  onNavigate,
  onIndexImages,
  onRemoveImageIndexModule,
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

      {syncError && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>发生错误</MessageBarTitle>
            <div style={{ whiteSpace: 'pre-wrap' }}>{syncError}</div>
          </MessageBarBody>
        </MessageBar>
      )}

      <Divider />

      {/* Status card */}
      <Card
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(4px)",
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

      {/* Cloud sync status card */}
      {cloudSyncStatus !== "idle" && (
        <Card
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(4px)",
            padding: "12px",
            borderLeft: `4px solid ${
              cloudSyncStatus === "syncing"
                ? tokens.colorBrandBackground
                : cloudSyncStatus === "done"
                ? tokens.colorPaletteGreenBorder2
                : tokens.colorPaletteRedBorder2
            }`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {cloudSyncStatus === "syncing" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Spinner size="tiny" />
                <Text weight="semibold" style={{ color: tokens.colorBrandForeground1 }}>
                  正在同步到云端...
                </Text>
              </div>
            )}
            {cloudSyncStatus === "done" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground2 }} />
                <Text weight="semibold" style={{ color: tokens.colorPaletteGreenForeground2 }}>
                  云端同步完成
                </Text>
              </div>
            )}
            {cloudSyncStatus === "error" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ErrorCircleRegular style={{ color: tokens.colorPaletteRedForeground2 }} />
                <Text weight="semibold" style={{ color: tokens.colorPaletteRedForeground2 }}>
                  云端同步失败
                </Text>
              </div>
            )}
            {cloudSyncMessage && (
              <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                {cloudSyncMessage}
              </Text>
            )}
          </div>
        </Card>
      )}

      <Divider />

      {/* Workshop Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className={styles.sectionTitle}>
          <BoxRegular />
          <Text>创意工坊与自定义数据</Text>
        </div>
        <Card
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            padding: "12px",
            border: `1px dashed ${tokens.colorNeutralStroke3}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              如果您订阅了创意工坊的地图或物品包，或者有自定义的 Mod 目录，可以将其添加到索引中。
            </Text>
            
            {extraPaths.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <Text size={100} weight="semibold" style={{ color: tokens.colorNeutralForeground4 }}>已添加的目录：</Text>
                {extraPaths.map((path) => (
                  <div key={path} className={styles.pathItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, overflow: "hidden" }}>
                      <FolderRegular style={{ fontSize: "14px", flexShrink: 0 }} />
                      <span className={styles.pathText} title={path}>{path}</span>
                    </div>
                    <Button
                      size="small"
                      appearance="subtle"
                      icon={<DismissRegular />}
                      onClick={() => onRemoveExtraPath(path)}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              size="small"
              icon={<FolderAddRegular />}
              onClick={onAddExtraPath}
              disabled={isSyncing}
            >
              添加扫描目录
            </Button>
          </div>
        </Card>
      </div>

      <Divider />

      {/* Game Image Indexing Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div className={styles.sectionTitle}>
          <ImageSearchRegular />
          <Text>游戏图标索引</Text>
        </div>
        <Card
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            padding: "12px",
            border: `1px solid ${hasMissingIcons ? tokens.colorPaletteYellowBorder1 : tokens.colorNeutralStroke3}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              如果物品列表中存在无法显示图标的物品，可以使用此功能通过游戏生成缺失的预览图。
            </Text>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Button
                appearance="outline"
                icon={isIndexingImages ? <Spinner size="tiny" /> : <ImageSearchRegular />}
                onClick={onIndexImages}
                disabled={isSyncing || isIndexingImages || isRemovingModule || !gamePath}
                title={!gamePath ? "请先在系统设置中配置游戏安装路径" : undefined}
                style={{
                  width: "100%",
                  opacity: (isSyncing || isIndexingImages || isRemovingModule || !gamePath) ? 0.4 : 1,
                  cursor: (isSyncing || isIndexingImages || isRemovingModule || !gamePath) ? "not-allowed" : "pointer",
                  transition: "opacity 0.2s ease",
                }}
              >
                {isIndexingImages ? "正在索引中..." : "索引游戏图片"}
              </Button>

              {/* 移除模组按钮 + 禁用原因说明 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <Button
                  appearance="subtle"
                  icon={isRemovingModule ? <Spinner size="tiny" /> : <DismissRegular />}
                  onClick={onRemoveImageIndexModule}
                  disabled={isSyncing || isIndexingImages || isRemovingModule || !gamePath || !isImageIndexModuleInstalled}
                  title={
                    !gamePath
                      ? "请先在系统设置中配置游戏安装路径"
                      : !isImageIndexModuleInstalled
                      ? "图片索引模组尚未安装，无需移除"
                      : undefined
                  }
                  style={{
                    width: "100%",
                    opacity: (isSyncing || isIndexingImages || isRemovingModule || !gamePath || !isImageIndexModuleInstalled) ? 0.35 : 1,
                    cursor: (isSyncing || isIndexingImages || isRemovingModule || !gamePath || !isImageIndexModuleInstalled) ? "not-allowed" : "pointer",
                    transition: "opacity 0.2s ease",
                    pointerEvents: "auto",
                  }}
                >
                  {isRemovingModule ? "正在移除..." : "移除图片索引模组"}
                </Button>
                {!isImageIndexModuleInstalled && !isSyncing && !isIndexingImages && gamePath && (
                  <Text
                    size={100}
                    style={{
                      color: tokens.colorNeutralForeground4,
                      paddingLeft: "4px",
                      fontStyle: "italic",
                    }}
                  >
                    ℹ 模组未安装，执行图片索引后方可移除
                  </Text>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Divider />

      {/* Path info */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Text weight="semibold">游戏安装路径</Text>
        <Text
          size={200}
          style={{
            color: tokens.colorNeutralForeground3,
            wordBreak: "break-all",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(4px)",
            padding: "8px",
            borderRadius: "4px",
            border: `1px solid ${tokens.colorNeutralStroke3}`,
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
        {isSyncing && indexingProgress && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>{indexingProgress.message}</Text>
              <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>{indexingProgress.current} / {indexingProgress.total}</Text>
            </div>
            <div style={{ width: "100%", height: "4px", backgroundColor: tokens.colorNeutralBackground3, borderRadius: "2px", overflow: "hidden" }}>
              <div 
                style={{ 
                  width: `${Math.min(100, (indexingProgress.current / (indexingProgress.total || 1)) * 100)}%`, 
                  height: "100%", 
                  backgroundColor: tokens.colorBrandBackground,
                  transition: "width 0.3s ease"
                }} 
              />
            </div>
          </div>
        )}
        
        <Button
          appearance="primary"
          icon={<ArrowSyncRegular />}
          onClick={onSync}
          disabled={isSyncing || isIndexingImages}
          style={{ width: "100%" }}
        >
          {isSyncing ? "正在同步..." : "重新扫描并重建索引"}
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
    </div>
  );
};
