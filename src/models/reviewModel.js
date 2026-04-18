import { pool } from '../config/db.js';

export const ReviewModel = {
  // Membuat tabel reviews jika belum ada
  async initTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
  },

  // Mengambil semua review dengan nama buku dan member
  async getAll() {
    const query = `
      SELECT r.*, b.title as book_title, m.full_name as member_name 
      FROM reviews r
      JOIN books b ON r.book_id = b.id
      JOIN members m ON r.member_id = m.id
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  // Mengambil review berdasarkan book_id
  async getByBookId(book_id) {
    const query = `
      SELECT r.*, m.full_name as member_name 
      FROM reviews r
      JOIN members m ON r.member_id = m.id
      WHERE r.book_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [book_id]);
    return result.rows;
  },

  // Membuat review baru
  async create(data) {
    const { book_id, member_id, rating, comment } = data;
    const query = `
      INSERT INTO reviews (book_id, member_id, rating, comment)
      VALUES ($1, $2, $3, $4) RETURNING *
    `;
    const result = await pool.query(query, [book_id, member_id, rating, comment]);
    return result.rows[0];
  },

  // Menghapus review
  async delete(id) {
    const query = 'DELETE FROM reviews WHERE id = $1';
    await pool.query(query, [id]);
    return { message: "Review berhasil dihapus." };
  }
};
