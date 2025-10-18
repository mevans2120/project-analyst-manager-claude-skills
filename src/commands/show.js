/**
 * /memory show command
 *
 * Display current session state
 */

const MemoryStore = require('../lib/memoryStore');

async function showCommand(args, context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    const session = await memory.getCurrentSession();
    if (!session) {
      logger.info('ℹ️  No active session');
      return { success: true, session: null };
    }

    let output = '\n';
    output += '━'.repeat(60) + '\n';
    output += '📋 CURRENT SESSION\n';
    output += '━'.repeat(60) + '\n\n';

    output += `Session ID: ${session.sessionId}\n`;
    output += `Started: ${new Date(session.startedAt).toLocaleString()}\n`;
    output += `Expires: ${new Date(session.expiresAt).toLocaleString()}\n\n`;

    output += '📌 Current Task:\n';
    output += `   Feature: ${session.currentTask.feature || '(not set)'}\n`;
    output += `   Progress: ${session.currentTask.progress}\n`;
    output += `   Files: ${session.currentTask.files.length}\n`;

    if (session.currentTask.files.length > 0) {
      output += '\n   Modified files:\n';
      session.currentTask.files.slice(0, 10).forEach(file => {
        output += `   • ${file}\n`;
      });
      if (session.currentTask.files.length > 10) {
        output += `   ... and ${session.currentTask.files.length - 10} more\n`;
      }
    }

    if (session.currentTask.nextSteps && session.currentTask.nextSteps.length > 0) {
      output += '\n✅ Next Steps:\n';
      session.currentTask.nextSteps.forEach((step, i) => {
        output += `   ${i + 1}. ${step}\n`;
      });
    }

    if (session.activeBugs && session.activeBugs.length > 0) {
      output += `\n🐛 Active Bugs: ${session.activeBugs.length}\n`;
      session.activeBugs.forEach(bug => {
        output += `   • ${bug}\n`;
      });
    }

    if (session.contextNotes && session.contextNotes.length > 0) {
      output += '\n💭 Context Notes:\n';
      session.contextNotes.forEach(note => {
        output += `   • ${note}\n`;
      });
    }

    if (session.recentChanges && session.recentChanges.length > 0) {
      output += `\n📝 Recent Changes (${session.recentChanges.length}):\n`;
      session.recentChanges.slice(0, 5).forEach(change => {
        const time = new Date(change.timestamp).toLocaleTimeString();
        output += `   [${time}] ${change.action}: ${change.file}\n`;
      });
      if (session.recentChanges.length > 5) {
        output += `   ... and ${session.recentChanges.length - 5} more\n`;
      }
    }

    output += '\n━'.repeat(60) + '\n\n';

    logger.info(output);

    return { success: true, session };

  } catch (error) {
    logger.error('Failed to show session:', error);
    return { success: false, error: error.message };
  }
}

module.exports = showCommand;
