"use client";

import { useEffect, useState, useRef } from "react";
import {
  init,
  AuthType,
} from "@thoughtspot/visual-embed-sdk";
import { LiveboardEmbed } from "@thoughtspot/visual-embed-sdk/react";
import { THOUGHTSPOT_HOST, LIVEBOARD_ID } from "./config";

/**
 * 🐛 MINIMAL REPRO: preRenderId + fullHeight + hidden parent = 0×0 wrapper
 *
 * STEPS TO REPRO:
 *  1. Edit src/app/config.ts with your ThoughtSpot host & liveboard ID
 *  2. Run `npm install && npm run dev`
 *  3. Open browser console (DevTools)
 *  4. Page loads with the liveboard inside a CLOSED (display: none) container
 *  5. Click "Show Liveboard" — observe:
 *       ❌ The wrapper stays at width=0px height=0px (check DOM or console logs)
 *       ❌ Even though placeholder has inline styles for width/height, getBoundingClientRect returns 0×0
 *       ❌ Calling syncPreRenderStyle() manually from console also doesn't fix it
 *
 *  Compare with the version WITHOUT preRenderId — it works correctly.
 *
 *  TO INSPECT WRAPPER:
 *    Run this in browser console:
 *      document.querySelectorAll('[id^="tsEmbed-pre-render-wrapper"]')
 *        .forEach(w => console.log(w.id, w.style.cssText, w.getBoundingClientRect()))
 */

export default function HomePage() {
  // Initialize the ThoughtSpot SDK once on mount
  useEffect(() => {
    init({
      thoughtSpotHost: THOUGHTSPOT_HOST,
      authType: AuthType.None,
    });
  }, []);

  // Mutation observer: log every style write to wrapper/placeholder
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        const target = m.target as HTMLElement;
        if (
          m.attributeName === "style" &&
          target.id &&
          (target.id.includes("tsEmbed-pre-render-wrapper") ||
            target.id.includes("tsEmbed-pre-render-placeholder"))
        ) {
          const type = target.id.includes("wrapper") ? "📦 WRAPPER" : "📍 PLACEHOLDER";
          const shortId = target.id.slice(-12);
          const hasZero = target.style.cssText.includes("0px");
          // eslint-disable-next-line no-console
          console.log(
            `${type} ${shortId} →`,
            `w=${target.style.width || "?"} h=${target.style.height || "?"}`,
            hasZero ? "⚠️ HAS 0px" : "",
          );
        }
      });
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, []);

  const [showLiveboard, setShowLiveboard] = useState(false);
  const embedRefWithPreRender = useRef<any>(null);
  const embedRefWithoutPreRender = useRef<any>(null);

  const manualSync = () => {
    if (embedRefWithPreRender.current?.syncPreRenderStyle) {
      embedRefWithPreRender.current.syncPreRenderStyle();
      // eslint-disable-next-line no-console
      console.log("✅ Called syncPreRenderStyle() manually");
    } else {
      // eslint-disable-next-line no-console
      console.log("❌ No ref to embed yet");
    }
  };

  const inspectWrappers = () => {
    const wrappers = document.querySelectorAll('[id^="tsEmbed-pre-render-wrapper"]');
    // eslint-disable-next-line no-console
    console.log(`Found ${wrappers.length} wrapper(s):`);
    wrappers.forEach((w) => {
      // eslint-disable-next-line no-console
      console.log(w.id, {
        cssText: (w as HTMLElement).style.cssText,
        rect: w.getBoundingClientRect(),
      });
    });
  };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>preRenderId + fullHeight = 0×0 Wrapper Bug Repro</h1>

      <div
        style={{
          background: "#fff3cd",
          border: "2px solid #ff8800",
          padding: "1rem",
          borderRadius: "6px",
          marginBottom: "1rem",
          fontSize: "0.9rem",
        }}
      >
        <h3 style={{ marginTop: 0 }}>How to reproduce:</h3>
        <ol>
          <li>
            Page loads with the liveboard mounted inside a hidden{" "}
            <code>display: none</code> parent.
          </li>
          <li>SDK&apos;s <code>syncPreRenderStyle()</code> runs while the parent is hidden.</li>
          <li>
            <code>getBoundingClientRect()</code> returns 0×0 because the parent has no
            layout.
          </li>
          <li>Wrapper (attached to <code>body</code>) gets stuck at width=0, height=0.</li>
          <li>
            Click <strong>&quot;Show Liveboard&quot;</strong> — the 🔴 preRenderId version stays
            invisible. The 🟢 non-preRenderId version renders correctly.
          </li>
        </ol>
        <p style={{ margin: 0 }}>
          📋 Open browser console to see mutation logs and use the buttons below to inspect/fix.
        </p>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setShowLiveboard(!showLiveboard)}
          style={btnStyle("#007bff")}
        >
          {showLiveboard ? "Hide Liveboard" : "Show Liveboard"}
        </button>
        <button onClick={manualSync} style={btnStyle("#28a745")}>
          Manually call syncPreRenderStyle()
        </button>
        <button onClick={inspectWrappers} style={btnStyle("#6c757d")}>
          Inspect All Wrappers
        </button>
      </div>

      {/* The HIDDEN PARENT — this is the key to the bug.
          LiveboardEmbed mounts inside a display:none container.
          When SDK calls syncPreRenderStyle(), getBoundingClientRect returns 0×0. */}
      <div style={{ display: showLiveboard ? "block" : "none" }}>
        <section style={sectionStyle("red")}>
          <header style={headerStyle("#ffe5e5", "#cc0000")}>
            🔴 WITH preRenderId — wrapper attached to body, sized via sync. STUCK AT 0×0.
          </header>
          <LiveboardEmbed
            ref={embedRefWithPreRender}
            preRenderId="repro-prerender"
            liveboardId={LIVEBOARD_ID}
            frameParams={{ height: "100%", width: "100%" }}
            fullHeight={true}
          />
        </section>

        <section style={sectionStyle("green")}>
          <header style={headerStyle("#e5f7e9", "#006400")}>
            🟢 WITHOUT preRenderId — iframe lives inside hostElement. Works fine.
          </header>
          <LiveboardEmbed
            ref={embedRefWithoutPreRender}
            liveboardId={LIVEBOARD_ID}
            frameParams={{ height: "600px", width: "100%" }}
            fullHeight={true}
          />
        </section>
      </div>
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────

const btnStyle = (bg: string): React.CSSProperties => ({
  padding: "0.5rem 1rem",
  background: bg,
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "0.9rem",
});

const sectionStyle = (color: "red" | "green"): React.CSSProperties => ({
  border: `2px solid ${color === "red" ? "#ff6b6b" : "#28a745"}`,
  borderRadius: "6px",
  marginBottom: "1.5rem",
  overflow: "hidden",
});

const headerStyle = (bg: string, color: string): React.CSSProperties => ({
  padding: "0.6rem 1rem",
  background: bg,
  color,
  fontSize: "0.875rem",
  fontWeight: 600,
});
