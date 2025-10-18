/**
 * SessionStart Hook
 *
 * Automatically triggered when Claude Code starts a new session
 * Replaces: scripts/session-start.sh
 */

const MemoryStore = require('../lib/memoryStore');
const fs = require('fs').promises;
const path = require('path');

/**
 * Format session display output
 */
function formatSessionDisplay(session, techStack, currentMd) {
  let output = '\n';
  output += '━'.repeat(60) + '\n';
  output += '🚀 HYBRID MEMORY BANK - SESSION STARTED\n';
  output += '━'.repeat(60) + '\n\n';

  // Memory Bank Status
  output += '📋 MEMORY BANK STATUS\n';
  output += '─'.repeat(60) + '\n';

  if (currentMd) {
    const lines = currentMd.split('\n').slice(0, 20);
    output += lines.join('\n') + '\n\n';
  } else {
    output += '📝 memory-bank/ files initialized with templates\n';
    output += '   Update CURRENT.md to track project status\n\n';
  }

  // Claude Memory Status
  output += '━'.repeat(60) + '\n';
  output += '🧠 CLAUDE MEMORY STATUS\n';
  output += '━'.repeat(60) + '\n\n';

  if (session) {
    output += '📋 Current Session:\n';
    output += `   ID: ${session.sessionId}\n`;
    output += `   Started: ${new Date(session.startedAt).toLocaleString()}\n`;
    output += `   Expires: ${new Date(session.expiresAt).toLocaleString()}\n\n`;

    output += '📌 Current Task:\n';
    output += `   Feature: ${session.currentTask.feature || '(not set)'}\n`;
    output += `   Progress: ${session.currentTask.progress}\n`;
    output += `   Files: ${session.currentTask.files.length}\n\n`;

    if (session.contextNotes && session.contextNotes.length > 0) {
      output += '💭 Context Notes:\n';
      session.contextNotes.forEach(note => {
        output += `   • ${note}\n`;
      });
      output += '\n';
    }
  } else {
    output += 'ℹ️  No active session (creating new session...)\n\n';
  }

  // Tech Stack
  if (techStack) {
    output += '🏗️  Tech Stack:\n';
    output += `   Framework: ${techStack.framework}\n`;
    output += `   Language: ${techStack.language}\n`;
    if (techStack.database) {
      output += `   Database: ${techStack.database.type}`;
      if (techStack.database.orm) {
        output += ` (${techStack.database.orm})`;
      }
      output += '\n';
    }
    output += '\n';
  }

  output += '━'.repeat(60) + '\n';
  output += '✨ Session ready! Use /memory show for details\n';
  output += '━'.repeat(60) + '\n\n';

  return output;
}

/**
 * Main hook handler
 */
async function onSessionStart(context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    // Initialize memory directories if needed
    await memory.initialize();

    // Initialize memory-bank directory and files if needed
    const memoryBankInit = await memory.initializeMemoryBank();

    // Clean expired sessions
    await memory.cleanExpired();

    // Get or create current session
    let session = await memory.getCurrentSession();
    if (!session) {
      session = await memory.createSession();
    }

    // Get tech stack
    const techStack = await memory.getTechStack();

    // Read memory-bank/CURRENT.md if it exists
    let currentMd = null;
    const currentMdPath = path.join(workingDirectory, 'memory-bank', 'CURRENT.md');
    try {
      currentMd = await fs.readFile(currentMdPath, 'utf-8');
    } catch (error) {
      // File doesn't exist, that's okay
    }

    // Format and display session info
    const output = formatSessionDisplay(session, techStack, currentMd);
    logger.info(output);

    // Log memory bank initialization if files were created
    if (memoryBankInit.filesCreated.length > 0) {
      logger.info(`\n✅ Created memory-bank files: ${memoryBankInit.filesCreated.join(', ')}\n`);
    }

    return {
      success: true,
      message: 'Session initialized successfully',
      sessionId: session.sessionId,
      memoryBankInit
    };

  } catch (error) {
    logger.error('Failed to initialize session:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = onSessionStart;
