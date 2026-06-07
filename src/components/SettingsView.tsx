import React, { useState, useEffect } from "react";
import {
  Title2,
  Title3,
  Body1,
  Card,
  CardHeader,
  Button,
  Input,
  Label,
  makeStyles,
  shorthands,
  tokens,
  RadioGroup,
  Radio,
  Divider,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text
} from "@fluentui/react-components";
import {
  SettingsRegular,
  FolderRegular,
  InfoRegular,
  ColorRegular
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("24px"),
    padding: "24px",
    height: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
    maxWidth: "800px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("16px"),
  },
  row: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
  },
  pathInputGroup: {
    display: "flex",
    ...shorthands.gap("8px"),
    width: "100%",
  },
  infoCard: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    ...shorthands.gap("8px"),
    marginTop: "8px",
  },
  metaLabel: {
    color: tokens.colorNeutralForeground4,
    fontWeight: "bold",
  },
  syncStatusContainer: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("12px"),
    ...shorthands.padding("16px"),
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke3}`,
  }
});

interface SettingsViewProps {
  themeMode: "light" | "dark" | "system";
  onChangeThemeMode: (mode: "light" | "dark" | "system") => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ themeMode, onChangeThemeMode }) => {
  const styles = useStyles();
  const [gamePath, setGamePath] = useState("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Unturned");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load configuration state on mount
  useEffect(() => {
    const savedPath = localStorage.getItem("unturned_game_path");
    if (savedPath) {
      setGamePath(savedPath);
    }
  }, []);

  // Automatic path verification with a 500ms debounce
  useEffect(() => {
    if (!gamePath) {
      setVerificationResult(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsVerifying(true);
      try {
        const msg = await invoke<string>("verify_unturned_path", { gamePath });
        setVerificationResult({ success: true, message: msg });
      } catch (err: any) {
        setVerificationResult({ success: false, message: err.toString() || "路径验证失败。" });
      } finally {
        setIsVerifying(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [gamePath]);

  const handlePickFolder = async () => {
    try {
      const selected = await invoke<string | null>("pick_folder");
      if (selected) {
        setGamePath(selected);
        localStorage.setItem("unturned_game_path", selected);
        setVerificationResult(null);
      }
    } catch (err) {
      console.error("Failed to pick folder:", err);
    }
  };

  return (
    <div className={styles.container}>
      <Title2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <SettingsRegular /> 助手设置
      </Title2>

      <Divider />

      {/* Theme Settings */}
      <div className={styles.section}>
        <Title3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ColorRegular /> 外观主题
        </Title3>
        <div className={styles.row}>
          <Label id="theme-label">选择应用显示主题：</Label>
          <RadioGroup 
            aria-labelledby="theme-label"
            value={themeMode}
            onChange={(_, data) => onChangeThemeMode(data.value as "light" | "dark" | "system")}
            layout="horizontal"
          >
            <Radio value="light" label="浅色模式 (Light)" />
            <Radio value="dark" label="深色模式 (Dark)" />
            <Radio value="system" label="跟随系统 (System)" />
          </RadioGroup>
        </div>
      </div>

      <Divider />

      {/* Game Paths & Verification */}
      <div className={styles.section}>
        <Title3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FolderRegular /> 游戏路径配置
        </Title3>
        <div className={styles.row}>
          <Label htmlFor="game-path-input">Unturned 安装路径：</Label>
          <div className={styles.pathInputGroup}>
            <Input
              id="game-path-input"
              value={gamePath}
              onChange={(e) => {
                setGamePath(e.target.value);
                localStorage.setItem("unturned_game_path", e.target.value);
                setVerificationResult(null);
              }}
              style={{ flex: 1 }}
            />
            <Button icon={<FolderRegular />} onClick={handlePickFolder}>
              浏览...
            </Button>
          </div>
          <Body1 style={{ color: tokens.colorNeutralForeground4, fontSize: "12px" }}>
            配置正确的安装目录（包含 Bundles 文件夹）以开启物品/车辆ID自动索引功能。
          </Body1>
        </div>

        {/* Auto Verification Panel */}
        <div className={styles.syncStatusContainer}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Text weight="semibold">路径检测状态：</Text>
            {isVerifying ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Spinner size="tiny" />
                <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>正在检测路径...</Text>
              </div>
            ) : verificationResult ? (
              <Text style={{ color: verificationResult.success ? tokens.colorPaletteGreenForeground1 : tokens.colorPaletteRedForeground1, fontWeight: "bold" }}>
                {verificationResult.success ? "路径有效 (包含 Bundles)" : "路径无效 (未找到 Bundles)"}
              </Text>
            ) : (
              <Text style={{ color: tokens.colorNeutralForeground4 }}>
                请输入或选择安装路径
              </Text>
            )}
          </div>

          {verificationResult && (
            <MessageBar intent={verificationResult.success ? "success" : "error"} style={{ marginTop: "8px" }}>
              <MessageBarBody>
                <MessageBarTitle>{verificationResult.success ? "路径有效" : "路径验证失败"}</MessageBarTitle>
                {verificationResult.message}
              </MessageBarBody>
            </MessageBar>
          )}
        </div>
      </div>

      <Divider />

      {/* About */}
      <div className={styles.section}>
        <Title3 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <InfoRegular /> 关于助手
        </Title3>
        <Card className={styles.infoCard}>
          <CardHeader
            header={<strong>Unturned 游戏助手</strong>}
            description="版本 v0.1.0 (Beta)"
          />
          <Body1>
            这是一款专为生存联机游戏《Unturned》打造的高效辅助桌面客户端。致力于为玩家提供优质便捷的代码查询、合成查询与地图支持。
          </Body1>
          <div className={styles.metaGrid}>
            <div className={styles.metaLabel}>主要依赖：</div>
            <div>React, Tauri, Fluent UI</div>

            <div className={styles.metaLabel}>作者：</div>
            <div>Ayndpa</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
