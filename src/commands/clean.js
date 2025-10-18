/**
 * /memory clean command
 *
 * Clean up expired sessions
 */

const MemoryStore = require('../lib/memoryStore');

async function cleanCommand(args, context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    const result = await memory.cleanExpired();

    if (result.cleaned) {
      logger.info(`🧹 ${result.message}`);
      if (result.sessionId) {
        logger.info(`   Archived: ${result.sessionId}`);
      }
      return { success: true, ...result };
    } else {
      logger.info(`✅ ${result.message}`);
      if (result.expiresAt) {
        logger.info(`   Expires: ${new Date(result.expiresAt).toLocaleString()}`);
      }
      return { success: true, ...result };
    }

  } catch (error) {
    logger.error('Failed to clean sessions:', error);
    return { success: false, error: error.message };
  }
}

module.exports = cleanCommand;
