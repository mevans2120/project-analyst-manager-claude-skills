/**
 * Sample file demonstrating various TODO patterns
 */

// TODO: Implement user authentication system
class UserService {
  constructor() {
    // FIXME: Database connection is not properly closed
    this.db = null;
  }

  async getUser(id) {
    // BUG: SQL injection vulnerability here
    const query = `SELECT * FROM users WHERE id = ${id}`;

    // HACK: Temporary workaround for timeout issues
    setTimeout(() => {}, 100);

    // OPTIMIZE: This query could use indexing
    return await this.db.query(query);
  }

  // REFACTOR: Split this method into smaller functions
  async createUser(data) {
    // NOTE: Password should be hashed before storage
    // XXX: Need to add email validation

    /* TODO: Add these fields:
     * - phone number
     * - address
     * - profile picture
     */

    return data;
  }
}