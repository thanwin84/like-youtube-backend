import { Router } from "express";
import verifyJWT from '../middlewares/auth.middleware.js'
import {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getUserPlaylists,
    getPlaylistById
} from '../controllers/playlist.controller.js'
const router = Router()
router.use(verifyJWT)

router.route('/')
.post(createPlaylist)


router.route('/users/:userId').get(getUserPlaylists)

router.route('/:playlistId/:videoId')
.patch(addVideoToPlaylist)

router.route("/:playlistId")
.delete(deletePlaylist)
.get(getPlaylistById)
.patch(updatePlaylist)

router.route('/remove/:playlistId/:videoId').patch(removeVideoFromPlaylist)

export default router; 