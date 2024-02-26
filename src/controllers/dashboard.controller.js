import mongoose, {isValidObjectId} from "mongoose";
import {User} from '../models/user.model.js'
import {Video} from "../models/video.model.js"
import {Tweet} from "../models/tweet.model.js"
import {Subscription} from '../models/subscription.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js'

const getChannelStats = asyncHandler(async (req, res) =>{
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const viewsPipeline = [
        {
          $unwind: {
            path: "$watchHistory",
          },
        },
        {
          $match: {
            $expr: {
              $eq: ["$watchHistory.ownerId", new mongoose.Types.ObjectId(req.user._id)]
            }
          }
        },
        {
          $count: "count"
        }
    ]

    const subscriberPipeline = [
        {
          $match: {
            channel: new mongoose.Types.ObjectId(req.user._id),
          },
        },
        {
          $count: "count"
        }
    ]
    
    const videoCountPineline = [
        {
          $match: {
            owner: new mongoose.Types.ObjectId(req.user._id)
          }
        },
        {
          $count: "count"
        }
    ]

    const videoLikesPipeline = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user._id)
        },
      },
      {
        $project: {
          _id: 1,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "results",
        },
      },
      {
        $count: "videoLikes",
      },
    ]

    const totalTweetLikesPipeline = [
      {
        $match: {
          owner: new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $project: {
          _id: 1
        }
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "tweet",
          as: "totalTweetLikes"
        }
      },
      {
        $unwind: {
          path: "$totalTweetLikes"
          
        }
      },
      {
        $count: "count"
      }
    ]

    const result = {}
    try {
        const totalViews = await User.aggregate(viewsPipeline)
        result.views = totalViews.length ? totalViews[0].count : 0
        const totalSubsribers = await Subscription.aggregate(subscriberPipeline)
        
        result.subscribers = totalSubsribers.length ? totalSubsribers[0].count : 0
        const totalVideoCount = await Video.aggregate(videoCountPineline)
        
        result.videos = totalVideoCount.length ? totalVideoCount[0].count: 0
        const videoLikes = await Video.aggregate(videoLikesPipeline)
        result.videoLikes = videoLikes.length ? videoLikes[0].videoLikes: 0
        const totalTweetLikes = await Tweet.aggregate(totalTweetLikesPipeline)
        result.totalTweetLikes = totalTweetLikes.length ? totalTweetLikes[0].count: 0

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            result,
            "dashboard details have been fetched successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "something went wrong while fetching data")
    }
})

const getChannelVideos = asyncHandler(async (req, res)=>{
    // TODO: Get all the videos uploaded by the channel
    const {page = 1, limit = 10} = req.query
    const skips = (Number(page) - 1) * Number(limit)
    const aggregationPipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user._id)
            }
             
        },
        {
            $skip: skips
        },
        {
            $limit: Number(limit)
        }
    ]

    try {
        const result = await Video.aggregate(aggregationPipeline)
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            result,
            "channel video has been fetched successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching videos")
    }
})

export {
    getChannelStats,
    getChannelVideos
}