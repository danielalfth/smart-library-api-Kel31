import { ReviewModel } from '../models/reviewModel.js';

export const ReviewController = {
  async getAllReviews(req, res) {
    try {
      const reviews = await ReviewModel.getAll();
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getReviewsByBook(req, res) {
    try {
      const reviews = await ReviewModel.getByBookId(req.params.book_id);
      res.json(reviews);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async createReview(req, res) {
    try {
      const newReview = await ReviewModel.create(req.body);
      res.status(201).json({
        message: "Review berhasil ditambahkan!",
        data: newReview
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};
