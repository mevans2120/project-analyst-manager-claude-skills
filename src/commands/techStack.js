/**
 * /memory tech-stack command
 *
 * Display project tech stack
 */

const MemoryStore = require('../lib/memoryStore');

async function techStackCommand(args, context) {
  const { workingDirectory, logger } = context;
  const memory = new MemoryStore(workingDirectory);

  try {
    const techStack = await memory.getTechStack();

    if (!techStack) {
      logger.info('ℹ️  No tech stack information available');
      logger.info('\nTech stack will be detected and saved during first session');
      return { success: true, techStack: null };
    }

    let output = '\n';
    output += '━'.repeat(60) + '\n';
    output += '🏗️  TECH STACK\n';
    output += '━'.repeat(60) + '\n\n';

    if (techStack.framework) {
      output += `Framework: ${techStack.framework}\n`;
    }
    if (techStack.language) {
      output += `Language: ${techStack.language}\n`;
    }
    if (techStack.database) {
      output += `Database: ${techStack.database.type}`;
      if (techStack.database.orm) {
        output += ` (${techStack.database.orm})`;
      }
      output += '\n';
      if (techStack.database.host) {
        output += `   Host: ${techStack.database.host}\n`;
      }
    }
    if (techStack.authentication) {
      output += `Auth: ${techStack.authentication}\n`;
    }
    if (techStack.hosting) {
      output += `Hosting: ${techStack.hosting}\n`;
    }
    if (techStack.styling) {
      output += `Styling: ${techStack.styling}\n`;
    }
    if (techStack.stateManagement) {
      output += `State: ${techStack.stateManagement}\n`;
    }
    if (techStack.icons) {
      output += `Icons: ${techStack.icons}\n`;
    }

    if (techStack.lastUpdated) {
      output += `\nLast updated: ${new Date(techStack.lastUpdated).toLocaleString()}\n`;
    }

    output += '\n━'.repeat(60) + '\n\n';

    logger.info(output);

    return { success: true, techStack };

  } catch (error) {
    logger.error('Failed to show tech stack:', error);
    return { success: false, error: error.message };
  }
}

module.exports = techStackCommand;
