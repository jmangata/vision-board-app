import { prisma } from '../prisma.js';

// GET /api/categories — Liste toutes les catégories
export const getAll = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/categories/:id — Une catégorie
export const getOne = async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/categories — Créer une catégorie
export const create = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    if (!name || !color || !icon) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const category = await prisma.category.create({
      data: { name, color, icon },
    });
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Category name already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/categories/:id — Modifier une catégorie
export const update = async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { name, color, icon },
    });
    res.json(category);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/categories/:id — Supprimer une catégorie
export const remove = async (req, res) => {
  try {
    await prisma.category.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.status(500).json({ message: err.message });
  }
};