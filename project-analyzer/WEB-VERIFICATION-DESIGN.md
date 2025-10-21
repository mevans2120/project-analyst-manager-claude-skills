# Project Analyzer: Web Verification

**Status**: Design Specification
**Date**: 2025-10-21
**Purpose**: Add production verification capabilities to the Project Analyzer

---

## Executive Summary

The Analyzer currently checks if features are **implemented in code**. This enhancement adds the ability to verify features are **working in production**.

**Value Proposition**: Shift from "code exists" to "feature works"

---

## Current vs Enhanced

### Current Analyzer
```bash
analyzer scan ~/myapp
# Checks: Files exist, imports detected, tests found
# Output: "Shopping cart implemented (95% confidence)"
# Problem: Code exists, but is it deployed and working?
```

### Enhanced Analyzer
```bash
analyzer scan ~/myapp --verify https://myapp.com
# Checks: Files exist + production URL accessible + feature functional
# Output: "Shopping cart deployed and functional (99% confidence)"
# Benefit: Know it actually works!
```

---

## Use Cases

### 1. Pre-Release Validation
```bash
analyzer features ~/myapp --verify https://staging.myapp.com

# Output:
# ✅ User authentication (99% - login page works)
# ⚠️ Shopping cart (75% - /cart returns 404)
# ❌ Payment processing (50% - Stripe not configured)

# Action: Fix cart and payment before release
```

### 2. Production Health Check
```bash
analyzer scan --verify-production https://myapp.com --features features.csv

# Checks all features from features.csv against production
# Updates implementation_confidence based on what's working
# Generates health report
```

### 3. Deployment Verification
```bash
# After deploying to production
analyzer verify-deployment ~/myapp https://myapp.com --report

# Compares code to production
# Identifies missing/broken features
# Creates deployment verification report
```

### 4. CI/CD Integration
```bash
# In GitHub Actions
- name: Verify deployment
  run: |
    analyzer features . --verify ${{ secrets.PRODUCTION_URL }}
    # Fails if critical features aren't working
```

---

## CLI Design

### New Commands

```bash
# Verify production URLs for features
analyzer scan <path> --verify <url>
  --features <file>         # Use features.csv for feature list
  --critical-only           # Only check P0/P1 features
  --timeout <ms>            # Timeout per check (default: 30000)
  --report <file>           # Output verification report
  --fail-on-broken          # Exit 1 if any features broken

# Dedicated verification command
analyzer verify-production <url> [options]
  --features <file>         # features.csv to verify
  --routes <file>           # JSON file with route mappings
  --screenshot             # Capture screenshots of working features
  --update-confidence      # Update features.csv with new scores

# Deployment verification
analyzer verify-deployment <path> <url> [options]
  --compare-with <file>    # Previous deployment snapshot
  --report <file>          # Deployment report
```

---

## Verification Methodology

### Level 1: URL Accessibility (Fast)
**What**: Check if URLs return 200 OK
**How**: WebFetch
**Speed**: 2-5 seconds per page
**Confidence boost**: +10%

```typescript
async checkAccessibility(url: string): Promise<AccessibilityCheck> {
  const result = await webFetcher.fetch({ url });

  return {
    url,
    accessible: result.statusCode >= 200 && result.statusCode < 400,
    statusCode: result.statusCode,
    confidence: 100
  };
}
```

### Level 2: Functional Verification (Medium)
**What**: Check if features actually work (forms exist, buttons clickable)
**How**: Playwright
**Speed**: 10-20 seconds per feature
**Confidence boost**: +20%

```typescript
async checkFunctionality(feature: Feature, url: string): Promise<FunctionalityCheck> {
  const driver = new PlaywrightDriver();
  await driver.navigate({ url });

  // For form features
  if (feature.category === 'Form') {
    const formExists = await driver.checkElement('form');
    const submitExists = await driver.checkElement('button[type="submit"]');

    return {
      feature: feature.name,
      working: formExists.exists && submitExists.exists && submitExists.enabled,
      confidence: 90,
      evidence: 'Form present and functional'
    };
  }

  // For data features
  if (feature.category === 'DataTable') {
    const tableExists = await driver.checkElement('table, [role="table"]');
    const hasData = await driver.page.$$eval('tr', rows => rows.length > 1);

    return {
      feature: feature.name,
      working: tableExists.exists && hasData,
      confidence: 85,
      evidence: hasData ? 'Table with data' : 'Empty table'
    };
  }

  // Generic check: element exists
  return await this.checkGenericFeature(feature, driver);
}
```

### Level 3: API Verification (Advanced)
**What**: Check if backend APIs respond correctly
**How**: Network monitoring during Playwright navigation
**Speed**: 15-30 seconds per feature
**Confidence boost**: +30%

```typescript
async checkAPI(feature: Feature, url: string): Promise<APICheck> {
  const driver = new PlaywrightDriver();
  const monitor = new NetworkMonitor();

  await driver.navigate({ url });
  monitor.startMonitoring(driver.page);

  // Wait for network activity
  await driver.page.waitForLoadState('networkidle');

  // Find relevant API calls
  const apiCalls = monitor.getAPIEndpoints();
  const relevantCalls = apiCalls.filter(api =>
    api.path.includes(feature.route) ||
    api.path.includes(feature.name.toLowerCase())
  );

  return {
    feature: feature.name,
    working: relevantCalls.length > 0 && relevantCalls.every(c => c.status < 400),
    confidence: 95,
    apiCalls: relevantCalls,
    evidence: `${relevantCalls.length} API calls successful`
  };
}
```

---

## Confidence Scoring Update

### Base Confidence (Current)
```typescript
// From code analysis only
confidence = (
  filesFound * 0.3 +
  importsDetected * 0.2 +
  testsFound * 0.2 +
  codePatterns * 0.3
) * 100
```

### Enhanced Confidence (With Verification)
```typescript
// Code + production verification
let confidence = baseConfidence; // From code analysis

if (urlAccessible) {
  confidence += 10; // URL works
}

if (functionalityVerified) {
  confidence += 20; // Feature functional
}

if (apiVerified) {
  confidence += 30; // Backend working
}

// Cap at 100
confidence = Math.min(100, confidence);

// Reduce if broken in production
if (productionBroken) {
  confidence = Math.max(0, confidence - 40);
}
```

### Examples

**Before verification**:
- Shopping cart: 85% confidence (files exist, tests pass)

**After verification** (working):
- Shopping cart: 99% confidence (code + URL + functional + API)

**After verification** (broken):
- Shopping cart: 45% confidence (code exists but /cart returns 404)

---

## Feature-to-URL Mapping

### Automatic URL Inference

```typescript
class URLInferrer {
  /**
   * Infer URL from feature metadata
   */
  inferURL(feature: Feature, baseUrl: string): string {
    // From feature route
    if (feature.route) {
      return `${baseUrl}${feature.route}`;
    }

    // From feature name
    const slug = feature.name.toLowerCase().replace(/\s+/g, '-');
    return `${baseUrl}/${slug}`;
  }

  /**
   * Infer API endpoint
   */
  inferAPI(feature: Feature): string {
    if (feature.apiEndpoint) {
      return feature.apiEndpoint;
    }

    // Guess from category
    if (feature.category === 'Orders') {
      return '/api/orders';
    }

    return `/api/${feature.name.toLowerCase()}`;
  }
}
```

### Manual Route Mapping (routes.json)

```json
{
  "features": [
    {
      "name": "User authentication",
      "url": "/login",
      "apiEndpoint": "/api/auth/login"
    },
    {
      "name": "Shopping cart",
      "url": "/cart",
      "apiEndpoint": "/api/cart"
    },
    {
      "name": "Order history",
      "url": "/account/orders",
      "apiEndpoint": "/api/orders"
    }
  ]
}
```

Usage:
```bash
analyzer verify --routes routes.json https://myapp.com
```

---

## Output: Verification Report

### Markdown Format

```markdown
# Production Verification Report

**Date**: 2025-10-21 14:30:00
**Production URL**: https://myapp.com
**Features Checked**: 23
**Duration**: 2m 15s

## Summary

- ✅ **Working**: 20 (87%)
- ⚠️ **Degraded**: 2 (9%)
- ❌ **Broken**: 1 (4%)

## Critical Issues (P0/P1)

### ❌ Shopping Cart (P0)
**Status**: Broken
**URL**: https://myapp.com/cart
**Error**: 404 Not Found
**Confidence**: Code: 85% → Production: 45% (-40%)
**Action Required**: Deploy cart feature to production

### ⚠️ Payment Processing (P1)
**Status**: Degraded
**URL**: https://myapp.com/checkout
**Issue**: Stripe API not configured
**Confidence**: Code: 90% → Production: 60% (-30%)
**Action Required**: Configure Stripe API keys

## Working Features (P0/P1)

### ✅ User Authentication (P0)
**Status**: Working
**URL**: https://myapp.com/login
**Verified**: Login form functional, API responding
**Confidence**: Code: 95% → Production: 99% (+4%)

[... more features ...]

## All Features Detail

| Feature | Priority | Status | Code Conf. | Prod. Conf. | Change |
|---------|----------|--------|------------|-------------|--------|
| User auth | P0 | ✅ Working | 95% | 99% | +4% |
| Shopping cart | P0 | ❌ Broken | 85% | 45% | -40% |
| Payment | P1 | ⚠️ Degraded | 90% | 60% | -30% |
| Order history | P1 | ✅ Working | 88% | 98% | +10% |

## Recommendations

1. **Immediate**: Fix shopping cart 404 (blocks checkout flow)
2. **High Priority**: Configure Stripe API for payment processing
3. **Monitor**: Track order history API performance (slow response times)
```

### JSON Format

```json
{
  "timestamp": "2025-10-21T14:30:00Z",
  "productionUrl": "https://myapp.com",
  "summary": {
    "totalChecked": 23,
    "working": 20,
    "degraded": 2,
    "broken": 1,
    "duration": 135000
  },
  "features": [
    {
      "name": "Shopping cart",
      "priority": "P0",
      "status": "broken",
      "url": "https://myapp.com/cart",
      "codeConfidence": 85,
      "productionConfidence": 45,
      "change": -40,
      "checks": {
        "urlAccessible": false,
        "functionalityVerified": false,
        "apiVerified": false
      },
      "error": "404 Not Found"
    }
  ]
}
```

---

## Integration with Existing Analyzer

### Enhanced Feature Detection

```typescript
// In featureDetector.ts

export interface FeatureDetectionOptions {
  rootPath: string;
  planningPaths?: string[];
  minConfidence?: number;

  // NEW: Verification options
  verifyProduction?: boolean;
  productionUrl?: string;
  routeMapping?: string; // Path to routes.json
  screenshots?: boolean;
}

export async function detectFeatureImplementation(
  feature: Feature,
  planDocument: PlanningDocument,
  rootPath: string,
  options?: FeatureDetectionOptions
): Promise<FeatureDetection> {
  // Existing code analysis
  const evidence = await analyzeCode(feature, rootPath);
  let confidence = calculateCodeConfidence(evidence);

  // NEW: Production verification
  if (options?.verifyProduction && options?.productionUrl) {
    const verification = await verifyInProduction(
      feature,
      options.productionUrl,
      options.routeMapping
    );

    // Update confidence based on production status
    confidence = updateConfidenceWithVerification(confidence, verification);

    // Add verification evidence
    evidence.productionCheck = verification;
  }

  return {
    feature,
    planDocument: planDocument.path,
    status: determineStatus(confidence),
    confidence,
    evidence
  };
}
```

---

## Error Handling

### Graceful Degradation

```typescript
async function verifyFeature(feature: Feature, url: string): Promise<VerificationResult> {
  try {
    // Try Level 3 (API verification)
    return await checkAPI(feature, url);
  } catch (error) {
    console.warn(`API check failed for ${feature.name}, falling back to functionality check`);

    try {
      // Try Level 2 (Functionality)
      return await checkFunctionality(feature, url);
    } catch (error) {
      console.warn(`Functionality check failed, falling back to accessibility check`);

      try {
        // Try Level 1 (Accessibility)
        return await checkAccessibility(url);
      } catch (error) {
        // All checks failed
        return {
          feature: feature.name,
          working: false,
          confidence: 0,
          error: error.message
        };
      }
    }
  }
}
```

### Timeout Handling

```typescript
async function verifyWithTimeout<T>(
  fn: () => Promise<T>,
  timeout: number = 30000
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Verification timeout')), timeout)
    )
  ]);
}
```

---

## Performance Optimization

### Parallel Verification

```typescript
async function verifyFeatures(features: Feature[], url: string): Promise<VerificationResult[]> {
  // Verify 5 features at a time
  const batches = chunkArray(features, 5);
  const results: VerificationResult[] = [];

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(feature => verifyFeature(feature, url))
    );
    results.push(...batchResults);
  }

  return results;
}
```

### Caching

```typescript
class VerificationCache {
  private cache = new Map<string, { result: VerificationResult; timestamp: number }>();
  private ttl = 3600000; // 1 hour

  get(key: string): VerificationResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  set(key: string, result: VerificationResult): void {
    this.cache.set(key, { result, timestamp: Date.now() });
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
describe('ProductionVerifier', () => {
  it('should verify accessible URL', async () => {
    const result = await verifier.checkAccessibility('https://example.com');
    expect(result.accessible).toBe(true);
  });

  it('should detect broken feature', async () => {
    const result = await verifier.checkAccessibility('https://example.com/404');
    expect(result.accessible).toBe(false);
  });

  it('should increase confidence for working feature', () => {
    const baseConfidence = 85;
    const verification = { working: true, level: 'api' };
    const updated = updateConfidence(baseConfidence, verification);
    expect(updated).toBeGreaterThan(baseConfidence);
  });
});
```

### Integration Tests
```typescript
describe('Production Verification E2E', () => {
  it('should verify features from features.csv', async () => {
    const report = await analyzer.verifyProduction(
      'https://example.com',
      'fixtures/features.csv'
    );

    expect(report.summary.totalChecked).toBeGreaterThan(0);
    expect(report.features).toHaveLength(report.summary.totalChecked);
  });
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Production Verification

on:
  deployment_status:
    types: [success]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install

      - name: Verify production deployment
        run: |
          npx analyzer verify-production ${{ secrets.PRODUCTION_URL }} \
            --features features.csv \
            --report verification-report.md \
            --fail-on-broken

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: verification-report
          path: verification-report.md

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('verification-report.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: report
            });
```

---

## Roadmap

### Phase 1: Basic Verification (1-2 weeks)
- Import shared web viewer library
- Implement Level 1 (URL accessibility)
- CLI: `--verify <url>`
- Basic verification report

### Phase 2: Functional Checks (1-2 weeks)
- Implement Level 2 (functionality verification)
- Form/table/element checks
- Enhanced confidence scoring

### Phase 3: API Verification (1 week)
- Implement Level 3 (API checks)
- Network monitoring
- Complete verification report

---

## Success Metrics

- ✅ Verify 20+ features in <2 minutes
- ✅ 85%+ accuracy in detecting broken features
- ✅ <5% false positives (working features flagged as broken)
- ✅ Catch deployment issues before users report them

---

## Conclusion

Web verification transforms the Analyzer from "code checker" to "production validator":
- **Before**: "Code exists" (85% confidence)
- **After**: "Code exists AND works in production" (99% confidence)

This provides:
- ✅ Deployment confidence
- ✅ Early issue detection
- ✅ Production health monitoring
- ✅ Continuous verification in CI/CD
