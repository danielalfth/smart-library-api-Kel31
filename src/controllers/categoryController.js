import { CategoryModel } from '../models/categoryModel.js';

export const CategoryController = {
  async getCategories(req, res) {
    try {
      const { name } = req.query;
      let categories;

      if (name && name.trim() !== '') {
        categories = await CategoryModel.searchByName(name);
      } else {
        categories = await CategoryModel.getAll();
      }

      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getCategoryById(req, res) {
    try {
      const category = await CategoryModel.getById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: 'Category tidak ditemukan.' });
      }
      res.json(category);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async addCategory(req, res) {
    try {
      const category = await CategoryModel.create(req.body.name);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async updateCategory(req, res) {
    try {
      const { name } = req.body;
      const category = await CategoryModel.update(req.params.id, name);
      if (!category) {
        return res.status(404).json({ error: 'Category tidak ditemukan.' });
      }
      res.json(category);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async deleteCategory(req, res) {
    try {
      const result = await CategoryModel.delete(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};