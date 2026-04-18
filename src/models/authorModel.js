import { pool } from '../config/db.js';

export const AuthorModel = {
  async getAll(name) {
    if (name) {
      const result = await pool.query(
        'SELECT * FROM authors WHERE name ILIKE $1 ORDER BY name ASC',
        [`%${name}%`]
      );
      return result.rows;
    }
    const result = await pool.query('SELECT * FROM authors ORDER BY name ASC');
    return result.rows;
  },
  async create(name, nationality) {
    const query = 'INSERT INTO authors (name, nationality) VALUES ($1, $2) RETURNING *';
    const result = await pool.query(query, [name, nationality]);
    return result.rows[0];
  }
};
