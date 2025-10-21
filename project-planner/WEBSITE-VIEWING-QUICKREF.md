# Website Viewing - Quick Reference

**TL;DR:** Add 3-tier website analysis to Project Planner for discovering features from live apps.

---

## Recommended Approach

**Tier 1 (Simple):** WebFetch + AI analysis
- Fast, no install, 50-60% accuracy
- Use for: Marketing sites, docs, static sites

**Tier 2 (Advanced):** Playwright headless browser  
- Executes JavaScript, 70-80% accuracy
- Use for: React/Vue/Angular SPAs

**Tier 3 (Visual):** Screenshot + Claude Vision
- UI analysis, 60-80% accuracy  
- Use for: Competitor analysis, design systems

---

## Quick Comparison

| Tool | Speed | Accuracy | Installation | Best For |
|------|-------|----------|--------------|----------|
| WebFetch | ⚡ Fast (2s) | 50-60% | ✅ None | Static sites |
| Playwright | 🐢 Medium (4-5s) | 70-80% | npm install | SPAs |
| Claude Vision | 🐢 Medium (3-5s) | 60-80% | ✅ None | Visual UI |

---

## CLI Design

```bash
# Simple (WebFetch)
planner discover-web https://example.com

# Advanced (Playwright for SPAs)
planner discover-web https://app.example.com --dynamic

# Visual analysis
planner discover-web https://competitor.com --screenshot

# Merge with code analysis
planner discover ~/code
planner discover-web https://myapp.com --merge
```

---

## Feature Detection Signals

### From HTML (WebFetch)
- ✅ Navigation menus (`<nav>`, links)
- ✅ Forms (login, signup, contact)
- ✅ Buttons and CTAs
- ✅ Page titles and headings
- ✅ Meta descriptions
- ❌ JavaScript-rendered content

### From Browser (Playwright)
- ✅ Everything WebFetch can see
- ✅ JavaScript-rendered content
- ✅ Dynamic navigation
- ✅ Interactive elements
- ✅ AJAX-loaded content
- ✅ Can click, scroll, navigate

### From Screenshots (Vision)
- ✅ Visual layout
- ✅ UI components (charts, calendars)
- ✅ Design patterns
- ✅ Color schemes, themes
- ❌ Non-visual features

---

## Implementation Phases

**Phase 1 (1-2 weeks):** WebFetch-only
- Quick win, proves concept
- 40% of use cases covered

**Phase 2 (2 weeks):** Add Playwright
- 90% of use cases covered
- Production-ready

**Phase 3 (2 weeks):** Add Vision (optional)
- Differentiator for competitor analysis
- Nice-to-have

**Total:** 5-6 weeks for complete solution

---

## Accuracy Expectations

| Source | Accuracy | Confidence |
|--------|----------|-----------|
| Code analysis | 85-90% | High |
| Web (static) | 50-60% | Medium |
| Web (Playwright) | 70-80% | Medium-High |
| Web (Vision) | 60-80% | Medium |
| **Code + Web** | **90%+** | **Very High** |

---

## Limitations

1. **Authentication:** Cannot access features behind login
   - Mitigation: Manual cookies, screenshots

2. **Anti-bot detection:** Some sites block automation
   - Mitigation: Stealth plugins, fallback to WebFetch

3. **Cost:** Screenshots cost tokens (~$0.004 each)
   - Mitigation: User confirmation, optional feature

4. **Speed:** Playwright slower than code analysis
   - Mitigation: Use WebFetch by default

5. **Third-party widgets:** May detect chat/analytics as features
   - Mitigation: Filtering, user review mode

---

## Example Output

**Input:**
```bash
planner discover-web https://app.todoist.com --dynamic
```

**Output:**
```
Scanning https://app.todoist.com (dynamic mode)...
🚀 Launching headless browser...
✅ Page loaded (4.2s)
📊 Detected 7 features with 78% average confidence

Features discovered:
  85% - Task management
  80% - Project organization  
  75% - Team collaboration
  70% - Productivity statistics
  65% - Integrations
  80% - Mobile apps
  90% - Dark mode theme

💾 Saved to .project-planner/web-features.csv
```

---

## Integration with Existing Features

**Merge workflow:**
```bash
# 1. Analyze codebase
planner discover ~/my-app
# Output: 18 features from code

# 2. Analyze live site  
planner discover-web https://my-app.com --merge
# Output: 8 web features

# 3. Compare
✅ User auth - CONFIRMED (code + web)
✅ Dashboard - CONFIRMED (code + web)  
⚠️  Admin panel - CODE ONLY (behind auth)
🆕 Live chat - WEB ONLY (third-party?)

# Result: 24 total features (2 confirmed by both)
```

---

## When to Use Each Method

**Use Code Analysis when:**
- You have access to source code
- Need high accuracy (85%+)
- Want implementation details (files, lines)
- Analyzing private/authenticated features

**Use Web Analysis when:**
- Analyzing competitor sites
- No code access
- Validating public-facing features
- Discovering third-party integrations
- Quick reconnaissance

**Use BOTH when:**
- Building complete feature inventory
- Validating implementation vs marketing
- Gap analysis (planned vs live)
- Maximum coverage needed

---

## Dependencies

**Phase 1 (WebFetch):**
- None (built into Claude Code)

**Phase 2 (Playwright):**
```bash
npm install playwright
npx playwright install chromium
```
Optional:
```bash
npm install playwright-extra playwright-extra-plugin-stealth
```

**Phase 3 (Vision):**
- Claude Vision API (via Claude Code Read tool)
- Optional: `sharp` or `jimp` for image processing

---

## Key Design Decisions

1. **Hybrid over single solution** - Use best tool for each scenario
2. **WebFetch by default** - Fast path for simple sites
3. **Auto-detect SPAs** - Suggest --dynamic when needed
4. **Confidence scores** - Always show % to set expectations
5. **Review mode** - Interactive confirmation like code discovery
6. **Merge capability** - Combine code + web for best results

---

## Success Metrics

**Phase 1 Success:**
- ✅ 50-60% accuracy on static sites
- ✅ <3 seconds per page
- ✅ Works without installation

**Phase 2 Success:**
- ✅ 70-80% accuracy on SPAs
- ✅ Anti-bot evasion working
- ✅ <5 seconds per page

**Phase 3 Success:**
- ✅ 60-80% accuracy on visual features
- ✅ <$1 per full site scan
- ✅ User finds value in visual analysis

---

## Risk Assessment

| Risk | Severity | Mitigation | Residual |
|------|----------|------------|----------|
| Low accuracy | Medium | Confidence scores, review mode | Low |
| Auth walls | High | Manual cookies, screenshots | Medium |
| Anti-bot | Medium | Stealth plugins, fallback | Low |
| Cost | Low | User confirmation, caching | Very Low |
| Performance | Low | Tiered approach, caching | Very Low |

---

## Recommended Next Steps

1. ✅ **Approve Phase 1** (WebFetch implementation)
2. 🔨 **Build prototype** (3-5 test sites)
3. 🧪 **User testing** (validate accuracy)
4. 📊 **Measure success** (vs metrics above)
5. ✅ **Approve Phase 2** (if Phase 1 successful)

---

**Bottom Line:** Viable, valuable feature. Start with Phase 1 (2 weeks), validate, then expand to Phase 2.
