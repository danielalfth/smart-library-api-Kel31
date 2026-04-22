import { pool } from '../config/db.js';

export const BookModel = {
  async getAll() {
    const query = `
      SELECT b.*, a.name as author_name, c.name as category_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.title ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getById(id) {
    const query = `
      SELECT b.*, a.name as author_name, c.name as category_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async create(data) {
    const { isbn, title, author_id, category_id, total_copies } = data;
    const query = `
      INSERT INTO books (isbn, title, author_id, category_id, total_copies, available_copies)
      VALUES ($1, $2, $3, $4, $5, $5) RETURNING *
    `;
    const result = await pool.query(query, [isbn, title, author_id, category_id, total_copies]);
    return result.rows[0];
  },

  async update(id, data) {
    const { isbn, title, author_id, category_id, total_copies } = data;
    const query = `
      UPDATE books
      SET isbn = $1, title = $2, author_id = $3, category_id = $4, total_copies = $5
      WHERE id = $6
      RETURNING *
    `;
    const result = await pool.query(query, [isbn, title, author_id, category_id, total_copies, id]);
    return result.rows[0];
  },

  async delete(id) {
    const query = 'DELETE FROM books WHERE id = $1';
    await pool.query(query, [id]);
    return { message: 'Buku berhasil dihapus dari sistem.' };
  },

  async searchByTitle(title) {
    const query = `
      SELECT b.*, a.name as author_name, c.name as category_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.title ILIKE $1
      ORDER BY b.title ASC
    `;
    const result = await pool.query(query, [`%${title}%`]);
    return result.rows;
  }
};