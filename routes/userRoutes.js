import express from 'express'
import multer from 'multer';
import { register, logout, authenticate, listUsers, updateUser,deleteUser, listRoles } from '../controllers/UserController.js'

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router()

router.post('/create-user',upload.single('file'),register)
router.post('/logout-user', logout)
router.post('/authenticate-user',authenticate)
router.get('/list-users', listUsers)
router.get('/list-roles', listRoles)
router.put('/update-user/:userId',upload.single('file'),updateUser)
router.delete('/delete-user/:userId', deleteUser)

export default router;