/**
 * /memory list-archives command
 *
 * List all archived sessions
 */

const MemoryStore = require('../lib/memoryStore');

async function listArchivesCommand(args, context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    const archives = await memory.listArchives();

    let output = '\n';
    output += '━'.repeat(60) + '\n';
    output += `📦 ARCHIVED SESSIONS: ${archives.length}\n`;
    output += '━'.repeat(60) + '\n\n';

    if (archives.length === 0) {
      output += 'No archived sessions found\n';
    } else {
      archives.forEach(archive => {
        output += `${archive.name}\n`;
        output += `   Modified: ${archive.modified.toLocaleString()}\n`;
        output += `   Path: ${archive.path}\n\n`;
      });
    }

    output += '━'.repeat(60) + '\n\n';

    logger.info(output);

    return { success: true, archives };

  } catch (error) {
    logger.error('Failed to list archives:', error);
    return { success: false, error: error.message };
  }
}

module.exports = listArchivesCommand;
