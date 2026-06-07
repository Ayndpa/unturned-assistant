import React from "react";
import { 
  Title1, 
  Title3,
  Body1, 
  Card, 
  CardHeader, 
  makeStyles,
  shorthands,
  tokens
} from "@fluentui/react-components";
import { 
  LibraryRegular, 
  SettingsRegular, 
  PlayRegular, 
  TranslateRegular,
  WrenchRegular
} from "@fluentui/react-icons";
import { GiCargoCrate } from "react-icons/gi";
import { FiShield, FiCompass, FiMapPin } from "react-icons/fi";
import { FaGamepad } from "react-icons/fa";

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    padding: "28px 40px",
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow16,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    background: `linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)`,
    backdropFilter: "blur(10px)",
    overflow: "hidden",
    minHeight: "150px",
    minWidth: "280px",
    flexShrink: 0,
    ...shorthands.gap("32px"),
    "@media (max-width: 768px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      padding: "24px 28px",
      ...shorthands.gap("24px"),
    }
  },
  heroContent: {
    display: "flex",
    flexDirection: "column",
    zIndex: 2,
    flex: 1,
    maxWidth: "650px",
  },
  heroTitle: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightBold,
    fontSize: "28px",
    lineHeight: "36px",
    marginBottom: "8px",
    letterSpacing: "-0.5px",
  },
  heroSubtitle: {
    color: tokens.colorNeutralForeground2,
    fontSize: "14px",
    lineHeight: "20px",
    marginBottom: "0px",
    maxWidth: "520px",
  },
  heroGraphicContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    position: "relative",
    paddingRight: "20px",
    "@media (max-width: 768px)": {
      display: "none",
    }
  },
  glowBlob1: {
    position: "absolute",
    width: "300px",
    height: "300px",
    top: "-150px",
    right: "-100px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0, 120, 212, 0.1) 0%, rgba(0, 120, 212, 0) 70%)",
    filter: "blur(50px)",
    zIndex: 1,
    pointerEvents: "none",
  },
  glowBlob2: {
    position: "absolute",
    width: "250px",
    height: "250px",
    bottom: "-120px",
    left: "30%",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0) 70%)",
    filter: "blur(40px)",
    zIndex: 1,
    pointerEvents: "none",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    ...shorthands.gap("20px"),
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(8px)",
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
        {/* Glow blobs for premium blur effect */}
        <div className={styles.glowBlob1} />
        <div className={styles.glowBlob2} />

        {/* Content Column */}
        <div className={styles.heroContent}>
          <Title1 className={styles.heroTitle}>Unturned 游戏助手</Title1>
          <Body1 className={styles.heroSubtitle}>
            为您提供最全面的 Unturned 物品 ID 查询、合成指南及联机辅助。基于 Microsoft Fluent Design 风格构建，带来原生般的 Windows 桌面交互体验。
          </Body1>
        </div>

        {/* Graphic Column */}
        <div className={styles.heroGraphicContainer}>
          <div className="hero-graphic-crate" style={{
            position: "relative",
            width: "160px",
            height: "160px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Center Glowing Ring & Crate */}
            <div style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackground2} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: tokens.shadow16,
              border: `2px solid ${tokens.colorBrandBackgroundHover}`,
            }}>
              <GiCargoCrate style={{ fontSize: "52px", color: "#ffffff" }} />
            </div>

            {/* Floating Badges */}
            {/* Shield (Defense) */}
            <div className="hero-graphic-cube-blue" style={{
              position: "absolute",
              top: "-5px",
              left: "-5px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: tokens.colorNeutralBackground1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: tokens.shadow8,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
            }}>
              <FiShield style={{ fontSize: "18px", color: tokens.colorBrandForeground1 }} />
            </div>

            {/* Compass (Navigation) */}
            <div className="hero-graphic-cube-teal" style={{
              position: "absolute",
              bottom: "10px",
              left: "-15px",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: tokens.colorNeutralBackground1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: tokens.shadow8,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
            }}>
              <FiCompass style={{ fontSize: "20px", color: tokens.colorPaletteGreenForeground1 }} />
            </div>

            {/* Map Pin (Map radar) */}
            <div className="hero-graphic-cube-purple" style={{
              position: "absolute",
              top: "20px",
              right: "-15px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: tokens.colorNeutralBackground1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: tokens.shadow8,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
            }}>
              <FiMapPin style={{ fontSize: "18px", color: tokens.colorPaletteBerryForeground1 }} />
            </div>

            {/* Gamepad (App) */}
            <div className="hero-graphic-cube-blue" style={{
              position: "absolute",
              bottom: "-5px",
              right: "5px",
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: tokens.colorNeutralBackground1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: tokens.shadow8,
              border: `1px solid ${tokens.colorNeutralStroke2}`,
            }}>
              <FaGamepad style={{ fontSize: "22px", color: tokens.colorBrandForeground1 }} />
            </div>
          </div>
        </div>
      </div>

      <Title3>辅助工具</Title3>
      
      <div className={styles.grid}>
        <Card className={styles.card} onClick={() => onNavigate("id-search")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <LibraryRegular className={styles.cardIcon} />
                <div>物品百科</div>
              </div>
            }
            description="收录游戏内武器、弹药、衣物、载具、医疗、建筑等数百项常用物品ID，一键复制给药/刷物指令。"
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

        <Card className={styles.card} onClick={() => onNavigate("localization")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <TranslateRegular className={styles.cardIcon} />
                <div>汉化补丁</div>
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

        <Card className={styles.card} onClick={() => onNavigate("settings")}>
          <CardHeader
            header={
              <div className={styles.cardTitle}>
                <SettingsRegular className={styles.cardIcon} />
                <div>系统设置</div>
              </div>
            }
            description="自定义助手主题（明亮、暗黑或随系统），配置 Unturned 游戏路径，获取软件版本及更新。"
          />
        </Card>
      </div>
    </div>
  );
};
