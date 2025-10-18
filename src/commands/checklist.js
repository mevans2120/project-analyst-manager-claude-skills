/**
 * /memory checklist command
 *
 * Show session documentation checklist
 */

const fs = require('fs').promises;
const path = require('path');

async function checklistCommand(args, context) {
  const { workingDirectory, logger } = context;

  try {
    const checklistPath = path.join(workingDirectory, 'memory-bank', 'SESSION_CHECKLIST.md');

    try {
      const content = await fs.readFile(checklistPath, 'utf-8');
      logger.info('\n' + content + '\n');
      return { success: true, found: true };
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('ℹ️  memory-bank/SESSION_CHECKLIST.md not found');
        logger.info('\nCreate this file with templates for documentation updates');
        return { success: true, found: false };
      }
      throw error;
    }

  } catch (error) {
    logger.error('Failed to show checklist:', error);
    return { success: false, error: error.message };
  }
}

module.exports = checklistCommand;
