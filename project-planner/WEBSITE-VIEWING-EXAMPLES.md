# Website Viewing - Implementation Examples

**Purpose:** Concrete code examples showing how website viewing would work in practice.

---

## Example 1: WebFetch-Based Discovery (Tier 1)

### Input Command
```bash
planner discover-web https://stripe.com
```

### Implementation (Simplified)

```typescript
// src/discovery/web-discovery.ts

import { WebFetch } from 'claude-code-tools';

export class WebDiscoveryEngine {
  async discoverFromURL(url: string): Promise<Feature[]> {
    // 1. Fetch HTML with AI analysis
    const prompt = `
      Analyze this website's HTML and extract all features you can identify.
      
      Look for:
      - Navigation menu items (what pages/sections exist?)
      - Forms (login, signup, contact, etc.)
      - Prominent buttons and CTAs
      - Page titles, headings (h1, h2)
      - Meta descriptions
      - Links with meaningful URLs
      
      For each feature found, provide:
      - name: Short feature name (3-8 words)
      - description: 1-2 sentence description
      - category: Best guess category (Authentication, Payments, etc.)
      - evidence: List of signals (nav-link, form, button, etc.)
      - confidence: 0-100 (how confident are you this feature exists?)
      
      Return valid JSON array format.
      
      Example output:
      [
        {
          "name": "Payment processing",
          "description": "Accept credit card payments with Stripe's payment APIs.",
          "category": "Payments",
          "evidence": ["nav-link:/payments", "heading:Accept payments", "meta-description"],
          "confidence": 85
        }
      ]
    `;
    
    const response = await WebFetch(url, prompt);
    
    // 2. Parse AI response
    const features = this.parseAIResponse(response);
    
    // 3. Check if SPA (might need Playwright)
    const isSPA = this.detectSPA(response);
    if (isSPA) {
      console.warn('⚠️  Detected React/Vue/Angular app - recommend re-running with --dynamic flag');
    }
    
    // 4. Convert to Feature records
    return this.convertToFeatures(features, url);
  }
  
  private parseAIResponse(response: string): RawFeature[] {
    // Extract JSON from AI response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }
    
    return JSON.parse(jsonMatch[0]);
  }
  
  private detectSPA(htmlContent: string): boolean {
    const spaIndicators = [
      /<div id="root"><\/div>/,
      /<div id="app"><\/div>/,
      /react/i,
      /vue\.js/i,
      /angular/i,
    ];
    
    return spaIndicators.some(pattern => pattern.test(htmlContent));
  }
  
  private convertToFeatures(
    rawFeatures: RawFeature[], 
    url: string
  ): Feature[] {
    return rawFeatures.map((raw, index) => ({
      id: `feat-web-${Date.now()}-${index}`,
      name: raw.name,
      description: raw.description,
      status: 'implemented' as FeatureStatus, // Assume live = implemented
      priority: this.estimatePriority(raw.evidence),
      category: raw.category || 'Uncategorized',
      timeline: '',
      owner: '',
      parent_id: '',
      implementation_files: '',
      implementation_confidence: raw.confidence,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      detected_by: 'web-discovery' as DetectedBy,
      notes: `Discovered from ${url}`,
      discovery_source: 'web',
      web_url: url,
      web_evidence: raw.evidence.join(';'),
    }));
  }
  
  private estimatePriority(evidence: string[]): Priority {
    // Features in main nav = high priority
    if (evidence.some(e => e.includes('nav-link'))) return 'P1';
    
    // Forms = medium-high priority  
    if (evidence.some(e => e.includes('form'))) return 'P1';
    
    // Multiple signals = medium priority
    if (evidence.length >= 3) return 'P2';
    
    // Default = low priority
    return 'P3';
  }
}
```

### Expected Output

**Terminal:**
```
Scanning https://stripe.com...
✅ Fetched HTML (2.3s)
🔍 Analyzing page structure...
📊 Detected 12 features with 73% average confidence

Features discovered:
  90% - Payment processing (nav-link, headings, meta)
  85% - Billing management (nav-link, headings)
  80% - Customer portal (nav-link, content)
  75% - Subscription management (nav-link, headings)
  85% - Payment methods (nav-link, content)
  70% - Fraud prevention (nav-link, content)
  80% - Developer APIs (nav-link, headings)
  75% - Dashboard analytics (nav-link)
  65% - Webhooks (nav-link)
  70% - Mobile SDKs (nav-link)
  80% - Invoicing (nav-link, headings)
  60% - Tax calculation (content)

💾 Saved to .project-planner/web-features.csv
```

**CSV Output (excerpt):**
```csv
id,name,description,status,priority,category,implementation_confidence,detected_by,discovery_source,web_url,web_evidence
feat-web-001,Payment processing,"Accept credit card and digital wallet payments through Stripe's payment APIs with built-in fraud detection.",implemented,P1,Payments,90,web-discovery,web,https://stripe.com,nav-link:/payments;heading;meta-description
feat-web-002,Billing management,"Manage recurring billing, subscriptions, and invoices with automated payment collection.",implemented,P1,Billing,85,web-discovery,web,https://stripe.com,nav-link:/billing;heading
```

---

## Example 2: Playwright-Based Discovery (Tier 2)

### Input Command
```bash
planner discover-web https://app.asana.com --dynamic
```

### Implementation (Simplified)

```typescript
// src/discovery/playwright-discovery.ts

import { chromium, Browser, Page } from 'playwright';

export class PlaywrightDiscovery {
  async discoverWithBrowser(
    url: string, 
    options: { screenshot?: boolean; deep?: boolean } = {}
  ): Promise<Feature[]> {
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    });
    
    try {
      // 1. Navigate and wait for JavaScript to execute
      console.log('🚀 Launching headless browser...');
      await page.goto(url, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      console.log('✅ Page loaded');
      
      // 2. Extract navigation structure
      console.log('🔍 Extracting navigation...');
      const navLinks = await this.extractNavigation(page);
      
      // 3. Extract forms
      console.log('🔍 Extracting forms...');
      const forms = await this.extractForms(page);
      
      // 4. Extract buttons and CTAs
      console.log('🔍 Extracting buttons...');
      const buttons = await this.extractButtons(page);
      
      // 5. Extract page structure
      const structure = await this.extractPageStructure(page);
      
      // 6. Optional: Screenshot
      let screenshotPath = null;
      if (options.screenshot) {
        console.log('📸 Capturing screenshot...');
        screenshotPath = `.project-planner/screenshots/${this.sanitizeURL(url)}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
      }
      
      // 7. Optional: Deep crawl
      let subPageSignals = [];
      if (options.deep) {
        console.log('🕷️  Crawling sub-pages...');
        subPageSignals = await this.crawlSubPages(page, navLinks.slice(0, 5));
      }
      
      await browser.close();
      
      // 8. Combine all signals
      const allSignals = [
        ...navLinks.map(l => ({ type: 'nav-link' as const, ...l })),
        ...forms.map(f => ({ type: 'form' as const, ...f })),
        ...buttons.map(b => ({ type: 'button' as const, ...b })),
        ...subPageSignals,
      ];
      
      // 9. Cluster into features
      console.log('📊 Clustering signals...');
      const features = await this.clusterSignals(allSignals, url);
      
      return features;
      
    } catch (error) {
      await browser.close();
      throw new Error(`Playwright discovery failed: ${error.message}`);
    }
  }
  
  private async extractNavigation(page: Page) {
    return await page.$$eval(
      'nav a, [role="navigation"] a, header a',
      links => links
        .map(a => ({
          text: a.textContent?.trim() || '',
          href: a.getAttribute('href') || '',
          visible: (a as HTMLElement).offsetParent !== null,
        }))
        .filter(l => l.text && l.visible)
    );
  }
  
  private async extractForms(page: Page) {
    return await page.$$eval('form', forms =>
      forms.map(form => {
        const inputs = Array.from(form.querySelectorAll('input, textarea, select'));
        return {
          id: form.id || form.getAttribute('name') || '',
          action: form.action,
          method: form.method,
          inputs: inputs.map(input => ({
            name: input.getAttribute('name') || '',
            type: input.getAttribute('type') || input.tagName.toLowerCase(),
            placeholder: input.getAttribute('placeholder') || '',
          })),
        };
      })
    );
  }
  
  private async extractButtons(page: Page) {
    return await page.$$eval(
      'button, [role="button"], a.btn, a.button, input[type="submit"]',
      buttons => buttons
        .map(btn => ({
          text: btn.textContent?.trim() || btn.getAttribute('value') || '',
          class: btn.className,
          visible: (btn as HTMLElement).offsetParent !== null,
        }))
        .filter(b => b.text && b.visible && b.text.length < 50)
    );
  }
  
  private async extractPageStructure(page: Page) {
    return {
      title: await page.title(),
      h1: await page.$$eval('h1', h => h.map(el => el.textContent?.trim())),
      h2: await page.$$eval('h2', h => h.map(el => el.textContent?.trim())),
      metaDescription: await page.$eval(
        'meta[name="description"]',
        el => el.getAttribute('content')
      ).catch(() => ''),
    };
  }
  
  private async clusterSignals(signals: any[], url: string): Promise<Feature[]> {
    // Group related signals into logical features
    const clusters = new Map<string, any[]>();
    
    for (const signal of signals) {
      // Simple keyword-based clustering
      const key = this.extractFeatureKey(signal.text || signal.name || '');
      
      if (!clusters.has(key)) {
        clusters.set(key, []);
      }
      clusters.get(key)!.push(signal);
    }
    
    // Convert clusters to features
    const features: Feature[] = [];
    let index = 0;
    
    for (const [featureName, clusterSignals] of clusters) {
      if (!featureName || clusterSignals.length === 0) continue;
      
      const confidence = this.calculateClusterConfidence(clusterSignals);
      const category = this.inferCategory(featureName, clusterSignals);
      
      features.push({
        id: `feat-web-${Date.now()}-${index++}`,
        name: featureName,
        description: this.generateDescription(featureName, clusterSignals),
        status: 'implemented',
        priority: this.estimatePriority(clusterSignals),
        category,
        timeline: '',
        owner: '',
        parent_id: '',
        implementation_files: '',
        implementation_confidence: confidence,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        detected_by: 'web-discovery',
        notes: `Discovered from ${url} (${clusterSignals.length} signals)`,
        discovery_source: 'web',
        web_url: url,
        web_evidence: clusterSignals.map(s => s.type).join(';'),
      });
    }
    
    return features;
  }
  
  private extractFeatureKey(text: string): string {
    // Normalize and extract feature name
    const normalized = text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
    
    // Map common patterns
    if (normalized.includes('dashboard')) return 'Dashboard';
    if (normalized.includes('task') || normalized.includes('project')) return 'Task management';
    if (normalized.includes('team') || normalized.includes('collab')) return 'Team collaboration';
    if (normalized.includes('report') || normalized.includes('analyt')) return 'Analytics';
    if (normalized.includes('setting')) return 'Settings';
    if (normalized.includes('profile')) return 'User profile';
    
    // Default: capitalize first word
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  private calculateClusterConfidence(signals: any[]): number {
    let confidence = 50; // Base confidence
    
    // More signals = higher confidence
    confidence += Math.min(signals.length * 5, 30);
    
    // Nav links boost confidence
    if (signals.some(s => s.type === 'nav-link')) confidence += 15;
    
    // Forms boost confidence
    if (signals.some(s => s.type === 'form')) confidence += 20;
    
    return Math.min(confidence, 95);
  }
  
  private generateDescription(name: string, signals: any[]): string {
    // Simple description generation (could use AI here)
    const formSignal = signals.find(s => s.type === 'form');
    
    if (formSignal) {
      return `Manage ${name.toLowerCase()} with forms for data input and updates.`;
    }
    
    return `Access ${name.toLowerCase()} functionality through the application interface.`;
  }
}
```

### Expected Output

**Terminal:**
```
Scanning https://app.asana.com (dynamic mode)...
🚀 Launching headless browser...
✅ Page loaded (4.8s)
🔍 Extracting navigation (18 items)
🔍 Extracting forms (5 forms)
🔍 Extracting buttons (42 buttons)
📊 Clustering signals...

Features discovered:
  90% - Task management (nav-link, form, buttons)
  85% - Project organization (nav-link, headings)
  80% - Team collaboration (nav-link, form)
  85% - Calendar view (nav-link, content)
  75% - Reporting (nav-link, headings)
  80% - Dashboard (nav-link, page-title)
  70% - Timeline view (nav-link)
  65% - Portfolio management (nav-link)
  90% - User profile (nav-link, form)
  75% - Settings (nav-link, form)
  60% - Integrations (nav-link)
  70% - Mobile app (button, link)

💾 Saved to .project-planner/web-features.csv
```

---

## Example 3: Merge with Code Analysis

### Input Commands
```bash
# Step 1: Analyze codebase
planner discover ~/my-saas-app

# Step 2: Analyze live website and merge
planner discover-web https://my-saas-app.com --merge
```

### Implementation (Simplified)

```typescript
// src/core/feature-merger.ts

export class FeatureMerger {
  async mergeFeatures(
    codeFeatures: Feature[],
    webFeatures: Feature[]
  ): Promise<MergeResult> {
    const confirmed: Feature[] = [];
    const codeOnly: Feature[] = [];
    const webOnly: Feature[] = [];
    const conflicts: FeatureConflict[] = [];
    
    // 1. Build similarity matrix
    const matches = this.findMatches(codeFeatures, webFeatures);
    
    // 2. Process matches
    for (const match of matches) {
      if (match.similarity > 0.8) {
        // High confidence match - merge
        const merged = this.mergeFeature(match.codeFeature, match.webFeature);
        merged.discovery_source = 'both';
        merged.implementation_confidence = Math.min(
          (match.codeFeature.implementation_confidence + 
           match.webFeature.implementation_confidence) / 2 + 20, // Boost for confirmation
          100
        );
        confirmed.push(merged);
      } else if (match.similarity > 0.6) {
        // Possible match - flag as conflict
        conflicts.push({
          codeFeature: match.codeFeature,
          webFeature: match.webFeature,
          similarity: match.similarity,
          reason: 'Similar names but different details',
        });
      }
    }
    
    // 3. Find code-only features
    const matchedCodeIds = new Set(matches.map(m => m.codeFeature.id));
    codeOnly.push(
      ...codeFeatures.filter(f => !matchedCodeIds.has(f.id))
    );
    
    // 4. Find web-only features
    const matchedWebIds = new Set(matches.map(m => m.webFeature.id));
    webOnly.push(
      ...webFeatures.filter(f => !matchedWebIds.has(f.id))
    );
    
    return { confirmed, codeOnly, webOnly, conflicts };
  }
  
  private findMatches(
    codeFeatures: Feature[],
    webFeatures: Feature[]
  ): FeatureMatch[] {
    const matches: FeatureMatch[] = [];
    
    for (const codeFeature of codeFeatures) {
      for (const webFeature of webFeatures) {
        const similarity = this.calculateSimilarity(
          codeFeature.name,
          webFeature.name
        );
        
        if (similarity > 0.6) {
          matches.push({
            codeFeature,
            webFeature,
            similarity,
          });
        }
      }
    }
    
    // Sort by similarity (highest first)
    return matches.sort((a, b) => b.similarity - a.similarity);
  }
  
  private calculateSimilarity(name1: string, name2: string): number {
    // Simple Levenshtein-based similarity
    // (In production, use library like 'fuzzball')
    const lower1 = name1.toLowerCase();
    const lower2 = name2.toLowerCase();
    
    if (lower1 === lower2) return 1.0;
    if (lower1.includes(lower2) || lower2.includes(lower1)) return 0.9;
    
    // Calculate Levenshtein distance
    const distance = this.levenshtein(lower1, lower2);
    const maxLen = Math.max(name1.length, name2.length);
    
    return 1 - (distance / maxLen);
  }
  
  private mergeFeature(code: Feature, web: Feature): Feature {
    return {
      ...code, // Start with code feature
      description: code.description || web.description, // Prefer code description
      implementation_confidence: Math.max(
        code.implementation_confidence,
        web.implementation_confidence
      ),
      notes: `${code.notes} | Web confirmation: ${web.web_url}`,
      web_url: web.web_url,
      web_evidence: web.web_evidence,
    };
  }
}
```

### Expected Output

**Terminal:**
```
Merging web-discovered features with existing registry...

📊 Comparison Results:

✅ CONFIRMED BY BOTH (2 features):
  95% - User authentication
        Code: src/auth/login.ts, src/auth/session.ts
        Web: nav-link, form
        
  90% - Dashboard
        Code: src/pages/Dashboard.tsx
        Web: nav-link, page-title

⚠️  CODE ONLY (4 features):
  Admin panel - Likely behind authentication
  Database migrations - Backend-only feature
  Logging system - Infrastructure feature
  API rate limiting - Not user-facing

🆕 WEB ONLY (3 features):
  Live chat widget - Third-party integration (Intercom)
  Newsletter signup - Marketing feature
  Social media sharing - Third-party buttons

❓ CONFLICTS (1 feature):
  Code: "Payment processing" vs Web: "Billing management"
  Similarity: 72% - Recommend manual review

📊 Final Registry:
  Total features: 24
  Code-discovered: 18
  Web-discovered: 8
  Confirmed by both: 2
  Average confidence: 82%

💾 Updated .project-planner/features.csv
```

---

## Example 4: Screenshot Analysis (Tier 3)

### Input Command
```bash
planner discover-web https://linear.app --screenshot
```

### Implementation (Simplified)

```typescript
// src/discovery/vision-analysis.ts

export class VisionAnalysis {
  async analyzeWithScreenshots(
    url: string,
    screenshotPaths: string[]
  ): Promise<Feature[]> {
    const allFeatures: Feature[] = [];
    
    for (const screenshotPath of screenshotPaths) {
      console.log(`🖼️  Analyzing ${screenshotPath}...`);
      
      // Read screenshot
      const imageBuffer = await fs.readFile(screenshotPath);
      const base64Image = imageBuffer.toString('base64');
      
      // Analyze with Claude Vision
      const prompt = `
        Analyze this website screenshot and identify all UI features visible.
        
        Look for:
        - Navigation menus and sidebar items
        - Buttons and their purposes
        - Forms and input fields
        - Interactive widgets (charts, calendars, tables)
        - Visual sections and their purposes
        - Design patterns (dark mode, themes)
        
        For each feature, provide:
        - name: Feature name
        - description: What it does
        - category: Best guess
        - visual_elements: What UI elements indicate this feature
        - confidence: 0-100
        
        Return JSON array.
      `;
      
      // Call Claude Vision API
      const analysis = await this.callVisionAPI(base64Image, prompt);
      
      // Parse response
      const features = this.parseVisionResponse(analysis, url);
      allFeatures.push(...features);
    }
    
    // De-duplicate features found across multiple screenshots
    return this.deduplicateFeatures(allFeatures);
  }
  
  private async callVisionAPI(
    base64Image: string, 
    prompt: string
  ): Promise<string> {
    // Use Claude Code's Read tool for images if available
    // Or call Claude API directly
    
    // Pseudo-code (actual implementation depends on available tools):
    const response = await ClaudeVisionAPI({
      model: 'claude-sonnet-4-5',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });
    
    return response.content[0].text;
  }
}
```

### Expected Output

**Terminal:**
```
Scanning https://linear.app (screenshot mode)...
🚀 Launching headless browser...
📸 Capturing screenshots...
  ✅ Homepage screenshot
  ✅ Dashboard screenshot (after navigation)
  ✅ Settings screenshot

🖼️  Analyzing screenshots with Claude Vision...
  Analyzing screenshot 1/3... ($0.004)
  Analyzing screenshot 2/3... ($0.004)
  Analyzing screenshot 3/3... ($0.004)

Features discovered from visual analysis:
  90% - Issue tracking (kanban board visible)
  85% - Project roadmaps (timeline view)
  80% - Team inbox (notification panel)
  75% - Search with keyboard shortcuts (prominent search bar)
  85% - Cycle planning (sprint/cycle UI)
  70% - Dark mode theme (theme toggle visible)
  80% - Triage view (inbox filtering)
  65% - Custom views (view customization buttons)
  75% - Integrations (integration badges visible)

💰 Total cost: $0.012 (3 screenshots)
💾 Saved to .project-planner/web-features.csv
💾 Screenshots saved to .project-planner/screenshots/
```

---

## Summary

These examples demonstrate:

1. **WebFetch (Tier 1)** - Fast, simple, no installation
2. **Playwright (Tier 2)** - Handles SPAs, executes JavaScript
3. **Vision (Tier 3)** - Analyzes UI visually
4. **Merging** - Combines code + web for comprehensive coverage

All approaches output to the same `features.csv` format, making them interoperable with existing Project Planner functionality.
