/**
 * /memory end-session command
 *
 * End current session with documentation reminders
 * Replaces: scripts/session-end.sh
 */

const MemoryStore = require('../lib/memoryStore');

async function endSessionCommand(args, context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    // Show session summary
    const session = await memory.getCurrentSession();

    if (!session) {
      logger.info('ℹ️  No active session to end');
      return { success: true, ended: false };
    }

    let output = '\n';
    output += '━'.repeat(60) + '\n';
    output += '💾 ENDING SESSION\n';
    output += '━'.repeat(60) + '\n\n';

    output += '📋 Session Summary:\n';
    output += `   ID: ${session.sessionId}\n`;
    output += `   Duration: ${new Date(session.startedAt).toLocaleString()} → ${new Date().toLocaleString()}\n`;
    output += `   Files modified: ${session.currentTask.files.length}\n`;
    output += `   Changes recorded: ${session.recentChanges.length}\n`;
    output += `   Notes: ${session.contextNotes.length}\n\n`;

    // Archive session
    const archiveResult = await memory.archiveSession();

    if (archiveResult.archived) {
      output += `✅ Session archived: ${archiveResult.sessionId}\n\n`;
    }

    // Documentation reminders
    output += '━'.repeat(60) + '\n';
    output += '⚠️  REMINDER: Update Memory Bank\n';
    output += '━'.repeat(60) + '\n\n';

    output += 'Please update these files if needed:\n\n';

    output += '   📄 memory-bank/CURRENT.md\n';
    output += '      → Update if project state changed\n\n';

    output += '   📄 memory-bank/progress.md\n';
    output += '      → Add session summary with timestamp\n\n';

    output += '   📄 memory-bank/CHANGELOG.md\n';
    output += '      → Record if you deployed or completed major features\n\n';

    output += '   📄 memory-bank/ARCHITECTURE.md\n';
    output += '      → Document if you made architectural decisions\n\n';

    output += '━'.repeat(60) + '\n';
    output += '✅ Session ended successfully!\n';
    output += '━'.repeat(60) + '\n\n';

    logger.info(output);

    return {
      success: true,
      ended: true,
      sessionId: session.sessionId,
      archived: archiveResult.archived
    };

  } catch (error) {
    logger.error('Failed to end session:', error);
    return { success: false, error: error.message };
  }
}

module.exports = endSessionCommand;
