import { LoanModel } from '../models/loanModel.js';

export const LoanController = {
  async createLoan(req, res) {
    const { book_id, member_id, due_date } = req.body;
    try {
      const loan = await LoanModel.createLoan(book_id, member_id, due_date);
      res.status(201).json({
        message: 'Peminjaman berhasil dicatat!',
        data: loan
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getLoans(req, res) {
    try {
      const loans = await LoanModel.getAllLoans();
      res.json(loans);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getLoanById(req, res) {
    try {
      const loan = await LoanModel.getById(req.params.id);
      if (!loan) {
        return res.status(404).json({ error: 'Transaksi tidak ditemukan.' });
      }
      res.json(loan);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async returnBook(req, res) {
    try {
      const loan = await LoanModel.returnBook(req.params.id);
      res.json({
        message: 'Pengembalian buku berhasil!',
        data: loan
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async getTopBorrowers(req, res) {
    try {
      const borrowers = await LoanModel.getTopBorrowers();

      const formattedData = borrowers.map(b => ({
        member_id: b.id,
        full_name: b.full_name,
        email: b.email,
        member_type: b.member_type,
        total_loans: parseInt(b.total_loans),
        last_loan_date: b.last_loan,
        favorite_book: {
          title: b.favorite_book,
          times_borrowed: parseInt(b.times_borrowed)
        }
      }));

      res.json({
        message: "top 3 peminjaman buku berhasil diambil",
        data: formattedData
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};