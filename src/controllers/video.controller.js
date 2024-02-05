import mongoose, {isValidObjectId} from "mongoose";
import {Video} from '../models/video.model.js'
import {User} from '../models/user.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {uploadOnCloudinary} from '../utils/cloudinary.js'

const getlAllVideos = asyncHandler(async (req, res)=>{
    const {page = 1, limit = 1, query, sortBy, sortType, userId} = req.query
})

const publishAVideo = asyncHandler(async (req, res)=>{
    const {title, description} = req.body
})

const getVideoById = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
})

const updateVideo = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
})

const deleteVideo = asyncHandler(async (req, res)=>{
    const {videoId} = req.params
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