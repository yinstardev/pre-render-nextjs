# TSE PreRender 0×0 Wrapper Bug — Minimal Repro

Minimal Next.js app demonstrating the `preRenderId + fullHeight + hidden parent = 0×0 wrapper` bug in `@thoughtspot/visual-embed-sdk`.

## Setup

1. Copy the config template and fill in your ThoughtSpot host + liveboard ID:

```bash
cp src/app/config.example.ts src/app/config.ts
# then edit src/app/config.ts
```

```ts
export const THOUGHTSPOT_HOST = "https://your-instance.thoughtspot.cloud";
export const LIVEBOARD_ID = "your-liveboard-id";
```

(`config.ts` is gitignored so your host/IDs stay private.)

2. Install dependencies and run:

```bash
npm install
npm run dev
```

3. Open http://localhost:3000

## How to Reproduce the Bug

1. Open browser DevTools console
2. Page loads with the liveboard mounted inside a hidden (`display: none`) parent
3. Click **"Show Liveboard"** button
4. Observe:
   - 🔴 **WITH preRenderId** → wrapper stays at `width: 0; height: 0`, liveboard invisible
   - 🟢 **WITHOUT preRenderId** → works correctly

## What's Happening (Bug Mechanism)

The SDK's `preRender` mode attaches a positioned wrapper directly to `document.body` (not inside the React tree). It sizes this wrapper based on a placeholder element via `getBoundingClientRect()`.

When the React component mounts inside a `display: none` parent:

1. `syncPreRenderStyle()` runs
2. `placeholder.getBoundingClientRect()` returns `{ width: 0, height: 0 }` because the placeholder is in an unlayouted (hidden) subtree
3. Wrapper gets set to `width: 0px; height: 0px`
4. **No reliable trigger re-syncs the wrapper** when the parent becomes visible later
5. Iframe inside the wrapper exists but is clipped to 0×0

## Debugging Tools (Built into the page)

- **"Manually call syncPreRenderStyle()"** — proves that even manual re-sync doesn't fix it
- **"Inspect All Wrappers"** — logs all wrapper elements + their dimensions
- **Mutation observer** — logs every style change on wrappers/placeholders (in console)

## Workarounds (Client-side, no SDK change)

### Workaround 1 — Conditional mount

```tsx
<div style={{ display: open ? "block" : "none" }}>
  {open && <LiveboardEmbed preRenderId="..." liveboardId="..." fullHeight />}
</div>
```

### Workaround 2 — Drop `preRenderId`

```tsx
<LiveboardEmbed liveboardId="..." fullHeight />
```

### Workaround 3 — Wait for layout

```tsx
const ref = useRef(null);
const [ready, setReady] = useState(false);

useEffect(() => {
  const check = () => {
    if (ref.current?.offsetWidth > 0) setReady(true);
    else requestAnimationFrame(check);
  };
  check();
}, []);

return (
  <div ref={ref}>
    {ready && <LiveboardEmbed preRenderId="..." liveboardId="..." fullHeight />}
  </div>
);
```

## SDK Version

This repro uses `@thoughtspot/visual-embed-sdk@517` (the PR #517 build) — the bug is still present in this version.

## Files

- `src/app/page.tsx` — the actual repro with toggle + diagnostics
- `src/app/config.ts` — fill in your ThoughtSpot host + liveboard ID
- `src/app/layout.tsx` — Next.js root layout
