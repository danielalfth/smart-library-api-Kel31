import { pool } from '../config/db.js';

export const LoanModel = {
  async createLoan(book_id, member_id, due_date) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Cek ketersediaan buku
      const bookCheck = await client.query('SELECT available_copies FROM books WHERE id = $1', [book_id]);
      if (bookCheck.rows[0].available_copies <= 0) {
        throw new Error('Buku sedang tidak tersedia (stok habis).');
      }

      // 2. Kurangi stok buku
      await client.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);

      // 3. Catat transaksi peminjaman
      const loanQuery = `
        INSERT INTO loans (book_id, member_id, due_date)
        VALUES ($1, $2, $3) RETURNING *
      `;
      const result = await client.query(loanQuery, [book_id, member_id, due_date]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getAllLoans() {
    const query = `
      SELECT l.*, b.title as book_title, m.full_name as member_name
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
    `;
    const result = await pool.query(query);
    return result.rows;
  },

  async getById(id) {
    const query = `
      SELECT l.*, b.title as book_title, m.full_name as member_name
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  },

  async returnBook(loan_id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Cek apakah loan ada dan status masih BORROWED
      const loanCheck = await client.query('SELECT * FROM loans WHERE id = $1', [loan_id]);
      if (loanCheck.rows.length === 0) {
        throw new Error('Transaksi peminjaman tidak ditemukan.');
      }
      const loan = loanCheck.rows[0];
      if (loan.status !== 'BORROWED') {
        throw new Error('Buku sudah dikembalikan atau status tidak valid.');
      }

      // 2. Update status loan menjadi RETURNED dan isi return_date
      const updateLoan = `
        UPDATE loans
        SET status = 'RETURNED', return_date = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await client.query(updateLoan, [loan_id]);

      // 3. Tambahkan kembali available_copies pada books
      await client.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [loan.book_id]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getBorrowedCount() {
    const query = "SELECT COUNT(*) as count FROM loans WHERE status = 'BORROWED'";
    const result = await pool.query(query);
    return parseInt(result.rows[0].count);
  },

  async getTopBorrowers() {
    const query = `
      SELECT
        m.id,
        m.full_name,
        m.email,
        m.member_type,
        m.joined_at,
        COUNT(l.id) as total_loans,
        (SELECT b.title
         FROM loans l2
         JOIN books b ON l2.book_id = b.id
         WHERE l2.member_id = m.id
         GROUP BY b.title
         ORDER BY COUNT(*) DESC, MAX(l2.loan_date) DESC
         LIMIT 1) as favorite_book,
        (SELECT COUNT(*)
         FROM loans l3
         JOIN books b ON l3.book_id = b.id
         WHERE l3.member_id = m.id AND b.title = (
           SELECT b2.title
           FROM loans l4
           JOIN books b2 ON l4.book_id = b2.id
           WHERE l4.member_id = m.id
           GROUP BY b2.title
           ORDER BY COUNT(*) DESC, MAX(l4.loan_date) DESC
           LIMIT 1
         )) as times_borrowed,
        MAX(l.loan_date) as last_loan
      FROM members m
      JOIN loans l ON m.id = l.member_id
      GROUP BY m.id
      ORDER BY COUNT(l.id) DESC, MAX(l.loan_date) DESC
      LIMIT 3
    `;
    const result = await pool.query(query);
    return result.rows;
  }
};