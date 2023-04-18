import express from 'express';
import AppController from '../controllers/AppControllers';
import UserController from '../controllers/UserController';

const router = express.Router();

router.get('/status', AppController.getStatus);

router.get('/stats', AppController.getStats);

router.use(express.json());
router.post('/users', UserController.postNew);

export default router;
