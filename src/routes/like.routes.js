import { Router } from "express";
import verifyJWT from '../middlewares/auth.middleware.js'
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from '../controllers/like.controller.js'

const router = Router()

router.use(verifyJWT)

router.route('/toggle/videos/:videoId').post(toggleVideoLike)
router.route('/toggle/comments/:commentId').post(toggleCommentLike)
router.route('/toggle/tweets/:tweetId').post(toggleTweetLike)

router.route('/videos').get(getLikedVideos) 

export default router;