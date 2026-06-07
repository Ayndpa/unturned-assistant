import { useState, useEffect } from "react";
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
  Spinner
} from "@fluentui/react-components";
import {
  HomeRegular,
  LibraryRegular,
  BookOpenRegular,
  PlayRegular,
  SettingsRegular
} from "@fluentui/react-icons";
import { HomeView } from "./components/HomeView";
import { IdSearchView } from "./components/IdSearchView";
import { SettingsView } from "./components/SettingsView";
import { TitleBar } from "./components/TitleBar";
import "./App.css";

const useStyles = makeStyles({
  rootContainer: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },
  appContainer: {
    display: "flex",
    flex: 1,
    width: "100%",
    overflow: "hidden",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
  },
  sidebar: {
    width: "220px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    ...shorthands.padding("16px", "12px"),
    boxSizing: "border-box",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("10px"),
    ...shorthands.padding("8px", "12px", "24px", "12px"),
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
  },
  tabItem: {
    width: "100%",
    justifyContent: "flex-start",
    height: "40px",
    ...shorthands.margin("4px", "0px"),
  },
  footerSection: {
    ...shorthands.padding("8px", "12px"),
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    marginTop: "16px",
  },
  footerText: {
    color: tokens.colorNeutralForeground4,
    fontSize: "11px",
  },
  mainContent: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
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

function App() {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState("home");
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");
  const [isDark, setIsDark] = useState(false);

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

  const currentTheme = isDark ? webDarkTheme : webLightTheme;

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomeView onNavigate={(page) => setActiveTab(page)} />;
      case "id-search":
        return <IdSearchView />;
      case "settings":
        return <SettingsView themeMode={themeMode} onChangeThemeMode={setThemeMode} />;
      case "crafting":
      case "maps":
        return (
          <div className={styles.loadingContainer}>
            <Spinner size="huge" label="正在建设中..." labelPosition="below" />
            <Text style={{ color: tokens.colorNeutralForeground4, marginTop: "8px" }}>
              敬请期待！下一个版本将为您带来{activeTab === "crafting" ? "合成指南" : "高清地图雷达"}。
            </Text>
          </div>
        );
      default:
        return <HomeView onNavigate={(page) => setActiveTab(page)} />;
    }
  };

  return (
    <FluentProvider theme={currentTheme}>
      <div className={styles.rootContainer}>
        <TitleBar />
        <div className={styles.appContainer}>
          {/* Navigation Sidebar */}
          <aside className={styles.sidebar}>
            <div>
              <div className={styles.logoSection}>
                <LibraryRegular className={styles.logoIcon} />
                <Text size={400} className={styles.logoText}>Unturned 助手</Text>
              </div>
              
              <nav className={styles.navSection}>
                <TabList
                  vertical
                  selectedValue={activeTab}
                  onTabSelect={(_, data) => setActiveTab(data.value as string)}
                  className={styles.tabList}
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
                    物品ID查询
                  </Tab>
                  <Tab 
                    value="crafting" 
                    icon={<BookOpenRegular />}
                    className={styles.tabItem}
                  >
                    合成手册
                  </Tab>
                  <Tab 
                    value="maps" 
                    icon={<PlayRegular />}
                    className={styles.tabItem}
                  >
                    地图雷达
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
              <Text className={styles.footerText}>Unturned Game Assistant</Text>
              <br />
              <Text className={styles.footerText} style={{ opacity: 0.7 }}>v0.1.0</Text>
            </div>
          </aside>

          {/* Main Workspace Area */}
          <main className={styles.mainContent}>
            {renderContent()}
          </main>
        </div>
      </div>
    </FluentProvider>
  );
}

export default App;
