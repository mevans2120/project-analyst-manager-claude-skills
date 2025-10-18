#!/usr/bin/env node

/**
 * Claude Memory Store - Core library for hybrid memory system
 *
 * Manages JSON-based automated memory in .claude-memory/
 * No external dependencies - Node.js built-ins only
 */

const fs = require('fs').promises;
const path = require('path');

class MemoryStore {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
    this.memoryDir = path.join(baseDir, '.claude-memory');
  }

  /**
   * Initialize memory directories
   */
  async initialize() {
    const dirs = [
      this.memoryDir,
      path.join(this.memoryDir, 'session'),
      path.join(this.memoryDir, 'session', 'archive'),
      path.join(this.memoryDir, 'patterns'),
      path.join(this.memoryDir, 'project'),
      path.join(this.memoryDir, 'examples')
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Create .gitignore for session data (keep patterns/project)
    const gitignorePath = path.join(this.memoryDir, '.gitignore');
    const gitignoreContent = `# Claude Memory - Ignore session state
session/current.json
session/archive/*.json
`;
    try {
      await fs.access(gitignorePath);
    } catch {
      await fs.writeFile(gitignorePath, gitignoreContent);
    }
  }

  /**
   * Initialize memory-bank directory with template files
   */
  async initializeMemoryBank() {
    const memoryBankDir = path.join(this.baseDir, 'memory-bank');

    // Create memory-bank directory
    await fs.mkdir(memoryBankDir, { recursive: true });

    // Template files with their content
    const templates = {
      'CURRENT.md': `# Current Project Status

## Overview
<!-- Brief description of the project -->

## Current Focus
<!-- What you're working on right now -->

## Active Tasks
- [ ] Task 1
- [ ] Task 2

## Recent Changes
<!-- What was recently completed -->

## Next Steps
<!-- What's coming up next -->

## Known Issues
<!-- Any blockers or problems to be aware of -->

---
*Last updated: ${new Date().toISOString().split('T')[0]}*
`,

      'progress.md': `# Project Progress

## Session History

<!-- Add session summaries below using this template:

## Session YYYY-MM-DD

**Duration**: Xh Ym
**Focus**: [What you worked on]

### Completed
- Feature/fix description

### Files Modified
- path/to/file.js
- path/to/other.ts

### Notes
- Important context for next session

---

-->
`,

      'CHANGELOG.md': `# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

<!-- Track major features and deployments here -->

### Added
-

### Changed
-

### Fixed
-

---

<!-- Format for entries:
## [Version] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Changes to existing features

### Fixed
- Bug fixes

### Deployment
- Deployment notes
-->
`,

      'ARCHITECTURE.md': `# Architecture Documentation

## System Overview
<!-- High-level description of the system architecture -->

## Key Components
<!-- Main components and their responsibilities -->

## Data Flow
<!-- How data flows through the system -->

## Technology Stack
<!-- Core technologies and frameworks -->

## Design Decisions
<!-- Important architectural decisions and their rationale -->

### Decision: [Title]
**Date**: YYYY-MM-DD
**Status**: Accepted | Proposed | Deprecated

**Context**:
<!-- What problem are we solving? -->

**Decision**:
<!-- What did we decide to do? -->

**Consequences**:
<!-- What are the trade-offs? -->

---

## Integration Points
<!-- External systems and APIs -->

## Security Considerations
<!-- Security architecture and measures -->

## Future Considerations
<!-- Planned architectural changes or improvements -->
`
    };

    // Create each template file if it doesn't exist
    const created = [];
    for (const [filename, content] of Object.entries(templates)) {
      const filePath = path.join(memoryBankDir, filename);
      try {
        await fs.access(filePath);
        // File exists, skip
      } catch {
        // File doesn't exist, create it
        await fs.writeFile(filePath, content, 'utf-8');
        created.push(filename);
      }
    }

    return {
      initialized: true,
      directory: memoryBankDir,
      filesCreated: created
    };
  }

  /**
   * Read memory by category and key
   */
  async get(category, key) {
    const filePath = path.join(this.memoryDir, category, `${key}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Write memory
   */
  async set(category, key, value) {
    const categoryDir = path.join(this.memoryDir, category);
    await fs.mkdir(categoryDir, { recursive: true });

    const filePath = path.join(categoryDir, `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n');

    return filePath;
  }

  /**
   * Get current session
   */
  async getCurrentSession() {
    return this.get('session', 'current');
  }

  /**
   * Create new session
   */
  async createSession() {
    const session = {
      sessionId: this.createSessionId(),
      startedAt: new Date().toISOString(),
      currentTask: {
        feature: '',
        files: [],
        progress: 'not_started',
        nextSteps: []
      },
      activeBugs: [],
      recentChanges: [],
      contextNotes: [],
      expiresAt: this.createExpirationDate(24)
    };

    await this.set('session', 'current', session);
    return session;
  }

  /**
   * Update current session (merges with existing)
   */
  async updateSession(updates) {
    let current = await this.getCurrentSession();

    if (!current) {
      current = await this.createSession();
    }

    const updated = this.deepMerge(current, updates);
    await this.set('session', 'current', updated);

    return updated;
  }

  /**
   * Archive current session
   */
  async archiveSession() {
    const current = await this.getCurrentSession();
    if (!current) {
      return { archived: false, message: 'No active session to archive' };
    }

    const archiveDir = path.join(this.memoryDir, 'session/archive');
    await fs.mkdir(archiveDir, { recursive: true });

    const archiveFile = path.join(archiveDir, `${current.sessionId}.json`);
    await fs.writeFile(archiveFile, JSON.stringify(current, null, 2) + '\n');

    // Clear current
    const currentPath = path.join(this.memoryDir, 'session/current.json');
    await fs.unlink(currentPath);

    return {
      archived: true,
      sessionId: current.sessionId,
      archiveFile
    };
  }

  /**
   * List archived sessions
   */
  async listArchives() {
    const archiveDir = path.join(this.memoryDir, 'session/archive');
    try {
      const files = await fs.readdir(archiveDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      // Get file stats for sorting by date
      const filesWithStats = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(archiveDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file.replace('.json', ''),
            file,
            path: filePath,
            modified: stats.mtime
          };
        })
      );

      // Sort by modification time (newest first)
      filesWithStats.sort((a, b) => b.modified - a.modified);

      return filesWithStats;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Add file change to session
   */
  async recordChange(file, action, description) {
    const session = await this.getCurrentSession();
    if (!session) {
      return { recorded: false, message: 'No active session' };
    }

    const change = {
      file,
      action,
      timestamp: new Date().toISOString(),
      description
    };

    session.recentChanges = session.recentChanges || [];
    session.recentChanges.unshift(change); // Add to beginning

    // Keep only last 20 changes
    if (session.recentChanges.length > 20) {
      session.recentChanges = session.recentChanges.slice(0, 20);
    }

    await this.set('session', 'current', session);
    return { recorded: true, change };
  }

  /**
   * Add context note to session
   */
  async addNote(note) {
    const session = await this.getCurrentSession();
    if (!session) {
      return { added: false, message: 'No active session' };
    }

    session.contextNotes = session.contextNotes || [];
    if (!session.contextNotes.includes(note)) {
      session.contextNotes.push(note);
      await this.set('session', 'current', session);
      return { added: true, note };
    }

    return { added: false, message: 'Note already exists' };
  }

  /**
   * Clean up expired sessions
   */
  async cleanExpired() {
    const current = await this.getCurrentSession();
    if (!current) {
      return { cleaned: false, message: 'No active session' };
    }

    const expiresAt = new Date(current.expiresAt);
    if (expiresAt < new Date()) {
      const result = await this.archiveSession();
      return {
        cleaned: true,
        message: 'Session expired and archived',
        ...result
      };
    }

    return {
      cleaned: false,
      message: 'Session still valid',
      expiresAt: current.expiresAt
    };
  }

  /**
   * Get learned pattern
   */
  async getPattern(patternType, patternKey) {
    const patterns = await this.get('patterns', patternType);
    return patterns?.[patternKey];
  }

  /**
   * Get all patterns of a type
   */
  async getPatterns(patternType) {
    return this.get('patterns', patternType);
  }

  /**
   * Learn new pattern
   */
  async learnPattern(patternType, patternKey, pattern) {
    const patterns = await this.get('patterns', patternType) || {};

    patterns[patternKey] = {
      ...pattern,
      learnedAt: pattern.learnedAt || new Date().toISOString()
    };

    await this.set('patterns', patternType, patterns);
    return { learned: true, patternType, patternKey };
  }

  /**
   * Get project info
   */
  async getTechStack() {
    return this.get('project', 'tech-stack');
  }

  async getConventions() {
    return this.get('project', 'conventions');
  }

  async getArchitecture() {
    return this.get('project', 'architecture');
  }

  /**
   * Update project info
   */
  async updateTechStack(updates) {
    const current = await this.getTechStack() || {};
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    await this.set('project', 'tech-stack', updated);
    return updated;
  }

  async updateConventions(updates) {
    const current = await this.getConventions() || {};
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    await this.set('project', 'conventions', updated);
    return updated;
  }

  async updateArchitecture(updates) {
    const current = await this.getArchitecture() || {};
    const updated = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    await this.set('project', 'architecture', updated);
    return updated;
  }

  /**
   * Helper: Deep merge objects
   */
  deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        output[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }

  /**
   * Helper: Create session ID
   */
  createSessionId(date) {
    const d = date || new Date();
    const dateStr = d.toISOString().split('T')[0];
    const hour = d.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `${dateStr}-${timeOfDay}`;
  }

  /**
   * Helper: Create expiration date
   */
  createExpirationDate(hoursFromNow = 24) {
    const d = new Date();
    d.setHours(d.getHours() + hoursFromNow);
    return d.toISOString();
  }
}

module.exports = MemoryStore;
