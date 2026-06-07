import React from "react";
import {
  Title2,
  Body1,
  makeStyles,
  shorthands,
  tokens,
  Divider,
} from "@fluentui/react-components";
import { WrenchRegular } from "@fluentui/react-icons";
import { ImeSection } from "./optimization/ImeSection";
import { PageFileSection } from "./optimization/PageFileSection";

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("28px"),
    padding: "24px",
    height: "100%",
    boxSizing: "border-box",
    overflowY: "auto",
    maxWidth: "860px",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    ...shorthands.gap("8px"),
    marginBottom: "4px",
  },
});

export const SystemOptimizationView: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <Title2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <WrenchRegular /> 系统优化
        </Title2>
        <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
          一键优化 Windows 系统设置，提升游戏兼容性与运行流畅度。
        </Body1>
        <Divider />
      </div>

      {/* Section 1: IME Compatibility */}
      <ImeSection />

      <Divider />

      {/* Section 2: Virtual Memory */}
      <PageFileSection />
    </div>
  );
};
