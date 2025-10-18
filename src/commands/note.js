/**
 * /memory note command
 *
 * Add a context note to the current session
 */

const MemoryStore = require('../lib/memoryStore');

async function noteCommand(args, context) {
  const { workingDirectory, logger } = context;
  const { text } = args;

  if (!text || text.trim().length === 0) {
    logger.error('Usage: /memory note "Your note here"');
    return { success: false, error: 'Note text required' };
  }

  const memory = new MemoryStore(workingDirectory);

  try {
    const result = await memory.addNote(text.trim());

    if (result.added) {
      logger.info(`📝 Added note: ${text}`);
      return { success: true, note: text };
    } else {
      logger.warn(`ℹ️  ${result.message}`);
      return { success: false, message: result.message };
    }

  } catch (error) {
    logger.error('Failed to add note:', error);
    return { success: false, error: error.message };
  }
}

module.exports = noteCommand;
