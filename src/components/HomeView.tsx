import React from "react";
import { 
  Title1, 
  Title3,
  Body1, 
  Card, 
  CardHeader, 
  Button,
  makeStyles,
  shorthands,
  tokens
} from "@fluentui/react-components";
import { 
  LibraryRegular, 
  SettingsRegular, 
  PlayRegular, 
  BookOpenRegular,
  TranslateRegular,
  WrenchRegular
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
  },
  heroSection: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    backgroundImage: "linear-gradient(135deg, #0078d4 0%, #00bcf2 100%)",
    color: "#ffffff",
    padding: "32px",
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow16,
    position: "relative",
    overflow: "hidden",
  },
  heroTitle: {
    color: "#ffffff",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    maxWidth: "500px",
    marginBottom: "20px",
  },
  heroButtons: {
    display: "flex",
    ...shorthands.gap("12px"),
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    ...shorthands.gap("20px"),
  },
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow4,
    transitionProperty: "transform, box-shadow",
    transitionDuration: "0.2s",
    transitionTimingFunction: "ease",
    "&:hover": {
      transform: "translateY(-4px)",
      boxShadow: tokens.shadow16,
      cursor: "pointer",
    }
  },
  cardTitle: {
    fontWeight: tokens.fontWeightSemibold,
  },
  cardIcon: {
    fontSize: "24px",
    color: tokens.colorCompoundBrandStroke,
    marginBottom: "12px",
  }
});

interface HomeViewProps {
  onNavigate: (page: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <Title1 className={styles.heroTitle}>Unturned 游戏助手</Title1>
        <Body1 className={styles.heroSubtitle}>
          为您提供最全面的 Unturned 物品 ID 查询、合成指南及联机辅助。基于 Microsoft Fluent Design 风格构建，带来原生般的 Windows 桌面交互体验。
        </Body1>
        <div className={styles.heroButtons}>
          <Button 
            appearance="primary" 
            icon={<LibraryRegular />} 
            onClick={() => onNavigate("id-search")}
            size="large"
          >
            开始查询 ID
          </Button>
          <Button 
            appearance="outline" 
            icon={<BookOpenRegular />}
            onClick={() => window.open("https://unturned.fandom.com/wiki/Unturned_Wiki", "_blank")}
            size="large"
            style={{ color: "white", borderColor: "white" }}
          >
            游戏百科 (Wiki)
          </Button>
        </div>
      </div>

      <Title3 style={{ marginTop: "12px" }}>辅助工具</Title3>
      
      <div className={styles.grid}>
        <Card className={styles.card} onClick={() => onNavigate("id-search")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <LibraryRegular className={styles.cardIcon} />
                <div>物品 ID 查询</div>
              </div>
            }
            description="收录游戏内武器、弹药、衣物、载具、医疗、建筑等数百项常用物品ID，一键复制给药/刷物指令。"
          />
        </Card>

        <Card className={styles.card} onClick={() => onNavigate("localization")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <TranslateRegular className={styles.cardIcon} />
                <div>汉化补丁下载</div>
              </div>
            }
            description="从 API 服务器实时获取可用的汉化补丁，一键下载并自动解压安装到本地 Unturned 目录。"
          />
        </Card>

        <Card className={styles.card} onClick={() => onNavigate("ime-compatibility")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <WrenchRegular className={styles.cardIcon} />
                <div>系统优化</div>
              </div>
            }
            description="一键开启微软拼音旧版兼容模式，并自动把虚拟内存调整到剩余空间最多的磁盘并固定为 8 GB，彻底消除游戏卡顿。"
          />
        </Card>

        <Card className={styles.card} onClick={() => onNavigate("crafting")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <BookOpenRegular className={styles.cardIcon} />
                <div>合成表查询 (开发中)</div>
              </div>
            }
            description="便捷的配方手册。快速了解枪械、配件、防具、药剂以及各种建筑防具的合成公式。"
          />
        </Card>

        <Card className={styles.card} onClick={() => onNavigate("maps")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <PlayRegular className={styles.cardIcon} />
                <div>地图雷达 (开发中)</div>
              </div>
            }
            description="精美的高清地图标注，为您展现 PEI, Russia, Washington 等地图上的资源分布、NPC位置和安全区。"
          />
        </Card>

        <Card className={styles.card} onClick={() => onNavigate("settings")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <SettingsRegular className={styles.cardIcon} />
                <div>助手设置</div>
              </div>
            }
            description="自定义助手主题（明亮、暗黑或随系统），配置 Unturned 游戏路径，获取软件版本及更新。"
          />
        </Card>
      </div>
    </div>
  );
};
