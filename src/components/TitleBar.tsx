import React, { useState, useEffect } from "react";
import { 
  makeStyles, 
  shorthands, 
  tokens, 
  Text 
} from "@fluentui/react-components";
import { 
  SubtractRegular, 
  SquareRegular, 
  DismissRegular,
  WindowMultipleRegular,
  LibraryRegular
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  titleBar: {
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    userSelect: "none",
    position: "relative",
    zIndex: 1000,
  },
  dragRegion: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    height: "100%",
    ...shorthands.padding("0px", "12px"),
  },
  logoIcon: {
    fontSize: "14px",
    color: tokens.colorBrandForeground1,
  },
  titleText: {
    fontSize: "12px",
    marginLeft: "8px",
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
  },
  windowControls: {
    display: "flex",
    height: "100%",
    position: "relative",
    zIndex: 1001,
  },
  controlButton: {
    width: "46px",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    ...shorthands.borderStyle("none"),
    color: tokens.colorNeutralForeground1,
    cursor: "default",
    transitionProperty: "background-color, color",
    transitionDuration: "0.1s",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
    "&:active": {
      backgroundColor: tokens.colorNeutralBackground3Pressed,
    }
  },
  closeButton: {
    "&:hover": {
      backgroundColor: "#e81123",
      color: "#ffffff",
    },
    "&:active": {
      backgroundColor: "#f1707a",
      color: "#ffffff",
    }
  }
});

export const TitleBar: React.FC = () => {
  const styles = useStyles();
  const [isMaximized, setIsMaximized] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Detect if running inside Tauri
    const detectTauri = typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
    setIsTauri(detectTauri);

    if (detectTauri) {
      let unlisten: (() => void) | undefined;
      
      const initWindow = async () => {
        try {
          const { getCurrentWindow } = await import("@tauri-apps/api/window");
          const win = getCurrentWindow();
          setIsMaximized(await win.isMaximized());
          
          unlisten = await win.onResized(async () => {
            setIsMaximized(await win.isMaximized());
          });
        } catch (err) {
          console.error("Failed to initialize Tauri window listeners", err);
        }
      };

      initWindow();

      return () => {
        if (unlisten) unlisten();
      };
    }
  }, []);

  const handleMinimize = async () => {
    if (isTauri) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().minimize();
    } else {
      console.log("Minimize window (Web Demo)");
    }
  };

  const handleMaximize = async () => {
    if (isTauri) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().toggleMaximize();
    } else {
      setIsMaximized(!isMaximized);
      console.log("Toggle maximize window (Web Demo)");
    }
  };

  const handleClose = async () => {
    if (isTauri) {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().close();
    } else {
      console.log("Close window (Web Demo)");
      alert("关闭窗口（在 Tauri 客户端中生效）");
    }
  };

  return (
    <div className={styles.titleBar}>
      {/* Draggable drag region */}
      <div className={styles.dragRegion} data-tauri-drag-region>
        <LibraryRegular className={styles.logoIcon} />
        <Text className={styles.titleText}>Unturned 游戏助手</Text>
      </div>

      {/* Non-draggable window controls */}
      <div className={styles.windowControls}>
        <button 
          title="最小化" 
          className={styles.controlButton} 
          onClick={handleMinimize}
        >
          <SubtractRegular style={{ fontSize: "12px" }} />
        </button>
        <button 
          title={isMaximized ? "向下还原" : "最大化"} 
          className={styles.controlButton} 
          onClick={handleMaximize}
        >
          {isMaximized ? (
            <WindowMultipleRegular style={{ fontSize: "10px" }} />
          ) : (
            <SquareRegular style={{ fontSize: "10px" }} />
          )}
        </button>
        <button 
          title="关闭" 
          className={`${styles.controlButton} ${styles.closeButton}`} 
          onClick={handleClose}
        >
          <DismissRegular style={{ fontSize: "12px" }} />
        </button>
      </div>
    </div>
  );
};
