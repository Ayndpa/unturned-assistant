import React, { useState, useEffect } from "react";
import {
  Title2,
  Body1,
  Card,
  CardHeader,
  Button,
  makeStyles,
  shorthands,
  tokens,
  Divider,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  Switch
} from "@fluentui/react-components";
import {
  KeyboardRegular,
  InfoRegular,
  AlertUrgentRegular,
  ArrowClockwiseRegular,
  CheckmarkCircleRegular
} from "@fluentui/react-icons";
import { invoke } from "@tauri-apps/api/core";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("20px"),
    padding: "24px",
    height: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
    maxWidth: "800px",
  },
  headerSection: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "4px",
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
  registryCode: {
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.padding("2px", "6px"),
    borderRadius: tokens.borderRadiusMedium,
    fontFamily: "monospace",
    fontSize: "11px",
    color: tokens.colorNeutralForeground3,
  },
  explainerCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    transitionProperty: "transform, box-shadow",
    transitionDuration: "0.2s",
    transitionTimingFunction: "ease",
  },
  bulletList: {
    paddingLeft: "20px",
    marginTop: "8px",
    marginBottom: "8px",
    "& li": {
      marginBottom: "6px",
      lineHeight: "1.5",
    }
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    marginTop: "16px",
  }
});

export const ImeCompatibilityView: React.FC = () => {
  const styles = useStyles();
  const [loading, setLoading] = useState(true);
  const [compatibilityMode, setCompatibilityMode] = useState(false);
  const [savedMode, setSavedMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [restarting, setRestarting] = useState(false);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const isCompat: boolean = await invoke("check_ime_compatibility");
      setCompatibilityMode(isCompat);
      setSavedMode(isCompat);
    } catch (err: any) {
      setError(err.toString() || "无法获取当前输入法状态");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleToggle = async (checked: boolean) => {
    setError(null);
    setSuccessMsg(null);
    try {
      await invoke("set_ime_compatibility", { enabled: checked });
      setCompatibilityMode(checked);
      setSuccessMsg(`已成功${checked ? "启用" : "禁用"}兼容模式！需要一键刷新输入法服务使其生效。`);
    } catch (err: any) {
      setError(err.toString() || "保存设置失败");
    }
  };

  const handleRestartIme = async () => {
    setError(null);
    setSuccessMsg(null);
    setRestarting(true);
    try {
      await invoke("restart_ime");
      setSuccessMsg("输入法服务已成功刷新，设置已生效！");
      await checkStatus();
    } catch (err: any) {
      setError(err.toString() || "刷新输入法服务失败，请尝试手动重启电脑。");
    } finally {
      setRestarting(false);
    }
  };

  const hasUnappliedChanges = compatibilityMode !== savedMode;

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <Title2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <KeyboardRegular /> 输入法兼容性
        </Title2>
        <Divider />
      </div>

      {loading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px" }}>
          <Spinner size="medium" />
          <Text>正在检测系统输入法配置...</Text>
        </div>
      ) : (
        <div className={styles.section}>
          {/* Status and Action */}
          <Card className={styles.statusCard}>
            <div className={styles.statusHeader}>
              <div className={styles.statusIndicator}>
                {compatibilityMode ? (
                  <CheckmarkCircleRegular style={{ color: tokens.colorPaletteGreenForeground1, fontSize: "24px" }} />
                ) : (
                  <AlertUrgentRegular style={{ color: tokens.colorPaletteYellowForeground1, fontSize: "24px" }} />
                )}
                <span className={styles.statusTitle}>
                  {compatibilityMode ? "已启用微软拼音兼容模式" : "当前使用新版微软拼音（可能会在游戏内产生冲突）"}
                </span>
              </div>
              <Switch
                checked={compatibilityMode}
                onChange={(_, data) => handleToggle(data.checked)}
                label={compatibilityMode ? "已启用旧版兼容性" : "已禁用旧版兼容性"}
              />
            </div>

            <div style={{ color: tokens.colorNeutralForeground4, fontSize: "12px", marginBottom: "16px", paddingLeft: "32px" }}>
              策略注册表项: <span className={styles.registryCode}>HKEY_CURRENT_USER\Software\Policies\Microsoft\InputMethod\Settings\CHS\ConfigureImeVersion</span> = <strong>{compatibilityMode ? "1" : "0"}</strong>
            </div>

            {hasUnappliedChanges && (
              <MessageBar intent="warning" style={{ marginBottom: "12px" }}>
                <MessageBarBody>
                  <MessageBarTitle>设置已更新，但尚未完全生效</MessageBarTitle>
                  注册表已修改，但您必须<strong>一键刷新输入法服务</strong>或<strong>注销/重启电脑</strong>后，Windows 才会应用此设置。
                </MessageBarBody>
              </MessageBar>
            )}

            {successMsg && (
              <MessageBar intent="success" style={{ marginBottom: "12px" }}>
                <MessageBarBody>
                  <MessageBarTitle>操作成功</MessageBarTitle>
                  {successMsg}
                </MessageBarBody>
              </MessageBar>
            )}

            {error && (
              <MessageBar intent="error" style={{ marginBottom: "12px" }}>
                <MessageBarBody>
                  <MessageBarTitle>错误</MessageBarTitle>
                  {error}
                </MessageBarBody>
              </MessageBar>
            )}

            <div className={styles.actionRow}>
              <Button
                appearance="primary"
                icon={<ArrowClockwiseRegular />}
                onClick={handleRestartIme}
                disabled={restarting}
              >
                {restarting ? "正在刷新输入法服务..." : "一键刷新输入法服务 (推荐)"}
              </Button>
              <Button
                appearance="outline"
                onClick={checkStatus}
                disabled={restarting}
              >
                刷新状态
              </Button>
            </div>
          </Card>

          {/* Explainers */}
          <Card className={styles.explainerCard}>
            <CardHeader
              header={
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: tokens.fontWeightSemibold }}>
                  <InfoRegular /> 为什么要开启此选项？
                </div>
              }
            />
            <div style={{ padding: "0 12px 16px 12px" }}>
              <Body1>
                微软在 Windows 10/11 后期版本中引入了新版微软拼音输入法。然而，许多采用 Unity/Unreal 等引擎开发的老款游戏（如《Unturned》）在兼容性方面存在缺陷。
              </Body1>
              <ul className={styles.bulletList}>
                <li><strong>游戏卡死与崩溃：</strong>在游戏内按 Shift 或 Ctrl 误唤出输入法输入中文时，可能导致游戏窗口无响应甚至闪退。</li>
                <li><strong>输入框无法显示：</strong>在聊天框中输入汉字时，看不见选字框，导致只能盲打。</li>
                <li><strong>丢失窗口焦点：</strong>打字会导致游戏被最小化或者鼠标指针飞出游戏窗口。</li>
              </ul>
              <Body1>
                开启“使用以前版本的微软拼音输入法”（兼容性模式）是目前公认最完美的解决方案，不会影响日常电脑打字体验，但能彻底解决游戏内中文输入的冲突。
              </Body1>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

