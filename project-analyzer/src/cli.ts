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

      // Perform scan
      const result = await scanTodos({
        rootPath,
        includePatterns: options.include,
        excludePatterns: options.exclude,
        useGitignore: options.gitignore !== false,
        includeCompleted: options.includeCompleted,
        groupByFile: options.groupBy === 'file'
      });

      // Process results to add IDs and hashes
      const processedResult = processScanResults(result);

      // Handle state file and new TODOs filtering
      if (options.stateFile || options.onlyNew) {
        const statePath = options.stateFile || path.join(rootPath, '.project-state.json');
        const previousHashes = loadPreviousState(statePath);

        if (options.onlyNew) {
          const newTodos = findNewTodos(processedResult.todos, previousHashes);
          processedResult.todos = newTodos;
          processedResult.summary.totalTodos = newTodos.length;
          console.log(`🆕 Found ${newTodos.length} new TODO(s)`);
        }

        // Save state if requested
        if (options.stateFile) {
          saveState(statePath, processedResult.todos);
          console.log(`💾 State saved to: ${statePath}`);
        }
      }

      // Format output
      const formatted = formatOutput(processedResult, {
        format: options.format as OutputFormat,
        groupBy: options.groupBy,
        compact: options.compact
      });

      // Write or print output
      if (options.output) {
        writeOutput(formatted, options.output);
      } else {
        console.log('\n' + formatted);
      }

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
      const result = await scanTodos({ rootPath });
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