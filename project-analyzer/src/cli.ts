#!/usr/bin/env node

/**
 * Command-line interface for the Project Analyzer
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { scanTodos, processScanResults, loadPreviousState, findNewTodos, saveState } from './core/scanner';
import { formatOutput, writeOutput, generateReportFilename, OutputFormat } from './formatters/outputFormatter';

const program = new Command();

/**
 * Get the default output directory for a project
 */
function getProjectAnalyzerDir(rootPath: string): string {
  return path.join(rootPath, '.project-analyzer');
}

/**
 * Get the default scans directory for a project
 */
function getProjectScansDir(rootPath: string): string {
  return path.join(getProjectAnalyzerDir(rootPath), 'scans');
}

/**
 * Ensure project analyzer directory exists
 */
function ensureProjectDirExists(rootPath: string): void {
  const analyzerDir = getProjectAnalyzerDir(rootPath);
  const scansDir = getProjectScansDir(rootPath);

  if (!fs.existsSync(analyzerDir)) {
    fs.mkdirSync(analyzerDir, { recursive: true });
  }
  if (!fs.existsSync(scansDir)) {
    fs.mkdirSync(scansDir, { recursive: true });
  }
}

/**
 * Generate default output path for a scan
 */
function getDefaultOutputPath(rootPath: string, format: string): string {
  const scansDir = getProjectScansDir(rootPath);
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const extension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
  return path.join(scansDir, `scan-${timestamp}.${extension}`);
}

/**
 * Add date timestamp to a filename if it doesn't already have one
 * Example: "todo-analysis.md" -> "todo-analysis-2025-10-20.md"
 */
function addDateToFilename(filePath: string): string {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);

  // Check if filename already has a date pattern (YYYY-MM-DD)
  const datePattern = /\d{4}-\d{2}-\d{2}/;
  if (datePattern.test(basename)) {
    return filePath; // Already has a date
  }

  const newBasename = `${basename}-${timestamp}${ext}`;
  return path.join(dir, newBasename);
}

program
  .name('project-analyzer')
  .description('Analyze repositories to identify TODOs, specifications, and implementation gaps')
  .version('1.0.0');

// Main scan command
program
  .command('scan [path]')
  .description('Scan a repository for TODO items')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, markdown, github, csv, summary)', 'markdown')
  .option('-g, --group-by <grouping>', 'Group results by (file, priority, type, none)', 'file')
  .option('--include <patterns...>', 'Include file patterns (glob)')
  .option('--exclude <patterns...>', 'Exclude file patterns (glob)')
  .option('--no-gitignore', 'Don\'t use .gitignore')
  .option('--include-completed', 'Include completed tasks')
  .option('--exclude-archives', 'Exclude TODOs from archive directories')
  .option('--compact', 'Compact JSON output')
  .option('--state-file <path>', 'Path to state file for tracking processed TODOs')
  .option('--only-new', 'Only show new TODOs not in state file')
  .action(async (pathArg, options) => {
    const rootPath = path.resolve(pathArg || process.cwd());

    console.log(`🔍 Scanning repository: ${rootPath}`);
    console.log(`📝 Output format: ${options.format}`);

    try {
      // Check if path exists
      if (!fs.existsSync(rootPath)) {
        console.error(`❌ Error: Path does not exist: ${rootPath}`);
        process.exit(1);
      }

      // Ensure project analyzer directory exists
      ensureProjectDirExists(rootPath);

      // Perform scan
      const result = await scanTodos({
        rootPath,
        includePatterns: options.include,
        excludePatterns: options.exclude,
        useGitignore: options.gitignore !== false,
        includeCompleted: options.includeCompleted,
        excludeArchives: options.excludeArchives,
        groupByFile: options.groupBy === 'file'
      });

      // Process results to add IDs and hashes
      const processedResult = processScanResults(result);

      // Handle state file and new TODOs filtering
      const statePath = options.stateFile || path.join(getProjectAnalyzerDir(rootPath), 'state.json');

      if (options.stateFile || options.onlyNew) {
        const previousHashes = loadPreviousState(statePath);

        if (options.onlyNew) {
          const newTodos = findNewTodos(processedResult.todos, previousHashes);
          processedResult.todos = newTodos;
          processedResult.summary.totalTodos = newTodos.length;
          console.log(`🆕 Found ${newTodos.length} new TODO(s)`);
        }
      }

      // Always save state to track processed TODOs
      saveState(statePath, processedResult.todos);

      // Format output
      const formatted = formatOutput(processedResult, {
        format: options.format as OutputFormat,
        groupBy: options.groupBy,
        compact: options.compact
      });

      // Determine output path
      let outputPath = options.output || getDefaultOutputPath(rootPath, options.format);

      // Add date to filename if user provided a custom output path
      if (options.output) {
        outputPath = addDateToFilename(outputPath);
      }

      // Write output
      writeOutput(formatted, outputPath);
      console.log(`✅ Output written to: ${outputPath}`);
      console.log(`💾 State saved to: ${statePath}`);

      // Print summary to console
      console.log('\n📊 Scan Complete:');
      console.log(`   Total TODOs: ${processedResult.summary.totalTodos}`);
      console.log(`   Files scanned: ${processedResult.summary.filesScanned}`);
      console.log(`   Duration: ${processedResult.summary.scanDuration}ms`);

    } catch (error) {
      console.error('❌ Error during scan:', error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats [path]')
  .description('Show repository statistics')
  .action(async (pathArg) => {
    const rootPath = path.resolve(pathArg || process.cwd());

    console.log(`📊 Analyzing repository: ${rootPath}`);

    try {
      const { getRepositoryStats } = await import('./utils/fileTraversal');
      const stats = await getRepositoryStats(rootPath);

      console.log('\n📈 Repository Statistics:');
      console.log(`   Total files: ${stats.totalFiles}`);
      console.log(`   Total lines: ${stats.totalLines.toLocaleString()}`);
      console.log('\n   Files by extension:');

      const sortedExtensions = Object.entries(stats.filesByExtension)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      for (const [ext, count] of sortedExtensions) {
        console.log(`     .${ext}: ${count}`);
      }

      console.log('\n   Largest files:');
      for (const file of stats.largestFiles.slice(0, 5)) {
        const size = (file.size / 1024).toFixed(2);
        console.log(`     ${file.relativePath} (${size} KB)`);
      }

    } catch (error) {
      console.error('❌ Error getting stats:', error);
      process.exit(1);
    }
  });

// Cleanup command - analyze completion status
program
  .command('cleanup [path]')
  .description('Analyze TODOs for completion and generate cleanup report')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, markdown, summary)', 'markdown')
  .option('--min-confidence <number>', 'Minimum confidence level (0-100)', '70')
  .option('--exclude-archives', 'Exclude TODOs from archive directories')
  .option('--use-git', 'Use git history for enhanced detection', false)
  .action(async (pathArg, options) => {
    const rootPath = path.resolve(pathArg || process.cwd());

    console.log(`🧹 Analyzing TODOs for completion: ${rootPath}`);

    try {
      // Import completion modules
      const { analyzeCompletions, getTopCleanupCandidates } = await import('./core/completionDetector');
      const { formatCompletionReportAsMarkdown, formatCompletionSummary, formatCompletionReportAsJSON, formatCleanupCandidates } = await import('./formatters/completionFormatter');

      // Perform scan
      const result = await scanTodos({
        rootPath,
        excludeArchives: options.excludeArchives
      });

      // Analyze completions
      console.log('🔍 Analyzing completion indicators...');
      const completionReport = analyzeCompletions(result.todos, rootPath);

      // Get top cleanup candidates
      const topCandidates = getTopCleanupCandidates(completionReport, 10);

      // Format output
      let formatted: string;
      switch (options.format) {
        case 'json':
          formatted = formatCompletionReportAsJSON(completionReport);
          break;
        case 'summary':
          formatted = formatCompletionSummary(completionReport);
          break;
        default:
          formatted = formatCompletionReportAsMarkdown(completionReport);
          formatted += '\n' + formatCleanupCandidates(topCandidates);
      }

      // Write or print output
      if (options.output) {
        const outputPath = addDateToFilename(options.output);
        writeOutput(formatted, outputPath);
        console.log(`✅ Output written to: ${outputPath}`);
      } else {
        console.log('\n' + formatted);
      }

      // Print summary to console
      const stats = completionReport;
      console.log('\n📊 Cleanup Analysis Complete:');
      console.log(`   Total TODOs analyzed: ${stats.totalTodos}`);
      console.log(`   Likely completed: ${stats.likelyCompleted}`);
      console.log(`   Probably completed: ${stats.probablyCompleted}`);
      console.log(`   Possibly completed: ${stats.possiblyCompleted}`);
      console.log(`   Active tasks: ${stats.activeCount}`);
      console.log(`   Potential cleanup: ${stats.likelyCompleted + stats.probablyCompleted} TODOs`);

    } catch (error) {
      console.error('❌ Error during cleanup analysis:', error);
      process.exit(1);
    }
  });

// Feature analysis command
program
  .command('features [path]')
  .description('Analyze planning documents and detect feature implementation')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, markdown, csv, summary)', 'markdown')
  .option('--min-confidence <number>', 'Minimum confidence level (0-100)', '0')
  .option('--planning-paths <paths...>', 'Directories to search for planning documents', ['docs', 'memory-bank'])
  .option('--include-checked', 'Include features already marked as checked', false)
  .action(async (pathArg, options) => {
    const rootPath = path.resolve(pathArg || process.cwd());

    console.log(`🔍 Analyzing feature implementation: ${rootPath}`);

    try {
      // Import feature detection modules
      const { analyzeImplementation } = await import('./core/featureDetector');
      const {
        formatImplementationReportAsMarkdown,
        formatImplementationReportAsJSON,
        formatImplementationReportAsCSV,
        formatImplementationSummary
      } = await import('./formatters/implementationFormatter');

      // Ensure project analyzer directory exists
      ensureProjectDirExists(rootPath);

      // Perform feature analysis
      const report = await analyzeImplementation({
        rootPath,
        planningPaths: options.planningPaths,
        minConfidence: parseInt(options.minConfidence),
        includeChecked: options.includeChecked
      });

      // Format output
      let formatted: string;
      switch (options.format) {
        case 'json':
          formatted = formatImplementationReportAsJSON(report);
          break;
        case 'csv':
          formatted = formatImplementationReportAsCSV(report);
          break;
        case 'summary':
          formatted = formatImplementationSummary(report);
          break;
        default:
          formatted = formatImplementationReportAsMarkdown(report);
      }

      // Determine output path
      if (options.output) {
        const outputPath = addDateToFilename(options.output);
        writeOutput(formatted, outputPath);
        console.log(`✅ Output written to: ${outputPath}`);
      } else {
        // Print to console if no output file specified
        console.log('\n' + formatted);
      }

      // Print summary to console
      console.log(formatImplementationSummary(report));

    } catch (error) {
      console.error('❌ Error during feature analysis:', error);
      console.error(error);
      process.exit(1);
    }
  });

// Analyze designs command
program
  .command('analyze-designs')
  .description('Extract features from design files, moodboards, wireframes, and screenshots')
  .option('--designs <files...>', 'Design file paths (PNG, JPG, etc.)')
  .option('--moodboards <files...>', 'Moodboard image paths')
  .option('--wireframes <files...>', 'Wireframe image paths')
  .option('--screenshots <files...>', 'Screenshot image paths')
  .option('-o, --output <path>', 'Output CSV file path', 'features.csv')
  .option('-f, --format <format>', 'Output format (csv, json, markdown)', 'csv')
  .option('--include-low-confidence', 'Include features with confidence < 70%', false)
  .option('--project-name <name>', 'Project name for context')
  .option('--platform <platform>', 'Target platform (web, mobile, desktop)', 'web')
  .option('--domain <domain>', 'Industry/domain')
  .action(async (options) => {
    console.log('🎨 Analyzing design files...');

    try {
      const { ProjectAnalyzer } = await import('./index');

      // Validate that at least one source is provided
      if (!options.designs && !options.moodboards && !options.wireframes && !options.screenshots) {
        console.error('❌ Error: At least one source type must be provided (--designs, --moodboards, --wireframes, or --screenshots)');
        process.exit(1);
      }

      // Create analyzer
      const analyzer = new ProjectAnalyzer(process.cwd());

      // Build analysis options
      const analysisOptions = {
        designFiles: options.designs,
        moodboards: options.moodboards,
        wireframes: options.wireframes,
        screenshots: options.screenshots,
        includeLowConfidence: options.includeLowConfidence
      };

      // Build context
      const context = {
        projectName: options.projectName,
        platform: options.platform as any,
        domain: options.domain
      };

      console.log(`📁 Analyzing ${(options.designs?.length || 0) + (options.moodboards?.length || 0) + (options.wireframes?.length || 0) + (options.screenshots?.length || 0)} file(s)...`);

      // Analyze designs
      const result = await analyzer.analyzeDesigns(analysisOptions, context);

      console.log(`✅ Found ${result.features.length} features`);
      console.log(`   Average confidence: ${result.summary.averageConfidence}%`);

      // Export based on format
      const { formatFeaturesAsCSV, formatFeaturesAsJSON, formatFeaturesAsMarkdown, writeFeaturesToFile } = await import('./formatters/featureFormatter');

      let formatted: string;
      switch (options.format) {
        case 'json':
          formatted = formatFeaturesAsJSON(result);
          break;
        case 'markdown':
          formatted = formatFeaturesAsMarkdown(result);
          break;
        default:
          formatted = formatFeaturesAsCSV(result, { includeHeaders: true, sortBy: 'category' });
      }

      // Write output
      const outputPath = path.resolve(options.output);
      await writeFeaturesToFile(result, outputPath, options.format as any);

      console.log(`📄 Output written to: ${outputPath}`);
      console.log('\n📊 Summary by Category:');
      for (const [category, count] of Object.entries(result.summary.byCategory)) {
        console.log(`   ${category}: ${count}`);
      }

    } catch (error) {
      console.error('❌ Error analyzing designs:', error);
      process.exit(1);
    }
  });

// Analyze website command
program
  .command('analyze-website <url>')
  .description('Extract features from a live website')
  .option('-o, --output <path>', 'Output CSV file path', 'features.csv')
  .option('-f, --format <format>', 'Output format (csv, json, markdown)', 'csv')
  .option('--crawl-depth <depth>', 'Crawl depth for linked pages', '0')
  .option('--capture-screenshots', 'Capture screenshots of analyzed pages', false)
  .option('--analyze-interactions', 'Analyze interactive elements', true)
  .option('--analyze-apis', 'Analyze API calls via network monitoring', false)
  .option('--include-low-confidence', 'Include features with confidence < 70%', false)
  .option('--project-name <name>', 'Project name for context')
  .action(async (url, options) => {
    console.log(`🌐 Analyzing website: ${url}`);

    try {
      const { ProjectAnalyzer } = await import('./index');

      // Create analyzer
      const analyzer = new ProjectAnalyzer(process.cwd());

      // Build analysis options
      const analysisOptions = {
        urls: [url],
        crawlDepth: parseInt(options.crawlDepth),
        captureScreenshots: options.captureScreenshots,
        analyzeInteractions: options.analyzeInteractions,
        analyzeAPIs: options.analyzeApis,
        includeLowConfidence: options.includeLowConfidence
      };

      // Build context
      const context = options.projectName ? {
        projectName: options.projectName,
        platform: 'web' as any
      } : undefined;

      console.log('🔍 Extracting features...');

      // Analyze website
      const result = await analyzer.analyzeWebsites(analysisOptions, context);

      console.log(`✅ Found ${result.features.length} features`);
      console.log(`   Average confidence: ${result.summary.averageConfidence}%`);

      // Export based on format
      const { formatFeaturesAsCSV, formatFeaturesAsJSON, formatFeaturesAsMarkdown, writeFeaturesToFile } = await import('./formatters/featureFormatter');

      // Write output
      const outputPath = path.resolve(options.output);
      await writeFeaturesToFile(result, outputPath, options.format as any);

      console.log(`📄 Output written to: ${outputPath}`);
      console.log('\n📊 Summary by Category:');
      for (const [category, count] of Object.entries(result.summary.byCategory)) {
        console.log(`   ${category}: ${count}`);
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        result.warnings.forEach(w => console.log(`   - ${w}`));
      }

    } catch (error) {
      console.error('❌ Error analyzing website:', error);
      process.exit(1);
    }
  });

// Analyze all (designs + website) command
program
  .command('analyze-all')
  .description('Combined analysis: designs + website')
  .option('--designs <files...>', 'Design file paths')
  .option('--moodboards <files...>', 'Moodboard image paths')
  .option('--wireframes <files...>', 'Wireframe image paths')
  .option('--screenshots <files...>', 'Screenshot image paths')
  .option('--url <url>', 'Website URL to analyze')
  .option('-o, --output <path>', 'Output CSV file path', 'features.csv')
  .option('-f, --format <format>', 'Output format (csv, json, markdown)', 'csv')
  .option('--include-low-confidence', 'Include features with confidence < 70%', false)
  .option('--project-name <name>', 'Project name for context')
  .option('--platform <platform>', 'Target platform (web, mobile, desktop)', 'web')
  .action(async (options) => {
    console.log('🎨🌐 Performing combined analysis...');

    try {
      const { ProjectAnalyzer } = await import('./index');

      // Validate inputs
      const hasDesigns = options.designs || options.moodboards || options.wireframes || options.screenshots;
      const hasWebsite = options.url;

      if (!hasDesigns && !hasWebsite) {
        console.error('❌ Error: At least one source must be provided (designs or --url)');
        process.exit(1);
      }

      // Create analyzer
      const analyzer = new ProjectAnalyzer(process.cwd());

      // Build options
      const designOptions = hasDesigns ? {
        designFiles: options.designs,
        moodboards: options.moodboards,
        wireframes: options.wireframes,
        screenshots: options.screenshots,
        includeLowConfidence: options.includeLowConfidence
      } : undefined;

      const websiteOptions = hasWebsite ? {
        urls: [options.url],
        includeLowConfidence: options.includeLowConfidence
      } : undefined;

      const context = {
        projectName: options.projectName,
        platform: options.platform as any
      };

      console.log('🔍 Analyzing all sources...');

      // Perform combined analysis
      const result = await analyzer.analyzeFull(designOptions, websiteOptions, context);

      console.log(`✅ Found ${result.features.length} features`);
      console.log(`   Average confidence: ${result.summary.averageConfidence}%`);

      // Export
      const { writeFeaturesToFile } = await import('./formatters/featureFormatter');
      const outputPath = path.resolve(options.output);
      await writeFeaturesToFile(result, outputPath, options.format as any);

      console.log(`📄 Output written to: ${outputPath}`);
      console.log('\n📊 Summary:');
      console.log(`   Total features: ${result.summary.totalFeatures}`);
      console.log(`   By source:`);
      for (const [source, count] of Object.entries(result.summary.bySource)) {
        console.log(`     ${source}: ${count}`);
      }
      console.log(`   By category:`);
      for (const [category, count] of Object.entries(result.summary.byCategory)) {
        console.log(`     ${category}: ${count}`);
      }

    } catch (error) {
      console.error('❌ Error during combined analysis:', error);
      process.exit(1);
    }
  });

// Watch command (placeholder for future implementation)
program
  .command('watch [path]')
  .description('Watch repository for TODO changes (coming soon)')
  .action(() => {
    console.log('⏰ Watch mode coming in Phase 2!');
  });

// Generate report command
program
  .command('report [path]')
  .description('Generate a comprehensive report')
  .option('-o, --output-dir <dir>', 'Output directory for reports', './reports')
  .option('--exclude-archives', 'Exclude TODOs from archive directories')
  .action(async (pathArg, options) => {
    const rootPath = path.resolve(pathArg || process.cwd());
    const outputDir = path.resolve(options.outputDir);

    console.log(`📊 Generating comprehensive report for: ${rootPath}`);

    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Perform scan
      const result = await scanTodos({
        rootPath,
        excludeArchives: options.excludeArchives
      });
      const processedResult = processScanResults(result);

      // Generate multiple formats
      const formats: OutputFormat[] = ['markdown', 'json', 'csv'];

      for (const format of formats) {
        const filename = generateReportFilename(format);
        const outputPath = path.join(outputDir, filename);
        const formatted = formatOutput(processedResult, { format, groupBy: 'priority' });
        writeOutput(formatted, outputPath);
      }

      console.log(`✅ Reports generated in: ${outputDir}`);

    } catch (error) {
      console.error('❌ Error generating report:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}