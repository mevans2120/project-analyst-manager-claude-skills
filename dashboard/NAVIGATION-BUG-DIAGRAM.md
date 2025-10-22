# Navigation Bug - Visual Explanation

## Before the Fix (BROKEN)

```
┌─────────────────────────────────────────────────────────────────┐
│ Initial State: Load Roadmap                                      │
└─────────────────────────────────────────────────────────────────┘

1. User visits app
   └─> pm-roadmap instance #1234 created
       └─> connectedCallback() fires
           └─> onMount() fires
               └─> loadRoadmapData()
                   └─> roadmapData = {...}  ✓ SUCCESS

┌─────────────────────────────────────────────────────────────────┐
│ Navigate to Tests Tab                                            │
└─────────────────────────────────────────────────────────────────┘

2. User clicks "Tests"
   └─> pm-roadmap instance #1234 removed from DOM
       └─> disconnectedCallback() fires
           └─> onUnmount() fires
               └─> roadmapData = null     [Data cleared!]
               └─> searchQuery = ''
               └─> activeFilters = {}

   └─> pm-tests-view displayed

┌─────────────────────────────────────────────────────────────────┐
│ Navigate back to Roadmap - THE BUG!                             │
└─────────────────────────────────────────────────────────────────┘

3. User clicks "Roadmap"
   └─> Lit REUSES instance #1234 (same object!)
       └─> connectedCallback() fires again
           └─> onMount() does NOT fire (already called once)

   └─> Component is in DOM with:
       • roadmapData = null   [Cleared in step 2!]
       • loadingState = 'idle'
       • No fetch triggered

   └─> render() runs:
       • Checks this.roadmapData === null
       • Shows: "No data available"

   ✗ BROKEN - No data loaded!

┌─────────────────────────────────────────────────────────────────┐
│ But Refresh Works! Why?                                          │
└─────────────────────────────────────────────────────────────────┘

4. User refreshes page
   └─> NEW instance #5678 created
       └─> connectedCallback() fires
           └─> onMount() fires (first time for this instance!)
               └─> loadRoadmapData()
                   └─> roadmapData = {...}  ✓ SUCCESS
```

## After the Fix (WORKING)

```
┌─────────────────────────────────────────────────────────────────┐
│ Initial State: Load Roadmap                                      │
└─────────────────────────────────────────────────────────────────┘

1. User visits app
   └─> pm-roadmap instance #1234 created
       └─> connectedCallback() fires
           └─> Check: roadmapData === null && loadingState === 'idle'
               └─> FALSE (onMount will handle it)
           └─> onMount() fires
               └─> loadRoadmapData()
                   └─> roadmapData = {...}  ✓ SUCCESS

┌─────────────────────────────────────────────────────────────────┐
│ Navigate to Tests Tab                                            │
└─────────────────────────────────────────────────────────────────┘

2. User clicks "Tests"
   └─> pm-roadmap instance #1234 removed from DOM
       └─> disconnectedCallback() fires
           └─> onUnmount() fires
               └─> [Does nothing - keeps data in memory!]
               • roadmapData = {...}  [Still has data]

   └─> pm-tests-view displayed

┌─────────────────────────────────────────────────────────────────┐
│ Navigate back to Roadmap - FIXED!                               │
└─────────────────────────────────────────────────────────────────┘

3a. Scenario A: Data still exists (most cases)
    └─> Lit REUSES instance #1234
        └─> connectedCallback() fires
            └─> Check: roadmapData === null && loadingState === 'idle'
                └─> FALSE (data exists from step 1!)
                └─> No reload needed

        └─> render() runs:
            • roadmapData = {...}  [Still has data!]
            • Displays roadmap immediately

        ✓ SUCCESS - Instant display!

3b. Scenario B: Data was cleared (edge case)
    └─> Lit REUSES instance #1234
        └─> connectedCallback() fires
            └─> Check: roadmapData === null && loadingState === 'idle'
                └─> TRUE! (data is missing)
                └─> loadRoadmapData() triggered
                    └─> roadmapData = {...}  ✓ RELOADED

        └─> render() runs:
            • Shows loading state
            • Then shows roadmap

        ✓ SUCCESS - Data reloaded!
```

## Key Differences

| Aspect | Before Fix | After Fix |
|--------|-----------|-----------|
| Data on unmount | Cleared aggressively | Preserved in memory |
| Reconnection detection | None | Checks in `connectedCallback()` |
| Data reload trigger | Only in `onMount()` (once) | In `connectedCallback()` if needed |
| Navigation UX | Broken (shows error) | Works (instant or reload) |
| Performance | N/A (broken) | Better (caches data) |

## The Core Insight

**Lit's lifecycle is fundamentally different from React:**

```
React:
  Mount → Use → Unmount → DESTROYED → New Mount (new instance)

Lit:
  Mount → Use → Disconnect → KEPT IN MEMORY → Reconnect (same instance)
                     ↑                              ↑
                     └──────── Can happen ──────────┘
                              multiple times!
```

**React patterns don't work in Lit:**
- ❌ Clear state in unmount (component might reconnect!)
- ❌ Use `key` to force recreation (Lit ignores keys!)
- ❌ Assume one-time initialization (components can reconnect!)

**Lit patterns:**
- ✓ Check state on `connectedCallback()` every time
- ✓ Preserve data across disconnections (better UX)
- ✓ Reload data only when actually needed
- ✓ Understand instance reuse is the default behavior
