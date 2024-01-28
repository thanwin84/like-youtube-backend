import { Router } from "express";
import { 
    registerUser, 
    loginUser,
    logoutUser,
    refreshAccessToken,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    changeCurrentPassword,
    getCurrentUser,
    getChannelProfile,
    getWatchHistory
 } from "../controllers/user.controller.js";

import {upload} from '../middlewares/multer.middleware.js'
import verifyJWT from '../middlewares/auth.middleware.js'

const router = Router()

router.route("/register").post(
        upload.fields([
            {
                name: "avatar",
                maxCount: 1
            },
            {
                name: "coverImage",
                maxCount: 1
            }
        ]),
        registerUser
)

router.route("/login").post(loginUser)

//secured routes
router.route('/logout').post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken)

router.route('/update-account-details').patch(verifyJWT, updateAccountDetails)
router.route('/update-avatar').patch(upload.single('avatar'), verifyJWT, updateAvatar)
router.route('/update-cover-image').patch(upload.single('coverImage'), verifyJWT, updateCoverImage)
router.route('/change-password').patch(verifyJWT, changeCurrentPassword)

router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/user-channel-profile/:username').get(verifyJWT, getChannelProfile)
router.route('/user-watch-history').get(verifyJWT, getWatchHistory)

export default router