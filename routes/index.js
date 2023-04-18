import express from 'express';
import AppController from '../controllers/AppControllers';
import UserController from '../controllers/UserController';
import AuthController from '../controllers/AuthController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);
router.get('/users/me', UserController.getMe);

router.use(express.json());
router.post('/users', UserController.postNew);

export default router;
