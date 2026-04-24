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
      WITH borrower_stats AS (
        SELECT
          m.id as member_id,
          COUNT(l.id) as total_loans,
          MAX(l.loan_date) as last_loan_date
        FROM members m
        JOIN loans l ON m.id = l.member_id
        GROUP BY m.id
      ),
      favorite_books AS (
        SELECT
          l.member_id,
          b.title as book_title,
          COUNT(*) as borrow_count,
          ROW_NUMBER() OVER (PARTITION BY l.member_id ORDER BY COUNT(*) DESC, MAX(l.loan_date) DESC) as rn
        FROM loans l
        JOIN books b ON l.book_id = b.id
        GROUP BY l.member_id, b.title
      )
      SELECT
        m.id,
        m.full_name,
        m.email,
        m.member_type,
        m.joined_at,
        bs.total_loans,
        fb.book_title as favorite_book,
        bs.last_loan_date as last_loan
      FROM members m
      JOIN borrower_stats bs ON m.id = bs.member_id
      JOIN favorite_books fb ON m.id = fb.member_id AND fb.rn = 1
      ORDER BY bs.total_loans DESC, bs.last_loan_date DESC
      LIMIT 3
    `;
    const result = await pool.query(query);
    return result.rows;
  }
};