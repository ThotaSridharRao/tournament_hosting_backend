// src/routes/user.routes.js

import { Router } from 'express';
import {
    getAllUsers,
    updateUserRole,
    deleteUser
} from '../controllers/user.controller.js';
import { verifyJWT, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Apply admin protection to all routes in this file
router.use(verifyJWT, isAdmin);

router.route("/").get(getAllUsers);
router.route("/:userId").delete(deleteUser);
router.route("/:userId/role").patch(updateUserRole);

export default router;