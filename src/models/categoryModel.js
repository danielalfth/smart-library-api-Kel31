import { pool } from '../config/db.js';

export const CategoryModel = {
  async getAll() {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  },

  async create(name) {
    const query = 'INSERT INTO categories (name) VALUES ($1) RETURNING *';
    const result = await pool.query(query, [name]);
    return result.rows[0];
  },

  async update(id, name) {
    const query = 'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *';
    const result = await pool.query(query, [name, id]);
    return result.rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM categories WHERE id = $1';
    await pool.query(query, [id]);
    return { message: 'Category berhasil dihapus.' };
  },

  async searchByName(name) {
    const query = 'SELECT * FROM categories WHERE name ILIKE $1 ORDER BY name ASC';
    const result = await pool.query(query, [`%${name}%`]);
    return result.rows;
  }
};