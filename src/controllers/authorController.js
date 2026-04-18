import { AuthorModel } from '../models/authorModel.js';

export const AuthorController = {
  async getAuthors(req, res) {
    try {
      const authors = await AuthorModel.getAll();
      res.json(authors);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async addAuthor(req, res) {
    try {
      const { name, nationality } = req.body;
      if (!name || !nationality) {
        return res.status(400).json({ error: 'name and nationality are required' });
      }
      const author = await AuthorModel.create(name, nationality);
      res.status(201).json(author);
    } catch (err) {
      console.error('Error adding author:', err);
      res.status(500).json({ error: err.message });
    }
  }
};
