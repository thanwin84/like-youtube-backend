import { Router } from "express";
import {upload} from '../middlewares/multer.middleware.js'
import verifyJWT from '../middlewares/auth.middleware.js'
import {
    publishAVideo,
    getlAllVideos,
    getVideoById,
    deleteVideo
} from '../controllers/video.controller.js'
const router = Router()

router.use(verifyJWT)


router.route('/')
.get(getlAllVideos)
.post(upload.fields(
    [
        {name: "videoFile", maxCount: 1}, 
        {name: "thumbnail", maxCount: 1}
    ]
    ),publishAVideo)

    

router.route('/:videoId')
.get(getVideoById)
.delete(deleteVideo)

export default router