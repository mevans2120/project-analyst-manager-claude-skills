#!/usr/bin/env node

/**
 * userPromptSubmit hook wrapper
 * Bridges Claude Code's shell hook to the JavaScript implementation
 */

const path = require('path');
const { readStdin, writeResponse, writeError, executeHook } = require('./wrapper');

async function main() {
  try {
    // Read input from stdin
    const context = await readStdin();

    // Path to the original hook implementation
    const hookPath = path.resolve(__dirname, '../../src/hooks/userPromptSubmit.js');

    // Execute the original hook
    const result = await executeHook(hookPath, context);

    // Write response to stdout
    writeResponse({
      message: 'User prompt processed successfully',
      result
    });
  } catch (error) {
    // Enhanced error logging
    console.error('UserPromptSubmit hook error:', error);
    console.error('Error stack:', error.stack);
    console.error('Working directory:', process.cwd());

    // Write error to stdout
    writeError({
      message: error.message,
      stack: error.stack,
      cwd: process.cwd()
    });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}