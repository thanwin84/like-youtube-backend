import mongoose, {isValidObjectId} from "mongoose";
import {Subscription} from '../models/subscription.model.js'
import {User} from '../models/user.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js'



const toggleSubscription = asyncHandler(async (req, res)=>{
    
    const {channelId} = req.params
    // todo: toggle subscription
    if (!channelId){
        throw new ApiError(400, `channelId is missing`)
    }
    const channelExist = await User.findById(channelId)
    if (!channelExist){
        throw new ApiError(404, "channel id is not found")
    }
    
    try {
        // check user if it's in the subscriptions
        const user = await Subscription.findOne({
            subscriber: req.user._id,
            channel: channelId
        })
        
        let message;
        let newSubscriber;
        if (!user){
            // since user does not exist in subscription list, subscribe to current channel
            newSubscriber = await Subscription.create({
                subscriber: req.user._id,
                channel: channelId
            })
            if (newSubscriber){
                message = "User has been subscribed successfully"
            }
        }
        else {
            // unsubscribe
            const response = await Subscription.deleteOne({subscriber: req.user._id})
            
            if (response?.deletedCount > 0){
                message = "User has been unsubscribed successfully"
            }
        }
        return res
            .status(200)
            .json(new ApiResponse(
                200,
                newSubscriber || "",
                message
            ))

    } catch (error) {
        // console.log(error)
        throw new ApiError(500, "Something went wrong while subscribing or unscribig")
    }
    

    
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res)=>{
    const {channelId} = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    if (!channelId){
        throw new ApiError(400, `channelId is missing`)
    }
    const channelExist = await User.findById(channelId)
    if (!channelExist){
        throw new ApiError(404, "channel id is not found")
    }
    try {
        const subscribers = await Subscription.aggregate(
            [
                // filter based on channel
                {
                  $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                  }
                },
                {
                  $project: {
                    channel: 1,
                    subscriber: 1
                  }
                },
                {
                  $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscriberDetails",
                    pipeline: [
                      {
                        $project: {
                          _id: 0,
                          username: 1,
                          email: 1,
                          avatar: 1
                        }
                      }
                    ]
                  }
                },
                {
                  $addFields: {
                    subscriberDetails: {
                      $first: "$subscriberDetails",
                    }
                  }
                },
                {$skip: skip},
                {$limit: limit}
              ]
        )

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            subscribers,
            "Subcribers list has been fetched successfully"
        ))
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching")
    }
    
})

//// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res)=>{
    // const {subscriberId} = req.params
    const userId = req.user?._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    if (!userId){
        throw new ApiError(400, "User id is required")
    }
    try {
        const data = await Subscription.aggregate(
            [
                {
                  $match: {
                    subscriber: new mongoose.Types.ObjectId(userId)
                  }
                },
                {
                  $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "subscribedToOther",
                    pipeline: [
                      {
                        $project: {
                          _id: 0,
                          username: 1,
                          email: 1,
                          fullName: 1,
                          avatar: 1
                          
                          
                        }
                      }
                    ]
                  }
                },
                {
                  $addFields: {
                    subscribedToOther: {
                      $first: "$subscribedToOther"
                    }
                  }
                },
                {
                  $project: {
                    channel: 0
                  }
                },
                {$skip: skip},
                {$limit: limit}
              ]
        )

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            data,
            "List of channel that a user is subscribed to is fetched successfully "
        ))

    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching data", [error])
    }
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}