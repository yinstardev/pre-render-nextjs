"use client";

import dynamic from "next/dynamic";

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

// SDK is browser-only. Load the actual component dynamically with SSR disabled.
// This avoids the "SSR environment detected" warning at import time and any
// hydration mismatches around the iframe.
const LiveboardRepro = dynamic(() => import("./LiveboardRepro"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: "1.5rem", fontFamily: "sans-serif" }}>Loading SDK…</div>
  ),
});

export default function HomePage() {
  return <LiveboardRepro />;
}
