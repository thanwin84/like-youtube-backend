import mongoose, {isValidObjectId} from "mongoose";
import {User} from '../models/user.model.js'
import {Video} from '../models/video.model.js'
import {Comment} from '../models/comment.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js'

const getVideoComments = asyncHandler(async (req, res)=>{
    // get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    const skip = (Number(page) - 1) * Number(limit)
    if (!videoId){
        throw new ApiError(400, "vidioId is missing")
    }
    const aggregationPipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: skip
        },
        {
            $limit: Number(limit)
        }
    ]
    const comments = await Comment.aggregate(aggregationPipeline)
    if (!comments){
        throw new ApiError(500, "Something went wrong while fetching comments")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        comments,
        "comments are fetched successfully"
    ))
})

const addComment = asyncHandler(async (req, res)=>{
    // add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    if (!content){
        throw new ApiError(400, "Content is required")
    }
    if (!videoId){
        throw new ApiError(400, "VideoId is missing")
    }
    const video = await Video.findById(videoId)
    if (!video){
        throw new ApiError(404, "video does not exists")
    }
    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    if (!comment){
        throw new ApiError(500, "Something went wrong while creating comment")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        comment,
        "comment has been made successfully"
    ))

})

const updateComment = asyncHandler(async (req, res)=>{
    // update comment
    const {commentId} = req.params
    const {content} = req.body

    if (!commentId){
        throw new ApiError(400, "comment id is required")
    }
    if (!content){
        throw new ApiError(400, "content is missing")
    }
    const comment = await Comment.findById(commentId)
    if (!comment){
        throw new ApiError(404, "comment does not exist")
    }
    const ownerId = new mongoose.Types.ObjectId(comment.owner)
    const userId = new mongoose.Types.ObjectId(req.user._id)
    
    // ensuring that only owner of this comment can update
    if (!ownerId.equals(userId)){
        throw new ApiError(401, "user is not allowed to edit comment")
    }
    comment.content = content
    comment.save()

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        comment,
        "comment has been updated"
    ))


})

const deleteComment = asyncHandler(async (req, res)=>{
    // get all comments for a video
    const {commentId} = req.params
    if (!commentId){
        throw new ApiError(400, "comment id is required")
    }
    const result = await Comment.deleteOne({
        _id: commentId,
        owner: req.user._id
    })

    if (result.deletedCount === 0){
        throw new ApiError(404, "this comment does not exist or this comment does not belong to this user")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "comment has been deleted successfully"
    ))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment

}