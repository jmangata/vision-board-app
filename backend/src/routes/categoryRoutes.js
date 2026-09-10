// Routes des catégories (CRUD du référentiel commun).
// Montées sur /api/categories dans index.js. Non protégées par
// authenticate : la liste doit être accessible dès la création de compte.
 import { Router } from 'express';
import { getAll, getOne, create, update, remove } from '../controllers/categoryController.js';

const router = Router();

router.get('/', getAll);          // Liste toutes les catégories
router.get('/:id', getOne);       // Détail d'une catégorie
router.post('/', create);         // Création
router.put('/:id', update);       // Modification
router.delete('/:id', remove);    // Suppression

export default router;
