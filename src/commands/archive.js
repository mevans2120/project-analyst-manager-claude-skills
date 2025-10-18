/**
 * /memory archive command
 *
 * Archive current session
 */

const MemoryStore = require('../lib/memoryStore');

async function archiveCommand(args, context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    const result = await memory.archiveSession();

    if (result.archived) {
      logger.info(`✅ Archived session: ${result.sessionId}`);
      logger.info(`   Archive file: ${result.archiveFile}`);
      return { success: true, ...result };
    } else {
      logger.info(`ℹ️  ${result.message}`);
      return { success: true, ...result };
    }

  } catch (error) {
    logger.error('Failed to archive session:', error);
    return { success: false, error: error.message };
  }
}

module.exports = archiveCommand;
