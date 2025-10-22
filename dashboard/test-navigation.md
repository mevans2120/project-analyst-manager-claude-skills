# Navigation Bug Fix Test Plan

## Test Case: Roadmap Navigation After Tests View

### Steps to Reproduce:
1. Open http://localhost:5173 (should default to Roadmap view)
2. Verify roadmap loads successfully
3. Click "Tests" tab in navigation
4. Verify tests view loads successfully  
5. Click "Roadmap" tab in navigation
6. **Expected**: Roadmap should load successfully
7. **Previous Behavior**: Shows "Failed to load roadmap data" error

### What Was Fixed:

**Root Cause**: Lit reuses component instances when they're disconnected/reconnected to the DOM. The roadmap component was clearing its data in `onUnmount()`, but when navigating back, Lit reused the same instance without calling `onMount()` again.

**Solution**: Override `connectedCallback()` to check if the component was reconnected without data, and reload if needed.

### Code Changes:
1. `/dashboard/src/components/pm-roadmap.ts`:
   - Added `connectedCallback()` override to detect reconnection without data
   - Removed data clearing from `onUnmount()` 
   - Removed unnecessary cache-busting query parameters

2. `/dashboard/src/components/pm-app.ts`:
   - Removed meaningless `key` attributes with `Date.now()` (Lit doesn't use keys like React)

### Manual Test Checklist:
- [ ] Initial load shows roadmap
- [ ] Navigate to Tests view
- [ ] Navigate back to Roadmap (should work now!)
- [ ] Repeat Tests → Roadmap navigation multiple times
- [ ] Refresh page on Roadmap (should still work)
- [ ] Check browser console for proper lifecycle logs
