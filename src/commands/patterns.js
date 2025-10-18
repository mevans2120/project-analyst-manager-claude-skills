/**
 * /memory patterns command
 *
 * Show learned code patterns
 */

const MemoryStore = require('../lib/memoryStore');

async function patternsCommand(args, context) {
  const { workingDirectory, logger } = context;
  const { type = 'api-patterns' } = args;

  const memory = new MemoryStore(workingDirectory);

  try {
    const patterns = await memory.getPatterns(type);

    if (!patterns || Object.keys(patterns).length === 0) {
      logger.info(`ℹ️  No patterns found: ${type}`);
      logger.info(`\nAvailable pattern types: api-patterns, error-handling, ui-patterns, database-patterns`);
      return { success: true, patterns: {} };
    }

    let output = '\n';
    output += '━'.repeat(60) + '\n';
    output += `📚 LEARNED PATTERNS: ${type}\n`;
    output += '━'.repeat(60) + '\n\n';

    for (const [key, pattern] of Object.entries(patterns)) {
      output += `${key}:\n`;
      output += `   Pattern: ${pattern.pattern}\n`;
      if (pattern.example) {
        output += `   Example: ${pattern.example}\n`;
      }
      if (pattern.usage) {
        output += `   Usage: ${pattern.usage}\n`;
      }
      output += `   Learned: ${new Date(pattern.learnedAt).toLocaleString()}\n\n`;
    }

    output += '━'.repeat(60) + '\n\n';

    logger.info(output);

    return { success: true, patterns };

  } catch (error) {
    logger.error('Failed to show patterns:', error);
    return { success: false, error: error.message };
  }
}

module.exports = patternsCommand;
