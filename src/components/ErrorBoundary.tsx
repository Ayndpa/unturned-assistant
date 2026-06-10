import React, { ErrorInfo, ReactNode, useState, useEffect } from "react";
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
  Text,
  Button,
  makeStyles,
  shorthands,
  tokens,
  Title2,
  createDarkTheme,
  createLightTheme,
  BrandVariants,
} from "@fluentui/react-components";
import { ErrorCircleRegular, ArrowCounterclockwiseRegular, DismissRegular, CopyRegular, CheckmarkRegular } from "@fluentui/react-icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    width: "100vw",
    ...shorthands.padding("40px"),
    boxSizing: "border-box",
    textAlign: "center",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
  },
  icon: {
    fontSize: "72px",
    color: tokens.colorPaletteRedForeground1,
    marginBottom: "24px",
  },
  title: {
    marginBottom: "12px",
  },
  message: {
    marginBottom: "32px",
    maxWidth: "500px",
    color: tokens.colorNeutralForeground2,
  },
  errorDetails: {
    ...shorthands.padding("16px"),
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    marginBottom: "32px",
    maxWidth: "80%",
    width: "100%",
    overflowX: "auto",
    textAlign: "left",
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: "12px",
    maxHeight: "200px",
    overflowY: "auto",
    color: tokens.colorNeutralForeground2,
  },
  actions: {
    display: "flex",
    ...shorthands.gap("12px"),
  },
});

// Minimal theme logic duplicated from App.tsx to ensure it works even if App fails
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

function mixColors(color1: {r:number; g:number; b:number}, color2: {r:number; g:number; b:number}, weight: number) {
  return {
    r: color1.r * weight + color2.r * (1 - weight),
    g: color1.g * weight + color2.g * (1 - weight),
    b: color1.b * weight + color2.b * (1 - weight)
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return "#" + ((1 << 24) + (clamp(r) << 16) + (clamp(g) << 8) + clamp(b)).toString(16).slice(1);
}

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

function ErrorFallback({ error, resetErrorBoundary }: { error: Error | null; resetErrorBoundary: () => void }) {
  const styles = useStyles();
  const [isDark, setIsDark] = useState(false);
  const [brandColor, setBrandColor] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const mode = localStorage.getItem("theme_mode");
    if (mode === "dark") {
      setIsDark(true);
    } else if (mode === "system" || !mode) {
      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }

    const color = localStorage.getItem("theme_color");
    if (color && color !== "windows") {
      setBrandColor(color);
    }
  }, []);

  let theme = isDark ? webDarkTheme : webLightTheme;
  if (brandColor) {
    try {
      const brand = generateBrandVariants(brandColor);
      theme = isDark ? createDarkTheme(brand) : createLightTheme(brand);
    } catch (e) {
      console.error("Failed to generate brand variants in error fallback", e);
    }
  }

  const handleExit = () => {
    // In Tauri, closing the main window exits the app
    window.close();
  };

  const handleCopy = () => {
    if (error) {
      const textToCopy = error.stack || error.message;
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <FluentProvider theme={theme}>
      <div className={styles.container}>
        <ErrorCircleRegular className={styles.icon} />
        <Title2 className={styles.title}>糟糕，程序出了点问题</Title2>
        <Text size={400} className={styles.message}>
          前端界面遇到了一个无法自动恢复的错误。您可以尝试重新加载，如果问题持续存在，请尝试重启或联系开发者。
        </Text>
        
        {error && (
          <div className={styles.errorDetails}>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{error.stack || error.message}</pre>
          </div>
        )}

        <div className={styles.actions}>
          <Button 
            appearance="primary" 
            icon={<ArrowCounterclockwiseRegular />}
            onClick={resetErrorBoundary}
          >
            重新加载
          </Button>
          <Button 
            icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
            onClick={handleCopy}
            disabled={!error}
          >
            {copied ? "已复制" : "复制错误"}
          </Button>
          <Button 
            icon={<DismissRegular />}
            onClick={handleExit}
          >
            退出应用
          </Button>
        </div>
      </div>
    </FluentProvider>
  );
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} resetErrorBoundary={this.handleReset} />;
    }

    return this.childrenWithUnhandledRejectionHandler();
  }

  private childrenWithUnhandledRejectionHandler() {
    return (
      <UnhandledRejectionObserver onError={(error) => this.setState({ hasError: true, error })}>
        {this.props.children}
      </UnhandledRejectionObserver>
    );
  }
}

function UnhandledRejectionObserver({ 
  children, 
  onError 
}: { 
  children: ReactNode; 
  onError: (error: Error) => void 
}) {
  React.useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      onError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
      if (event.error) {
        onError(event.error);
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, [onError]);

  return <>{children}</>;
}

export default ErrorBoundary;
