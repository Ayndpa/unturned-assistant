import React from "react";

interface Node {
  tag: string;
  value?: string;
  children: React.ReactNode[];
}

function renderNode(node: Node, key: string | number): React.ReactNode {
  const { tag, value, children } = node;

  switch (tag) {
    case "color": {
      const safeColor = value ? value.replace(/[^#a-zA-Z0-9]/g, "") : "";
      return (
        <span key={key} style={{ color: safeColor }}>
          {children}
        </span>
      );
    }
    case "b":
      return (
        <strong key={key} style={{ fontWeight: "bold" }}>
          {children}
        </strong>
      );
    case "i":
      return (
        <em key={key} style={{ fontStyle: "italic" }}>
          {children}
        </em>
      );
    case "size": {
      const num = parseInt(value || "", 10);
      const sizeStyle = isNaN(num) ? undefined : `${num}px`;
      return (
        <span key={key} style={{ fontSize: sizeStyle }}>
          {children}
        </span>
      );
    }
    default:
      return <React.Fragment key={key}>{children}</React.Fragment>;
  }
}

export function renderRichText(text: string): React.ReactNode {
  if (!text) return "";

  // Split by Unity rich text tags
  const tokens = text.split(/(<\/?[a-zA-Z0-9]+(?:=[^>]+)?>)/g);
  
  const root: Node = { tag: "root", children: [] };
  const stack: Node[] = [root];

  for (const token of tokens) {
    if (!token) continue;

    if (token.startsWith("<") && token.endsWith(">")) {
      if (token.startsWith("</")) {
        // Close tag
        const tagName = token.slice(2, -1).toLowerCase();
        
        let foundIdx = -1;
        for (let i = stack.length - 1; i >= 1; i--) {
          if (stack[i].tag === tagName) {
            foundIdx = i;
            break;
          }
        }

        if (foundIdx !== -1) {
          while (stack.length > foundIdx) {
            const closedNode = stack.pop()!;
            const parent = stack[stack.length - 1];
            const element = renderNode(closedNode, `${parent.tag}-${parent.children.length}`);
            parent.children.push(element);
          }
        } else {
          // Treat mismatched closing tag as plain text
          const current = stack[stack.length - 1];
          current.children.push(token);
        }
      } else {
        // Open tag
        const tagContent = token.slice(1, -1);
        const eqIdx = tagContent.indexOf("=");
        let tagName = tagContent;
        let tagValue = "";

        if (eqIdx !== -1) {
          tagName = tagContent.slice(0, eqIdx).trim().toLowerCase();
          tagValue = tagContent.slice(eqIdx + 1).trim();
          if ((tagValue.startsWith('"') && tagValue.endsWith('"')) || 
              (tagValue.startsWith("'") && tagValue.endsWith("'"))) {
            tagValue = tagValue.slice(1, -1);
          }
        } else {
          tagName = tagName.toLowerCase();
        }

        stack.push({
          tag: tagName,
          value: tagValue,
          children: []
        });
      }
    } else {
      // Plain text
      const current = stack[stack.length - 1];
      current.children.push(token);
    }
  }

  while (stack.length > 1) {
    const closedNode = stack.pop()!;
    const parent = stack[stack.length - 1];
    const element = renderNode(closedNode, `${parent.tag}-${parent.children.length}`);
    parent.children.push(element);
  }

  return <>{root.children}</>;
}
