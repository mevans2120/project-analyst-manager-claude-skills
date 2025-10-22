# Navigation Bug Fix - PM Dashboard

## Problem Summary

When clicking the "Roadmap" tab after viewing the "Tests" tab, the roadmap component failed to load data and displayed a "Failed to load roadmap data" error. However, refreshing the page on the roadmap route worked perfectly.

## Root Cause

**Lit's component lifecycle differs fundamentally from React:**

1. **Lit reuses component instances** when they're disconnected and reconnected to the DOM
2. When navigating away, `disconnectedCallback()` fires, but the component instance is kept in memory
3. When navigating back, Lit **reuses the same instance** and calls `connectedCallback()` again
4. However, custom lifecycle hooks like `onMount()` only run once per instance

**The Bug:**
- The roadmap component cleared its data in `onUnmount()` (called from `disconnectedCallback()`)
- When navigating back, the same instance was reconnected with no data
- `onMount()` wasn't called again because it only runs once per instance
- Result: Component in DOM with empty state → fetch never triggered → error displayed

**Why Refresh Worked:**
- Page refresh creates a brand new component instance
- Fresh instance → `connectedCallback()` → `onMount()` → data loads successfully

## The Solution

### 1. Override `connectedCallback()` in pm-roadmap.ts

Added logic to detect when a component is reconnected without data:

```typescript
connectedCallback(): void {
  super.connectedCallback();

  // If component was previously unmounted and data was cleared, reload it
  if (!this.roadmapData && this.loadingState === 'idle') {
    console.log('[pm-roadmap] Component reconnected without data, reloading...');
    this.loadRoadmapData();
  }
}
```

**This ensures:**
- Initial mount: loads data via `onMount()`
- Reconnection with data: no action needed
- Reconnection without data: automatically reloads

### 2. Remove Data Clearing from onUnmount()

Changed from:
```typescript
protected onUnmount(): void {
  console.log('[pm-roadmap] Component unmounting');
  // Clear any cached data
  this.roadmapData = null;
  this.searchQuery = '';
  this.activeFilters = {};
  this.filterGroups = [];
}
```

To:
```typescript
protected onUnmount(): void {
  console.log('[pm-roadmap] Component unmounting');
  // Don't clear data on unmount - Lit may reuse this instance
  // Data will be reloaded on reconnect if needed
}
```

**Rationale:**
- Lit reuses instances, so clearing data was premature
- Better to keep data cached for instant display on reconnect
- If fresh data is needed, it can be requested explicitly

### 3. Remove Meaningless Key Attributes in pm-app.ts

Changed from:
```typescript
${this.currentRoute === 'roadmap'
  ? html`<pm-roadmap key="roadmap-${Date.now()}"></pm-roadmap>`
  : html`<pm-tests-view key="tests-${Date.now()}"></pm-tests-view>`
}
```

To:
```typescript
${this.currentRoute === 'roadmap'
  ? html`<pm-roadmap></pm-roadmap>`
  : html`<pm-tests-view></pm-tests-view>`
}
```

**Why This Change:**
- **Lit doesn't use React-style keys** - they have no effect
- The `Date.now()` keys were a misguided attempt to force recreation
- Removed the hack in favor of proper lifecycle management

### 4. Remove Unnecessary Cache-Busting

Removed the `?t=${timestamp}` query parameter from the fetch:

```typescript
// Before
const response = await fetch(`/data.js?t=${timestamp}`);

// After
const response = await fetch('/data.js');
```

**Why:**
- Cache-busting was addressing the wrong problem
- The issue was component lifecycle, not HTTP caching
- Modern browsers handle module caching correctly

## Files Changed

1. `/dashboard/src/components/pm-roadmap.ts`
   - Added `connectedCallback()` override
   - Removed data clearing from `onUnmount()`
   - Removed cache-busting query parameter

2. `/dashboard/src/components/pm-app.ts`
   - Removed meaningless `key` attributes with `Date.now()`

## Testing

### Manual Test Steps:
1. Open http://localhost:5173
2. Verify roadmap loads successfully
3. Click "Tests" tab → should load tests
4. Click "Roadmap" tab → **should now load successfully** ✅
5. Repeat steps 3-4 multiple times → should work every time
6. Refresh page on roadmap → should still work

### Automated Tests:
Run the test suite:
- Unit tests: `/dashboard/src/components/__tests__/pm-roadmap.test.ts`
- Integration test page: `/dashboard/test-navigation-fix.html`

Open in browser: `http://localhost:5173/test-navigation-fix.html`

## Key Learnings

### Lit vs React Component Lifecycle

| Aspect | React | Lit |
|--------|-------|-----|
| Instance reuse | Creates new instance on remount | Reuses existing instance |
| `key` attribute | Forces new instance | Has no effect |
| Lifecycle hooks | Mount/unmount destroy instance | Disconnect/reconnect preserve instance |
| State clearing | Safe to clear in unmount | Dangerous - instance may reconnect |

### Best Practices for Lit Components

1. **Don't assume component destruction on unmount**
   - Component may be disconnected and reconnected
   - Preserve state or check for it on reconnect

2. **Use `connectedCallback()` for reconnection logic**
   - Check if reinitialization is needed
   - Reload data if state is stale or missing

3. **Don't use React patterns in Lit**
   - No `key` attributes for forcing recreation
   - Different lifecycle model requires different patterns

4. **Cache data when possible**
   - Instant display on reconnect improves UX
   - Only refetch if data is stale or explicitly requested

## Related Documentation

- [Lit Component Lifecycle](https://lit.dev/docs/components/lifecycle/)
- [Lit vs React Differences](https://lit.dev/docs/frameworks/react/)
- [Web Components Lifecycle](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements#using_the_lifecycle_callbacks)

## Status

✅ **Fixed** - Navigation between Roadmap and Tests now works reliably in both directions.
