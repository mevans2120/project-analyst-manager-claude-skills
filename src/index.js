/**
 * Hybrid Memory Bank Plugin
 * Main entry point
 */

const MemoryStore = require('./lib/memoryStore');

// Hooks
const onSessionStart = require('./hooks/sessionStart');
const onPostToolUse = require('./hooks/postToolUse');
const onUserPromptSubmit = require('./hooks/userPromptSubmit');

// Commands
const showCommand = require('./commands/show');
const noteCommand = require('./commands/note');
const patternsCommand = require('./commands/patterns');
const techStackCommand = require('./commands/techStack');
const archiveCommand = require('./commands/archive');
const cleanCommand = require('./commands/clean');
const listArchivesCommand = require('./commands/listArchives');
const endSessionCommand = require('./commands/endSession');
const checklistCommand = require('./commands/checklist');

/**
 * Plugin initialization
 */
async function initialize(context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    await memory.initialize();
    logger.info('Hybrid Memory Bank Plugin initialized');
    return { success: true };
  } catch (error) {
    logger.error('Failed to initialize plugin:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Plugin exports
 */
module.exports = {
  // Lifecycle
  initialize,

  // Hooks
  hooks: {
    sessionStart: onSessionStart,
    postToolUse: onPostToolUse,
    userPromptSubmit: onUserPromptSubmit
  },

  // Commands
  commands: {
    show: showCommand,
    note: noteCommand,
    patterns: patternsCommand,
    techStack: techStackCommand,
    archive: archiveCommand,
    clean: cleanCommand,
    listArchives: listArchivesCommand,
    endSession: endSessionCommand,
    checklist: checklistCommand
  },

  // Library
  MemoryStore
};
