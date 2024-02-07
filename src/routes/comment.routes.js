import { Router } from "express";
import verifyJWT from '../middlewares/auth.middleware.js'
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
} from '../controllers/comment.controller.js'

const router = Router()

router.use(verifyJWT)

router.route("/:videoId")
.post(addComment)
.get(getVideoComments)

router.route('/update-comment/:commentId')
.patch(updateComment)

router.route('/delete-comment/:commentId')
.delete(deleteComment)
export default router;