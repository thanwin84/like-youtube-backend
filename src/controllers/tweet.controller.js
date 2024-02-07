import mongoose, {isValidObjectId} from "mongoose";
import {User} from '../models/user.model.js'
import {Tweet} from '../models/tweet.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js'

const createTweet = asyncHandler(async (req, res)=>{
    const {content} = req.body
    
    if (!content){
        throw new ApiError(400, "content is required")
    }
    const tweet = await Tweet.create({
        owner: req.user._id,
        content
    })
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweet,
        "A tweet has been created successfully"
    ))
})

const getUserTweets = asyncHandler(async (req, res)=>{
    const {userId} = req.params
    const {page=1, limit=10} = req.query
    const skip = (Number(page) - 1) * Number(limit) 

    if (!userId){
        throw new ApiError(400, "userId is required")
    }
    // validate if user exists
    const user = await User.findById(userId)
    if (!user){
        throw new ApiError(404, "user does not exist with this Id")
    }
    const aggregationPipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $skip: skip
        },
        {
            $limit: limit
        }
    ]
    const tweets = await Tweet.aggregate(aggregationPipeline)

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweets,
        "tweets are fetched successfully"
    ))

})

const updateTweet = asyncHandler(async (req, res)=>{
    const {tweetId} = req.params
    const {content} = req.body
    if (!tweetId){
        throw new ApiError(400, "TweetId is required")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet){
        throw new ApiError(404, "Tweet is not found")
    }
    tweet.content = content
    tweet.save()
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        tweet,
        "Tweet has been updated successfuly"
    ))

})

const deleteTweet = asyncHandler(async (req, res)=>{
    const {tweetId} = req.params
    if (!tweetId){
        throw new ApiError(400, "tweetId is missing")
    }
    const result = await Tweet.findByIdAndDelete(tweetId)
    if (!result){
        throw new ApiError(500, "something went wrong while deleting tweet")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "tweet has been deleted successfully"
    ))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}