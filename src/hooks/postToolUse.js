/**
 * PostToolUse Hook
 *
 * Fires after tool use - currently a stub implementation
 * Can be extended to track tool usage, update session state, etc.
 */

/**
 * Main hook handler
 */
async function onPostToolUse(context) {
  const { toolName, parameters, result, workingDirectory } = context;

  // Currently just a pass-through
  // Can be extended later to:
  // - Track tool usage patterns
  // - Update session state after significant operations
  // - Log errors or warnings

  return {
    triggered: false,
    reason: 'stub_implementation'
  };
}

module.exports = onPostToolUse;
