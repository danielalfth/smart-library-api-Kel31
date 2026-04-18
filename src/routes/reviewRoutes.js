import express from 'express';
import { ReviewController } from '../controllers/reviewController.js';

const router = express.Router();

// GET /api/reviews
router.get('/', ReviewController.getAllReviews);

// GET /api/reviews/book/:book_id
router.get('/book/:book_id', ReviewController.getReviewsByBook);

// POST /api/reviews
router.post('/', ReviewController.createReview);

export default router;
