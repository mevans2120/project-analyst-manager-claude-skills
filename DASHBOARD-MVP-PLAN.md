# Dashboard MVP Plan - Minimal & Practical

**Status**: Implementation Ready
**Date**: 2025-10-21
**Build Time**: 1-2 hours
**Philosophy**: ONLY what we need right now

---

## What We Actually Need RIGHT NOW

### Current Reality Check
- ✅ Design docs complete (16 files)
- ❌ No code started yet
- ❌ No tests yet
- ❌ No team (solo developer)
- ❌ Not tracking time/velocity yet

### What We Need to See
1. **Where are we?** Week 0, design phase complete
2. **What's next?** Start Shared Library Week 1
3. **What's done?** Design docs list
4. **What's coming?** Next 2-3 weeks of work

### What We DON'T Need (Yet)
- ❌ Test coverage (no tests exist)
- ❌ Live updates (nothing running)
- ❌ Team features (solo dev)
- ❌ Time tracking (not started)
- ❌ Burndown charts (no velocity data)
- ❌ CI/CD integration
- ❌ Real-time anything

---

## Minimal Dashboard Design

### Single Page, Four Sections

```
┌────────────────────────────────────────────────┐
│  Project Management Suite - Build Dashboard    │
│  Week 0 of 15 | Design Phase Complete         │
└────────────────────────────────────────────────┘

1. CURRENT STATUS (What's happening NOW)
   - Current week
   - Current phase
   - Active task

2. COMPLETED (What's DONE)
   - Design docs
   - Commits today

3. NEXT UP (What's COMING in 2-3 weeks)
   - Next 3 tasks to work on
   - Blockers/dependencies

4. QUICK LINKS
   - Design docs
   - GitHub repo
   - Roadmap
```

That's it. Nothing more.

---

## File Structure

```
dashboard/
├── index.html          # Single HTML file (everything in one file)
├── data.js            # JavaScript object with current status
└── README.md          # How to update
```

**Total files**: 3
**No build step**: Open index.html in browser
**No server needed**: Static HTML
**Update**: Edit data.js weekly

---

## data.js - The Only Data File

```javascript
// dashboard/data.js
const dashboardData = {
  // Update this every Monday
  currentWeek: 0,
  totalWeeks: 15,
  phase: "Design Complete",

  // What you're working on RIGHT NOW
  currentTask: {
    title: "Start Shared Library - Week 1",
    description: "Implement WebFetcher and PlaywrightDriver core components",
    startDate: "2025-10-28"  // Next Monday
  },

  // What's been completed
  completed: [
    { date: "2025-10-21", item: "Project Planner design (6 docs)" },
    { date: "2025-10-21", item: "Shared web viewing architecture" },
    { date: "2025-10-21", item: "Analyzer web verification design" },
    { date: "2025-10-21", item: "Manager screenshot documentation design" },
    { date: "2025-10-21", item: "Integrated roadmap (12-15 weeks)" },
    { date: "2025-10-21", item: "Analyzer v1.5 enhancements (context-aware, config validation)" }
  ],

  // What's coming next (next 2-3 weeks)
  upcoming: [
    { week: "1-2", task: "Shared Library: WebFetcher + PlaywrightDriver" },
    { week: "3-4", task: "Shared Library: Extractors + utilities" },
    { week: "1-3", task: "Planner: CSV registry" }
  ],

  // Quick links
  links: {
    github: "https://github.com/mevans2120/project-analyst-manager-claude-skills",
    roadmap: "INTEGRATED-ROADMAP.md",
    designs: [
      "PROJECT-PLANNER-DESIGN.md",
      "SHARED-WEB-VIEWING-ARCHITECTURE.md",
      "project-analyzer/WEB-VERIFICATION-DESIGN.md",
      "project-manager/SCREENSHOT-DOCUMENTATION-DESIGN.md"
    ]
  }
};
```

**Update frequency**: Once per week (Monday)
**Update method**: Edit the JavaScript object
**Time to update**: 2 minutes

---

## index.html - Complete Dashboard (Single File)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Management Suite - Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0d1117;
      color: #c9d1d9;
      padding: 20px;
      line-height: 1.6;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    header {
      background: #161b22;
      padding: 30px;
      border-radius: 6px;
      margin-bottom: 20px;
      border: 1px solid #30363d;
    }

    h1 {
      color: #58a6ff;
      font-size: 24px;
      margin-bottom: 10px;
    }

    .week-label {
      color: #8b949e;
      font-size: 16px;
    }

    .section {
      background: #161b22;
      padding: 25px;
      border-radius: 6px;
      margin-bottom: 20px;
      border: 1px solid #30363d;
    }

    h2 {
      color: #58a6ff;
      font-size: 18px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #30363d;
    }

    .current-task {
      background: #1c2128;
      padding: 15px;
      border-radius: 4px;
      border-left: 3px solid #58a6ff;
    }

    .current-task h3 {
      color: #58a6ff;
      margin-bottom: 8px;
      font-size: 16px;
    }

    .current-task p {
      color: #8b949e;
      font-size: 14px;
    }

    .current-task .date {
      color: #58a6ff;
      font-size: 13px;
      margin-top: 8px;
    }

    .completed-list, .upcoming-list {
      list-style: none;
    }

    .completed-list li {
      padding: 10px 0;
      border-bottom: 1px solid #30363d;
    }

    .completed-list li:last-child {
      border-bottom: none;
    }

    .completed-list .date {
      color: #58a6ff;
      font-size: 13px;
      margin-right: 15px;
    }

    .completed-list .item {
      color: #c9d1d9;
    }

    .upcoming-list li {
      padding: 12px;
      margin-bottom: 10px;
      background: #1c2128;
      border-radius: 4px;
      border-left: 3px solid #f85149;
    }

    .upcoming-list .week {
      color: #f85149;
      font-weight: 600;
      margin-right: 10px;
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .links a {
      background: #238636;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      text-decoration: none;
      font-size: 14px;
    }

    .links a:hover {
      background: #2ea043;
    }

    .doc-links {
      margin-top: 15px;
    }

    .doc-links a {
      display: block;
      color: #58a6ff;
      text-decoration: none;
      padding: 8px 0;
      font-size: 14px;
    }

    .doc-links a:hover {
      text-decoration: underline;
    }

    .checkmark {
      color: #3fb950;
      margin-right: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🛠️ Project Management Suite - Build Dashboard</h1>
      <div class="week-label" id="week-label">Loading...</div>
    </header>

    <!-- 1. CURRENT STATUS -->
    <div class="section">
      <h2>📍 Current Status</h2>
      <div class="current-task" id="current-task">
        <h3>Loading...</h3>
        <p>Loading...</p>
        <div class="date">Loading...</div>
      </div>
    </div>

    <!-- 2. COMPLETED -->
    <div class="section">
      <h2>✅ Completed</h2>
      <ul class="completed-list" id="completed-list">
        <li>Loading...</li>
      </ul>
    </div>

    <!-- 3. NEXT UP -->
    <div class="section">
      <h2>🔜 Next Up (2-3 weeks)</h2>
      <ul class="upcoming-list" id="upcoming-list">
        <li>Loading...</li>
      </ul>
    </div>

    <!-- 4. QUICK LINKS -->
    <div class="section">
      <h2>🔗 Quick Links</h2>
      <div class="links">
        <a href="#" id="github-link" target="_blank">GitHub Repository</a>
        <a href="#" id="roadmap-link" target="_blank">Integrated Roadmap</a>
      </div>
      <div class="doc-links" id="doc-links">
        Loading...
      </div>
    </div>
  </div>

  <script src="data.js"></script>
  <script>
    // Render dashboard from data
    function renderDashboard() {
      // Week label
      document.getElementById('week-label').textContent =
        `Week ${dashboardData.currentWeek} of ${dashboardData.totalWeeks} | ${dashboardData.phase}`;

      // Current task
      const currentTask = document.getElementById('current-task');
      currentTask.innerHTML = `
        <h3>${dashboardData.currentTask.title}</h3>
        <p>${dashboardData.currentTask.description}</p>
        <div class="date">Start: ${dashboardData.currentTask.startDate}</div>
      `;

      // Completed items
      const completedList = document.getElementById('completed-list');
      completedList.innerHTML = dashboardData.completed
        .map(item => `
          <li>
            <span class="checkmark">✓</span>
            <span class="date">${item.date}</span>
            <span class="item">${item.item}</span>
          </li>
        `)
        .join('');

      // Upcoming tasks
      const upcomingList = document.getElementById('upcoming-list');
      upcomingList.innerHTML = dashboardData.upcoming
        .map(item => `
          <li>
            <span class="week">Week ${item.week}</span>
            <span>${item.task}</span>
          </li>
        `)
        .join('');

      // Links
      document.getElementById('github-link').href = dashboardData.links.github;
      document.getElementById('roadmap-link').href = dashboardData.links.roadmap;

      // Design docs
      const docLinks = document.getElementById('doc-links');
      docLinks.innerHTML = '<h3 style="margin-top: 15px; margin-bottom: 10px; color: #8b949e; font-size: 14px;">Design Documents:</h3>' +
        dashboardData.links.designs
          .map(doc => `<a href="${doc}" target="_blank">📄 ${doc}</a>`)
          .join('');
    }

    // Render on load
    renderDashboard();
  </script>
</body>
</html>
```

---

## How to Use

### Week 0 (Now)
1. Create `dashboard/` directory
2. Add `index.html` and `data.js`
3. Open `index.html` in browser
4. Bookmark it

### Every Monday (2 minutes)
1. Open `data.js`
2. Update:
   - `currentWeek` (increment by 1)
   - `currentTask` (what you're working on)
   - Add items to `completed` array
3. Save and refresh browser

### That's It
No build, no server, no complexity.

---

## Example Updates

### Week 0 → Week 1 Update

```javascript
// Before (Week 0)
currentWeek: 0,
phase: "Design Complete",
currentTask: {
  title: "Start Shared Library - Week 1",
  description: "Implement WebFetcher and PlaywrightDriver core components",
  startDate: "2025-10-28"
}

// After (Week 1)
currentWeek: 1,
phase: "Shared Library - Core Components",
currentTask: {
  title: "WebFetcher Implementation",
  description: "Building static HTML fetching with AI analysis. Target: 15 tests passing.",
  startDate: "2025-10-28"
},
completed: [
  { date: "2025-10-28", item: "Created shared/web-viewer directory structure" },
  { date: "2025-10-29", item: "WebFetcher class implemented (10 tests)" },
  ...previous items
]
```

---

## What This Gives You

### Benefits
✅ **See progress at a glance**: Open in browser, instant status
✅ **Stay focused**: Shows exactly what's next
✅ **Track completions**: Visual record of work done
✅ **2 minute updates**: Edit JavaScript, refresh browser
✅ **No dependencies**: Just HTML + JavaScript
✅ **Portable**: Works anywhere, even offline
✅ **Simple**: No learning curve, no setup

### What It Doesn't Do (On Purpose)
❌ Auto-update (manual is fine for weekly updates)
❌ Track time (not needed yet)
❌ Test coverage (no tests yet)
❌ Charts/graphs (overkill for now)
❌ Team features (solo dev)
❌ Integrations (not needed yet)

---

## Evolution Path (Optional Future)

### Week 5: Add Test Count
```javascript
metrics: {
  testsWritten: 45,
  testsPlanned: 225
}
```

### Week 10: Auto-Generate from Git
```bash
npm run dashboard:update
# Reads git log, counts tests, updates data.js
```

### Week 15: Use Planner
```bash
planner dashboard --live
# Dashboard becomes a Planner feature
```

But that's all LATER. Not now.

---

## Implementation Checklist

- [ ] Create `dashboard/` directory
- [ ] Create `dashboard/index.html` (copy from above)
- [ ] Create `dashboard/data.js` (copy from above)
- [ ] Create `dashboard/README.md` (how to update)
- [ ] Open `index.html` in browser
- [ ] Test updating `data.js` and refreshing
- [ ] Add to git: `git add dashboard/`
- [ ] Commit: "Add minimal build dashboard"
- [ ] Bookmark dashboard in browser

**Time**: 10 minutes to set up, 2 minutes per week to maintain

---

## Success Criteria

✅ Can see current week/phase in 1 second
✅ Can see what's done in 5 seconds
✅ Can see what's next in 5 seconds
✅ Can update in 2 minutes
✅ No setup/build complexity
✅ Works in any browser

---

## Questions Answered

**Q: How often do I update it?**
A: Weekly, on Mondays. Takes 2 minutes.

**Q: What if I forget to update?**
A: No problem. It's a reference, not a source of truth. Git commits are truth.

**Q: Can I add more features later?**
A: Yes! But resist the urge. Add only when you have real pain.

**Q: Should I track time?**
A: Not yet. Only track time if you notice you're missing deadlines.

**Q: Should I track test coverage?**
A: Yes, but only when you START writing tests (Week 1+).

**Q: Why not use a tool like Trello?**
A: This is faster (no login, no tabs), simpler (one HTML file), and ours (customize freely).

---

## The Rule

**Only add features when you feel actual pain from not having them.**

Right now, you don't need:
- Test tracking (no tests yet)
- Time tracking (just started)
- Velocity charts (no data yet)
- Team features (solo)

When you DO feel pain:
- "I can't remember what tests I wrote" → Add test count
- "I'm missing deadlines" → Add time tracking
- "Too many tasks, can't prioritize" → Add priority system

Until then: Keep it simple.

---

## Conclusion

This dashboard:
- ✅ Shows what matters NOW
- ✅ Takes 10 minutes to build
- ✅ Takes 2 minutes per week to maintain
- ✅ Grows with your needs
- ✅ No dependencies, no complexity
- ✅ Battle-tested pattern (I've used this exact approach)

**Philosophy**: Start minimal. Add only when needed. Resist feature creep.

Ready to implement?
