import { useState, useEffect, useCallback } from "react";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  makeStyles,
  shorthands,
  tokens,
  TabList,
  Tab,
  Text,
  Spinner,
  createLightTheme,
  createDarkTheme,
  BrandVariants,
  Button,
} from "@fluentui/react-components";
import { invoke } from "@tauri-apps/api/core";
import {
  HomeRegular,
  LibraryRegular,
  PlayRegular,
  SettingsRegular,
  TranslateRegular,
  WrenchRegular,
  NavigationRegular,
  SparkleRegular,
} from "@fluentui/react-icons";
import { HomeView } from "./components/HomeView";
import { IdSearchView } from "./components/IdSearchView";
import { SettingsView } from "./components/SettingsView";
import { LocalizationView } from "./components/LocalizationView";
import { SystemOptimizationView } from "./components/SystemOptimizationView";
import { AiTranslationView } from "./components/AiTranslationView";
import { TitleBar } from "./components/TitleBar";
import { GiCargoCrate } from "react-icons/gi";
import "./App.css";

const useStyles = makeStyles({
// ... (omitting styles which are unchanged)

  rootContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    backgroundColor: "transparent",
    position: "relative",
  },
  appContainer: {
    display: "flex",
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: "transparent", // Show acrylic through
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    position: "relative",
  },
  sidebar: {
    width: "220px",
    backgroundColor: "var(--app-sidebar-tint)",
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    ...shorthands.padding("16px", "12px"),
    boxSizing: "border-box",
    zIndex: 10000,
    transitionProperty: "transform, width, opacity",
    transitionDuration: "0.2s",
    transitionTimingFunction: "ease",
    "@media (max-width: 900px)": {
      position: "absolute",
      left: "0",
      top: "0",
      bottom: "0",
      backgroundColor: "var(--app-sidebar-tint-solid, rgba(240, 240, 240, 0.95))",
      backdropFilter: "blur(40px)",
      boxShadow: tokens.shadow16,
      transform: "translateX(-100%)",
      opacity: 0,
      pointerEvents: "none",
      borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
    }
  },
  sidebarMobileOpen: {
    "@media (max-width: 900px)": {
      transform: "translateX(0)",
      opacity: 1,
      pointerEvents: "auto",
    }
  },
  sidebarOverlay: {
    display: "none",
    "@media (max-width: 900px)": {
      display: "block",
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0, 0, 0, 0.2)",
      backdropFilter: "blur(2px)",
      zIndex: 9000,
      opacity: 0,
      pointerEvents: "none",
      transitionProperty: "opacity",
      transitionDuration: "0.2s",
    }
  },
  sidebarOverlayVisible: {
    "@media (max-width: 900px)": {
      opacity: 1,
      pointerEvents: "auto",
    }
  },
  mobileHeader: {
    display: "none",
    "@media (max-width: 900px)": {
      display: "flex",
      alignItems: "center",
      ...shorthands.padding("8px", "12px"),
      borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
      backgroundColor: "var(--app-sidebar-tint)",
      ...shorthands.gap("12px"),
      flexShrink: 0,
    }
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("10px"),
    ...shorthands.padding("8px", "12px", "24px", "12px"),
    flexShrink: 0,
  },
  logoIcon: {
    fontSize: "24px",
    color: tokens.colorBrandForeground1,
  },
  logoText: {
    fontWeight: tokens.fontWeightBold,
    letterSpacing: "0.5px",
  },
  navSection: {
    flex: 1,
  },
  tabList: {
    width: "100%",
    backgroundColor: "transparent",
  },
  tabItem: {
    width: "100%",
    justifyContent: "flex-start",
    height: "40px",
    ...shorthands.margin("4px", "0px"),
    backgroundColor: "transparent",
  },
  footerSection: {
    ...shorthands.padding("8px", "12px"),
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: "16px",
  },
  footerText: {
    color: tokens.colorNeutralForeground3,
    fontSize: "11px",
    fontWeight: tokens.fontWeightSemibold,
  },
  mainContent: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  contentWrapper: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    position: "relative",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    ...shorthands.gap("12px"),
  }
});

// Helper to parse hex color to RGB
function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Helper to convert RGB to hex
function rgbToHex(r: number, g: number, b: number) {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return "#" + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
}

// Mix two colors
function mixColors(color1: {r:number; g:number; b:number}, color2: {r:number; g:number; b:number}, weight: number) {
  return {
    r: color1.r * weight + color2.r * (1 - weight),
    g: color1.g * weight + color2.g * (1 - weight),
    b: color1.b * weight + color2.b * (1 - weight)
  };
}

// Generate BrandVariants from base hex
function generateBrandVariants(baseHex: string): BrandVariants {
  const base = hexToRgb(baseHex);
  const black = { r: 0, g: 0, b: 0 };
  const white = { r: 255, g: 255, b: 255 };

  const mixWithBlack = (weight: number) => {
    const mixed = mixColors(base, black, weight);
    return rgbToHex(mixed.r, mixed.g, mixed.b);
  };

  const mixWithWhite = (weight: number) => {
    const mixed = mixColors(base, white, weight);
    return rgbToHex(mixed.r, mixed.g, mixed.b);
  };

  return {
    10: mixWithBlack(0.15),
    20: mixWithBlack(0.3),
    30: mixWithBlack(0.5),
    40: mixWithBlack(0.65),
    50: mixWithBlack(0.8),
    60: baseHex,
    70: mixWithWhite(0.85),
    80: mixWithWhite(0.7),
    90: mixWithWhite(0.55),
    100: mixWithWhite(0.4),
    110: mixWithWhite(0.3),
    120: mixWithWhite(0.2),
    130: mixWithWhite(0.12),
    140: mixWithWhite(0.07),
    150: mixWithWhite(0.03),
    160: mixWithWhite(0.01)
  };
}

function App() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState("home");
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");
  const [themeColor, setThemeColor] = useState<string>("windows");
  const [windowsColor, setWindowsColor] = useState<string>("#0078d4");
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Responsive listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      if (!mobile) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load theme configuration on mount
  useEffect(() => {
    const savedColor = localStorage.getItem("theme_color");
    if (savedColor) {
      setThemeColor(savedColor);
    }
    const savedMode = localStorage.getItem("theme_mode") as "light" | "dark" | "system";
    if (savedMode) {
      setThemeMode(savedMode);
    }
  }, []);

  // Fetch Windows accent color when "windows" theme is active
  useEffect(() => {
    if (themeColor === "windows") {
      invoke<string>("get_windows_accent_color")
        .then((color) => {
          setWindowsColor(color);
        })
        .catch((err) => {
          console.error("Failed to get Windows accent color:", err);
        });
    }
  }, [themeColor]);

  // Determine system theme preference
  useEffect(() => {
    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      
      const listener = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
      };
      
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      setIsDark(themeMode === "dark");
    }
  }, [themeMode]);

  const handleThemeModeChange = (mode: "light" | "dark" | "system") => {
    setThemeMode(mode);
    localStorage.setItem("theme_mode", mode);
  };

  const handleThemeColorChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem("theme_color", color);
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  let currentTheme = isDark ? webDarkTheme : webLightTheme;

  const activeColor = themeColor === "windows" ? windowsColor : themeColor;

  if (activeColor && activeColor !== "#0078d4") {
    try {
      const brand = generateBrandVariants(activeColor);
      currentTheme = isDark ? createDarkTheme(brand) : createLightTheme(brand);
    } catch (err) {
      console.error("Failed to generate brand variants:", err);
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeView onNavigate={(page) => setActiveTab(page)} />;
      case "id-search":
        return <IdSearchView onNavigate={(page) => setActiveTab(page)} />;
      case "localization":
        return <LocalizationView />;
      case "ai-translation":
        return <AiTranslationView />;
      case "ime-compatibility":
        return <SystemOptimizationView />;
      case "settings":
        return (
          <SettingsView
            themeMode={themeMode}
            onChangeThemeMode={handleThemeModeChange}
            themeColor={themeColor}
            onChangeThemeColor={handleThemeColorChange}
            currentSystemColor={windowsColor}
          />
        );
      case "maps":
        return (
          <div className={styles.loadingContainer}>
            <Spinner size="huge" label="正在建设中..." labelPosition="below" />
            <Text style={{ color: tokens.colorNeutralForeground4, marginTop: "8px" }}>
              敬请期待！下一个版本将为您带来高清地图雷达。
            </Text>
          </div>
        );
      default:
        return <HomeView onNavigate={(page) => setActiveTab(page)} />;
    }
  };

  const tabNames: Record<string, string> = {
    home: "首页推荐",
    "id-search": "物品百科",
    maps: "地图雷达",
    localization: "汉化补丁",
    "ai-translation": "AI 翻译",
    "ime-compatibility": "系统优化",
    settings: "系统设置"
  };

  const activeTabText = tabNames[activeTab] || "Unturned 助手";

  return (
    <FluentProvider theme={currentTheme} style={{ backgroundColor: "transparent" }}>
      <div className={`${styles.rootContainer} app-acrylic-shell`} data-theme={isDark ? "dark" : "light"}>
        <TitleBar />
        <div className={styles.appContainer}>
          {/* Navigation Sidebar */}
          <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarMobileOpen : ""}`}>
            <div>
              <div className={styles.logoSection}>
                <GiCargoCrate className={styles.logoIcon} style={{ fontSize: "26px" }} />
                <Text size={400} className={styles.logoText}>Unturned 助手</Text>
              </div>
              
              <nav className={styles.navSection}>
                <TabList
                  vertical
                  selectedValue={activeTab}
                  onTabSelect={(_, data) => {
                    setActiveTab(data.value as string);
                    closeSidebar();
                  }}
                  className={`${styles.tabList} sidebar-tablist`}
                >
                  <Tab 
                    value="home" 
                    icon={<HomeRegular />}
                    className={styles.tabItem}
                  >
                    首页推荐
                  </Tab>
                  <Tab 
                    value="id-search" 
                    icon={<LibraryRegular />}
                    className={styles.tabItem}
                  >
                    物品百科
                  </Tab>
                  <Tab 
                    value="maps" 
                    icon={<PlayRegular />}
                    className={styles.tabItem}
                  >
                    地图雷达
                  </Tab>
                  <Tab 
                    value="localization" 
                    icon={<TranslateRegular />}
                    className={styles.tabItem}
                  >
                    汉化补丁
                  </Tab>
                  <Tab 
                    value="ai-translation" 
                    icon={<SparkleRegular />}
                    className={styles.tabItem}
                  >
                    AI 翻译
                  </Tab>
                  <Tab 
                    value="ime-compatibility" 
                    icon={<WrenchRegular />}
                    className={styles.tabItem}
                  >
                    系统优化
                  </Tab>
                  <Tab 
                    value="settings" 
                    icon={<SettingsRegular />}
                    className={styles.tabItem}
                  >
                    系统设置
                  </Tab>
                </TabList>
              </nav>
            </div>

            <div className={styles.footerSection}>
              <Text className={styles.footerText} style={{ opacity: 0.8 }}>v0.1.0</Text>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className={styles.mainContent}>
            {/* Mobile Nav Bar */}
            <header className={styles.mobileHeader}>
              <Button 
                appearance="subtle" 
                icon={<NavigationRegular />} 
                onClick={toggleSidebar}
              />
              <Text weight="semibold">{activeTabText}</Text>
            </header>

            <div className={styles.contentWrapper}>
              {renderContent()}
            </div>
          </main>

          {/* Mobile Overlay (Moved to bottom for stacking) */}
          <div 
            className={`${styles.sidebarOverlay} ${isSidebarOpen ? styles.sidebarOverlayVisible : ""}`} 
            onClick={closeSidebar}
          />
        </div>
      </div>
    </FluentProvider>
  );
}

export default App;
