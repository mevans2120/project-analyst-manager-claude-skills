#!/usr/bin/env node

/**
 * Base wrapper for bridging Claude Code's shell hooks to JavaScript implementations
 * Handles stdin/stdout communication and converts between formats
 */

const fs = require('fs');
const path = require('path');

/**
 * Read JSON from stdin
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', chunk => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      try {
        // Parse JSON input from Claude Code
        const parsed = data ? JSON.parse(data) : {};
        resolve(parsed);
      } catch (error) {
        reject(new Error(`Failed to parse JSON input: ${error.message}`));
      }
    });

    process.stdin.on('error', reject);
  });
}

/**
 * Write response to stdout
 */
function writeResponse(response) {
  // Ensure we have a valid response object
  const output = {
    success: true,
    ...response
  };

  // Write JSON response to stdout for Claude Code
  process.stdout.write(JSON.stringify(output, null, 2));
}

/**
 * Write error to stdout
 */
function writeError(error) {
  const output = {
    success: false,
    error: error.message || String(error)
  };

  process.stdout.write(JSON.stringify(output, null, 2));
}

/**
 * Initialize memory store if needed
 */
async function initializeMemoryStore() {
  try {
    const MemoryStore = require('../../src/lib/memoryStore');
    const memoryStore = new MemoryStore();
    await memoryStore.initialize();
    return memoryStore;
  } catch (error) {
    console.error('Failed to initialize memory store:', error);
    return null;
  }
}

/**
 * Execute a hook with the given context
 */
async function executeHook(hookPath, context) {
  try {
    // Load the original hook implementation
    const hook = require(hookPath);

    // Initialize memory store if needed
    const memoryStore = await initializeMemoryStore();

    // Capture logger output
    let logOutput = [];
    const captureLogger = {
      log: (...args) => {
        logOutput.push(args.join(' '));
        console.log(...args);
      },
      error: (...args) => {
        logOutput.push(`ERROR: ${args.join(' ')}`);
        console.error(...args);
      },
      warn: (...args) => {
        logOutput.push(`WARN: ${args.join(' ')}`);
        console.warn(...args);
      },
      info: (...args) => {
        logOutput.push(args.join(' '));
        console.log(...args);
      }
    };

    // Merge the incoming context with expected properties
    // Claude Code passes different property names than the original plugin expected
    const enrichedContext = {
      workingDirectory: process.cwd(),
      logger: captureLogger,
      ...context
    };

    // Execute the hook
    let result;
    if (typeof hook === 'function') {
      result = await hook(enrichedContext);
    } else if (hook.execute && typeof hook.execute === 'function') {
      result = await hook.execute(enrichedContext);
    } else {
      throw new Error('Hook does not export a valid function');
    }

    // Include captured log output in the result
    if (logOutput.length > 0) {
      result = {
        ...result,
        logOutput: logOutput.join('\n')
      };
    }

    return result;
  } catch (error) {
    throw new Error(`Hook execution failed: ${error.message}`);
  }
}

module.exports = {
  readStdin,
  writeResponse,
  writeError,
  initializeMemoryStore,
  executeHook
};