import React, { useState } from "react";
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
  Divider
} from "@fluentui/react-components";
import {
  SettingsRegular,
  FolderRegular,
  InfoRegular,
  ColorRegular
} from "@fluentui/react-icons";

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
  }
});

interface SettingsViewProps {
  themeMode: "light" | "dark" | "system";
  onChangeThemeMode: (mode: "light" | "dark" | "system") => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ themeMode, onChangeThemeMode }) => {
  const styles = useStyles();
  const [gamePath, setGamePath] = useState("C:\\Program Files (x86)\\Steam\\steamapps\\common\\Unturned");

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

      {/* Game Paths */}
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
              onChange={(e) => setGamePath(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button icon={<FolderRegular />} onClick={() => alert("此功能需要配置 Tauri 后台。当前为静态演示页面。")}>
              浏览...
            </Button>
          </div>
          <Body1 style={{ color: tokens.colorNeutralForeground4, fontSize: "12px" }}>
            配置路径后，未来版本将支持一键备份存档、导入MOD及快速启动游戏等功能。
          </Body1>
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
            <div className={styles.metaLabel}>技术栈：</div>
            <div>Tauri v2 + Bun + React + TS + Microsoft Fluent UI</div>

            <div className={styles.metaLabel}>构建框架：</div>
            <div>Vite & Rust (Cargo)</div>

            <div className={styles.metaLabel}>开源声明：</div>
            <div>本项目目前处于静态模板开发阶段，界面遵循 Microsoft Fluent 设计指南。</div>
          </div>
        </Card>
      </div>
    </div>
  );
};
