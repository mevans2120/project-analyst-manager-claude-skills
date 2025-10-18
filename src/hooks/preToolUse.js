/**
 * PreToolUse Hook
 *
 * Triggers before git status commands to remind about memory bank updates
 * Provides a gentle reminder to update session memory before committing
 */

const MemoryStore = require('../lib/memoryStore');
const fs = require('fs').promises;
const path = require('path');

/**
 * Check if this is a git status command
 */
function isGitStatus(toolName, params) {
  if (toolName !== 'Bash') return false;
  const command = params.command || '';
  return /git\s+status/.test(command);
}

/**
 * Generate actionable instruction for Claude to update memory bank
 */
async function generateMemoryUpdateInstruction(session, workingDirectory) {
  const instruction = {
    message: '',
    sessionData: session,
    filesToUpdate: []
  };

  let message = '\n';
  message += '━'.repeat(60) + '\n';
  message += '🧠 REMINDER: Consider Updating Memory Bank\n';
  message += '━'.repeat(60) + '\n\n';

  // Check session activity
  const recentChanges = session?.recentChanges || [];
  const hasChanges = recentChanges.length > 0;

  if (hasChanges) {
    message += 'If you are about to commit changes, consider updating:\n\n';
    message += '1. .claude-memory/session/current.json:\n';
    message += '   • Update currentTask.files with files being committed\n';
    message += '   • Set currentTask.progress appropriately\n';
    message += '   • Add contextNotes about what was accomplished\n\n';
    instruction.filesToUpdate.push('.claude-memory/session/current.json');

    // Check if feature work
    if (session?.currentTask?.feature) {
      message += '2. Document the feature work in session notes\n\n';
    }
  } else {
    message += 'No recent changes detected in session memory.\n';
    message += 'If you have made changes, consider updating the session.\n\n';
  }

  message += '━'.repeat(60) + '\n\n';

  instruction.message = message;
  return instruction;
}

/**
 * Main hook handler
 */
async function onPreToolUse(context) {
  const { toolName, parameters, workingDirectory, logger } = context;

  // Only care about git status commands
  if (!isGitStatus(toolName, parameters)) {
    return { triggered: false, reason: 'not_git_status' };
  }

  const memory = new MemoryStore(workingDirectory);

  try {
    const session = await memory.getCurrentSession();

    // Generate instruction for Claude to update memory bank
    const instruction = await generateMemoryUpdateInstruction(
      session,
      workingDirectory
    );

    // Log the instruction so it appears in Claude's context
    logger.info(instruction.message);

    return {
      triggered: true,
      message: instruction.message,
      sessionData: instruction.sessionData,
      filesToUpdate: instruction.filesToUpdate,
      sessionId: session?.sessionId
    };

  } catch (error) {
    return {
      triggered: false,
      error: error.message
    };
  }
}

module.exports = onPreToolUse;
