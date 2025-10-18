/**
 * UserPromptSubmit Hook
 *
 * Fires on every user prompt to track changes and remind about memory bank updates
 * Provides actionable instructions to Claude when changes need to be documented
 */

const MemoryStore = require('../lib/memoryStore');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Get git status information
 */
function getGitStatus(workingDirectory) {
  try {
    // Check if we're in a git repo
    execSync('git rev-parse --git-dir', {
      cwd: workingDirectory,
      stdio: 'pipe'
    });

    // Get modified, added, and untracked files
    const status = execSync('git status --porcelain', {
      cwd: workingDirectory,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    const lines = status.trim().split('\n').filter(l => l);
    const files = lines.map(line => {
      const statusCode = line.substring(0, 2);
      const file = line.substring(3);
      return { status: statusCode, file };
    });

    return {
      hasChanges: files.length > 0,
      files,
      modifiedCount: files.filter(f => f.status.includes('M')).length,
      addedCount: files.filter(f => f.status.includes('A')).length,
      untrackedCount: files.filter(f => f.status.includes('??')).length
    };
  } catch (error) {
    return { hasChanges: false, files: [], error: error.message };
  }
}

/**
 * Generate actionable instruction for Claude
 */
async function generateInstruction(session, gitStatus, workingDirectory) {
  let message = '\n';
  message += '━'.repeat(60) + '\n';

  // Check if there are uncommitted changes
  if (!gitStatus.hasChanges) {
    message += '✅ MEMORY BANK STATUS: UP TO DATE\n';
    message += '━'.repeat(60) + '\n\n';
    message += 'No uncommitted changes detected.\n';
    message += 'Memory bank updates are not required at this time.\n';
    message += '━'.repeat(60) + '\n\n';

    return {
      message,
      actionRequired: false,
      reason: 'no_changes'
    };
  }

  // There are changes - instruct Claude to update memory bank
  message += '🧠 ACTION REQUIRED: Update Memory Bank\n';
  message += '━'.repeat(60) + '\n\n';
  message += `Detected ${gitStatus.files.length} uncommitted file(s):\n`;
  message += `  • Modified: ${gitStatus.modifiedCount}\n`;
  message += `  • Added: ${gitStatus.addedCount}\n`;
  message += `  • Untracked: ${gitStatus.untrackedCount}\n\n`;

  message += '📝 INSTRUCTIONS FOR CLAUDE:\n\n';
  message += 'You MUST update the following files:\n\n';

  const filesToUpdate = [];

  // Always update session current.json
  message += '1. .claude-memory/session/current.json\n';
  message += '   → Add changed files to currentTask.files array\n';
  message += '   → Update currentTask.progress (in_progress, completed, blocked)\n';
  message += '   → Add contextNotes describing what was done\n\n';
  filesToUpdate.push('.claude-memory/session/current.json');

  // Update memory bank files
  message += '2. memory-bank/CURRENT.md\n';
  message += '   → Update "Recent Changes" section with what was accomplished\n';
  message += '   → Update "Active Tasks" to reflect current state\n\n';
  filesToUpdate.push('memory-bank/CURRENT.md');

  message += '3. memory-bank/progress.md\n';
  message += '   → Add a new entry with timestamp and brief summary\n';
  message += '   → Include list of files changed\n\n';
  filesToUpdate.push('memory-bank/progress.md');

  // If there's a feature in progress, suggest changelog
  if (session?.currentTask?.feature) {
    message += '4. memory-bank/CHANGELOG.md (if feature is complete)\n';
    message += '   → Document the completed feature\n\n';
    filesToUpdate.push('memory-bank/CHANGELOG.md');
  }

  message += '⚠️  DO NOT COMMIT until memory bank is updated.\n';
  message += '━'.repeat(60) + '\n\n';

  return {
    message,
    actionRequired: true,
    filesToUpdate,
    gitStatus
  };
}

/**
 * Main hook handler
 */
async function onUserPromptSubmit(context) {
  const { prompt, workingDirectory, logger } = context;

  const memory = new MemoryStore(workingDirectory);

  try {
    // Get current git status
    const gitStatus = getGitStatus(workingDirectory);

    // Get current session
    const session = await memory.getCurrentSession();
    if (!session) {
      return { triggered: false, reason: 'no_active_session' };
    }

    // Generate instruction based on git status
    const instruction = await generateInstruction(session, gitStatus, workingDirectory);

    // Log the instruction so Claude sees it
    logger.info(instruction.message);

    return {
      triggered: true,
      sessionId: session.sessionId,
      actionRequired: instruction.actionRequired,
      filesToUpdate: instruction.filesToUpdate,
      gitStatus: instruction.gitStatus,
      reason: instruction.reason
    };

  } catch (error) {
    return {
      triggered: false,
      error: error.message
    };
  }
}

module.exports = onUserPromptSubmit;
