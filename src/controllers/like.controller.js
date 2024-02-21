import mongoose, {isValidObjectId} from "mongoose";
import {Like} from '../models/like.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js'

const toggleVideoLike = asyncHandler(async(req, res)=>{
    const {videoId} = req.params
    if (!videoId){
        throw new ApiError(404, "video id is missing")
    }
    
    try {
        // check if the user has already liked the video and if so, dislike it
        const like = await Like.findOneAndDelete({video: videoId, likedBy: req.user._id})
        if (like){
            return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "Video dislike is successfull"
            ))
        }
    } catch (error) {
        throw new ApiError(500, "something went wrong while toggling video like")
    }
    // create new like
    const newLike = await Like.create({
        video: videoId,
        likedBy: req.user._id
    })
    if (!newLike){
        throw new ApiError(500, "something went wrong while liking the video")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        newLike,
        "Video like is successfull"
    ))
})

const toggleCommentLike = asyncHandler(async(req, res)=>{
    const {commentId} = req.params
    if (!commentId){
        throw new ApiError(404, "comment id is missing")
    }
    try {
        // find the comment like and delete it
        const commentLike = await Like.findOneAndDelete({comment: commentId, likedBy: req.user._id})
        
        if (commentLike){
            return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "Comment dislike is successfull"
            ))
        }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while toggling comment like")
    }

    
    const likeIt = await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })
    if (!likeIt){
        throw new ApiError(500, "something went wrong while liking the comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        likeIt,
        "comment like is successfull"
    ))
})


const toggleTweetLike = asyncHandler(async(req, res)=>{
    const {tweetId} = req.params
    if (!tweetId){
        throw new ApiError(404, "tweet id is missing")
    }
    try {
        // find the tweet like and delete it
        const tweetLike = await Like.findOneAndDelete({tweet: tweetId, likedBy: req.user._id})
        
        if (tweetLike){
            return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "tweet dislike is successfull"
            ))
        }
    } catch (error) {
        throw new ApiError(500, "something went wrong while toggling the tweet like")
    }

    
    const newLike = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })
    if (!newLike){
        throw new ApiError(500, "something went wrong while liking the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        newLike,
        "tweet like is successfull"
    ))

})

const getLikedVideos = asyncHandler(async(req, res)=>{
    const {page = 1, limit = 10} = req.query
    const skip = (Number(page) - 1) * Number(limit)
    const aggregationPipeline = [
        {
          $match: {
            likedBy: new mongoose.Types.ObjectId(req.user._id),
            video: {$exists: true}
          }
        },
        {
          $project: {
            video: 1,
            _id: 0
          }
        },
        {
            $skip: skip
        },
        {
            $limit: Number(limit)
        },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "video"
          }
        },
        {
          $addFields: {
            video: {$first: "$video"}
          }
        }
      ]
    try {
        const results = await Like.aggregate(aggregationPipeline)
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            results,
            "liked vidoes has beed fetched successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "something went wrong while fetching liked videos")
    }
    
})


export {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideos
}