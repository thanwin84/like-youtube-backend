import { Router } from "express";
import verifyJWT from '../middlewares/auth.middleware.js'
import {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getUserPlaylists
} from '../controllers/playlist.controller.js'
const router = Router()
router.use(verifyJWT)

router.route('/').post(createPlaylist)
router.route('/:playlistId')
export default router;