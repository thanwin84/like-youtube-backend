import mongoose, {isValidObjectId} from "mongoose";
import {Video} from '../models/video.model.js'
import {User} from '../models/user.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary, deleteAsset} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";

const publishAVideo = asyncHandler(async (req, res)=>{
    const {title, description} = req.body
    if (!title){
        throw new ApiError(400, `title and owner is required`)
    }
    const  localVideoPath = req.files?.videoFile?.[0]?.path
    const localThumbnailPath = req.files?.thumbnail?.[0]?.path

    
    if (!localVideoPath){
        throw new ApiError(400, "Video file is missing")
    }
    if (!localThumbnailPath){
        throw new ApiError(400, "thumbnail file is missing")
    }
    
    const video = await uploadOnCloudinary(localVideoPath)
    const thumbnail = await uploadOnCloudinary(localThumbnailPath)

    if (!video){
        throw new ApiError(500, "Something went wrong while uploading video")
    }
    if (!thumbnail){
        throw new ApiError(500, "Something went wrong while uploading thumbnail")
    }
    
    try {
        const data = await Video.create({
            title,
            description: description ? description: "",
            videoFile: [video.url, video.public_id],
            thumbnail: [thumbnail.url, thumbnail.public_id],
            owner: req.user._id,
            duration: video.duration
    
        })
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            data,
            "Video is uploaded successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while creating video document")
    }
    
})


const getlAllVideos = asyncHandler(async (req, res)=>{
    const {page = 1, limit = 10, sortBy, sortType, userId, ...query} = req.query
    const skip = (Number(page) -1) * Number(limit)
    
    if (!userId) {
        throw new ApiError(400, "User id is required")
    }
    const aggregationPipeline = [
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId),
                ...query
            }
        },
        {
            $skip: skip
        },
        {
            $limit: Number(limit)
        }
    ]
   
    const data = await Video.aggregate(aggregationPipeline)
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        data
    ))
})


const getVideoById = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
    if (!videoId){
        throw new ApiError(400, "videoId is required")
    }
    const video = await Video.findById(videoId)
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            video,
            "Video has been fetched successfully"
    ))
})

const updateVideo = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
    
})

const deleteVideo = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
    if (!videoId){
        throw new ApiError(400, "videoId is required")
    }
    
    const video = await Video.findByIdAndDelete(videoId)
    if (!video){
        throw new ApiError(500, "something went wrong while deleting video")
        
    }
    try {
        await deleteAsset(video.videoFile[1])
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Video has been deleted successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while deleting video")
    }
    
   
})

const togglePublishStatus = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
})

export {
    getVideoById,
    getlAllVideos,
    publishAVideo,
    updateVideo,
    deleteVideo,
    togglePublishStatus
    
}