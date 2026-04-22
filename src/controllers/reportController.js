import { BookModel } from '../models/bookModel.js';
import { AuthorModel } from '../models/authorModel.js';
import { CategoryModel } from '../models/categoryModel.js';
import { LoanModel } from '../models/loanModel.js';
import { pool } from '../config/db.js';

export const ReportController = {
  async getStats(req, res) {
    try {
      const books = await pool.query('SELECT COUNT(*) FROM books');
      const authors = await pool.query('SELECT COUNT(*) FROM authors');
      const categories = await pool.query('SELECT COUNT(*) FROM categories');
      const borrowedCount = await LoanModel.getBorrowedCount();

      res.json({
        total_books: parseInt(books.rows[0].count),
        total_authors: parseInt(authors.rows[0].count),
        total_categories: parseInt(categories.rows[0].count),
        total_borrowed: borrowedCount
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
