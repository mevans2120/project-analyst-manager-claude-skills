#!/usr/bin/env node

/**
 * preToolUse hook wrapper
 * Bridges Claude Code's shell hook to the JavaScript implementation
 */

const path = require('path');
const { readStdin, writeResponse, writeError, executeHook } = require('./wrapper');

async function main() {
  try {
    // Read input from stdin
    const context = await readStdin();

    // Path to the original hook implementation
    const hookPath = path.resolve(__dirname, '../../src/hooks/preToolUse.js');

    // Execute the original hook
    const result = await executeHook(hookPath, context);

    // Write response to stdout
    writeResponse({
      message: 'PreToolUse hook executed',
      result
    });
  } catch (error) {
    // Write error to stdout
    writeError(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
