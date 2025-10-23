# Feature Extraction from Designs and Websites

The Project Analyzer now supports extracting feature lists from:
- Design files (Figma exports, Sketch, PSD exports)
- Moodboards
- Wireframes
- Screenshots
- Live websites

All with **CSV export** support for easy feature management.

## Quick Start

### Analyze Design Files

```typescript
import { ProjectAnalyzer } from './project-analyzer';

const analyzer = new ProjectAnalyzer('/path/to/project');

// Analyze design files and export to CSV
await analyzer.analyzeDesignsToCSV(
  {
    designFiles: ['./designs/dashboard.png', './designs/user-profile.png'],
    moodboards: ['./moodboards/visual-style.png'],
    wireframes: ['./wireframes/checkout-flow.png'],
    autoCategorize: true,
    extractColors: true,
    projectContext: 'E-commerce web application'
  },
  './output/features.csv',
  {
    includeHeaders: true,
    groupByCategory: true,
    sortBy: 'priority',
    includeSummary: true
  },
  {
    projectName: 'MyApp',
    platform: 'web',
    domain: 'e-commerce'
  }
);
```

### Analyze Website

```typescript
// Analyze a live website and export features to CSV
await analyzer.analyzeWebsitesToCSV(
  {
    urls: ['https://example.com'],
    crawlDepth: 1,
    captureScreenshots: true,
    analyzeInteractions: true,
    analyzeAPIs: true,
    projectContext: 'Competitor analysis for feature parity'
  },
  './output/website-features.csv',
  {
    fields: ['name', 'description', 'category', 'priority', 'confidence'],
    sortBy: 'category'
  }
);
```

### Combined Analysis

```typescript
// Analyze both designs and websites
const result = await analyzer.analyzeFull(
  {
    // Design options
    designFiles: ['./designs/*.png'],
    autoCategorize: true
  },
  {
    // Website options
    urls: ['https://competitor.com'],
    crawlDepth: 0
  },
  {
    projectName: 'MyApp',
    platform: 'web'
  }
);

// Export to CSV
import { writeFeaturesToFile } from './project-analyzer';
await writeFeaturesToFile(result, './output/all-features.csv', 'csv', {
  groupByCategory: true,
  includeSummary: true
});
```

## CSV Output Format

The CSV export includes:

```csv
# Feature Analysis Summary
# Total Features: 24
# Analysis Date: 2025-10-22T...
# Average Confidence: 82%

# Category: Navigation
Feature Name,Description,Category,Source,Priority,Confidence
Main Menu,Top navigation with Home/Products/About links,Navigation,design-file,high,90
...

# Category: Form
Feature Name,Description,Category,Source,Priority,Confidence
Login Form,Email and password fields with remember me checkbox,Form,website,high,95
...
```

## CSV Options

```typescript
interface FeatureCSVOptions {
  /** Include header row */
  includeHeaders?: boolean;  // default: true

  /** Fields to include */
  fields?: string[];  // default: ['name', 'description', 'category', 'source', 'priority', 'confidence']

  /** Group by category */
  groupByCategory?: boolean;  // default: false

  /** Sort order */
  sortBy?: 'priority' | 'category' | 'confidence' | 'name';  // default: 'category'

  /** Include summary section */
  includeSummary?: boolean;  // default: true
}
```

## Available Fields

- `name` - Feature name
- `description` - Detailed description
- `category` - Category (UI Component, Page, Navigation, Form, etc.)
- `categoryEmoji` - Emoji representation of category
- `source` - Source type (design-file, moodboard, website, etc.)
- `sourceName` - Source filename
- `priority` - Priority (high, medium, low)
- `confidence` - Confidence score (0-100)
- `status` - Status (identified, needs-clarification, duplicate)
- `tags` - Comma-separated tags
- `notes` - Additional notes

## Feature Categories

- 🧩 **UI Component** - Buttons, cards, modals, etc.
- 📄 **Page** - Full page views
- 🧭 **Navigation** - Menus, nav bars, breadcrumbs
- 📝 **Form** - Input forms, search bars
- 📊 **Data Display** - Tables, charts, lists
- ⚡ **Action** - Interactive actions and triggers
- 📰 **Content** - Text content, media
- 📐 **Layout** - Layout structures
- 🔹 **Other** - Miscellaneous features

## Advanced: Direct API Usage

### Design Analyzer

```typescript
import { DesignAnalyzer } from './project-analyzer';

const analyzer = new DesignAnalyzer(
  {
    designFiles: ['./designs/app-ui.png'],
    autoCategorize: true,
    extractColors: true,
    extractTypography: true
  },
  {
    projectName: 'MyApp',
    platform: 'web',
    domain: 'productivity'
  }
);

const result = await analyzer.analyze();
console.log(`Found ${result.summary.totalFeatures} features`);
```

### Website Analyzer

```typescript
import { WebsiteAnalyzer } from './project-analyzer';

const analyzer = new WebsiteAnalyzer(
  {
    urls: ['https://example.com'],
    crawlDepth: 2,
    captureScreenshots: true,
    analyzeInteractions: true,
    auth: {
      type: 'cookies',
      cookiePath: './cookies.json'
    }
  }
);

const result = await analyzer.analyze();
```

## Export Formats

### CSV
```typescript
import { formatFeaturesAsCSV } from './project-analyzer/formatters/featureFormatter';
const csv = formatFeaturesAsCSV(result, { groupByCategory: true });
```

### Markdown
```typescript
import { formatFeaturesAsMarkdown } from './project-analyzer/formatters/featureFormatter';
const markdown = formatFeaturesAsMarkdown(result);
```

### JSON
```typescript
import { formatFeaturesAsJSON } from './project-analyzer/formatters/featureFormatter';
const json = formatFeaturesAsJSON(result, true);  // pretty=true
```

## Example Workflow

1. **Gather Design Assets**
   - Export Figma designs as PNG
   - Collect wireframes and moodboards
   - Gather competitor screenshots

2. **Run Analysis**
   ```bash
   npm run analyze-features
   ```

3. **Review CSV Output**
   - Open `features.csv` in Excel/Google Sheets
   - Sort by priority or category
   - Review confidence scores

4. **Import to Project Management**
   - Import CSV to Jira/Linear/GitHub Projects
   - Use as basis for sprint planning
   - Track implementation progress

## Tips

- **High Confidence (>85%)**: Features clearly visible and well-defined
- **Medium Confidence (70-85%)**: Features visible but may need clarification
- **Low Confidence (<70%)**: Potential features that need verification

- Group related features by category for better organization
- Use the priority field to indicate implementation order
- Review low-confidence features manually
- Combine design and website analysis for comprehensive feature discovery

## Future Enhancements

- [ ] Integration with Claude API for vision analysis
- [ ] Automatic color scheme extraction
- [ ] Typography analysis from designs
- [ ] Component library suggestions
- [ ] Jira/Linear direct integration
- [ ] Feature similarity detection
- [ ] Historical change tracking
