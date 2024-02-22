import mongoose, {isValidObjectId} from "mongoose";
import {User} from '../models/user.model.js'
import {Playlist} from '../models/playlist.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js'

const createPlaylist = asyncHandler(async (req, res)=>{
    const {name, description} = req.body
    if (!name){
        throw new ApiError(404, "you must provide playlist name")
    }
    const playlist = await Playlist.findOne({name})
    // playlist already exists
    if (playlist){
        throw new ApiError(404, `playlist  already exists`)
    }
    
    try {
        const newPlaylist = await Playlist.create({
            name: name,
            description: description ? description: "",
            owner: req.user._id
        })
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            newPlaylist,
            "playlsist has been created successfully"
        ))
    } catch (error) {
        throw new ApiError(500, "something went wrong while creating playlist")
    }

})

const getUserPlaylists = asyncHandler(async (req, res)=>{
    const {userId} = req.params
    const {page = 1, limit = 10} = req.query
    const skips = (Number(page) - 1) * Number(limit)
    if (!userId){
        throw new ApiError(400, "user id is missing")
    }
    const aggregationPipeline = [
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId)
          }
        },
        {
            $skip: skips
        },
        {
            $limit: Number(limit)
        },
        {
          $project: {
            name: 1
          }
        }
    ]
    try {
        const results = await Playlist.aggregate(aggregationPipeline)
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            results,
            "playlist has been fetched"
        ))
    } catch (error) {
        console.log(error)
        throw new ApiError(500, "something went wrong while fetching playlists")
    }


})

const addVideoToPlaylist = asyncHandler(async (req, res)=>{
    const {playlistId, videoId} = req.params
    if (!playlistId){
        throw new ApiError(400, "Playlist Id is missing")
    }
    if (!videoId){
        throw new ApiError(400, "videoId is missing")
    }
    const videoExists = await Playlist.findOne({_id: playlistId, videos: {$in: videoId}})
    // video already exist in the playlist
    if (videoExists){
        throw new ApiError(400, "video already exists in the playlist")
    }
    try {
        const addedVideo = await Playlist.findOneAndUpdate(
            {_id: playlistId, videos: {$not: {$in: videoId}}}, 
            {$addToSet: {videos: videoId}}, 
            {new: true}
        )
        
        //playlist does not exists
        if (!addedVideo){
            throw new ApiError(404, "playlist does not exists")
        }
        
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            addedVideo,
            "video has been added successfully"
        ))
    } catch (error) {
        if (error instanceof ApiError){
            throw error
        }
        else {
            throw new ApiError(500, "something went wrong while adding the video to playlist")
        }
    }

})

const removeVideoFromPlaylist = asyncHandler(async (req, res)=>{
    const {playlistId, videoId} = req.params
    if (!playlistId){
        throw new ApiError(400, "playlist Id is missing")
    }
    if (!videoId){
        throw new ApiError(400, "videoId is missing")
    }
    try {
        const deletedVideo = await Playlist.findOneAndUpdate(
            {
                _id: playlistId
            },
            {
                $pull: {videos: videoId}
            }
        )
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "video has been deleted from the playlist"
        ))
    } catch (error) {
        throw new ApiError(500, "something went wrong while removing video from playlist")
    }

})

const deletePlaylist = asyncHandler(async (req, res)=>{
    const {playlistId} = req.params
    if (!playlistId){
        throw new ApiError(400, "playlist Id is missing")
    }
    try {
        const deleted = await Playlist.findOneAndDelete({_id: playlistId})
        if (!deleted){
            throw new ApiError(404, "playlist does not exist")
        }
        return res
        .status(200)
        .json(new ApiError(
            200,
            {},
            "Playlist has been deleted"
        ))
    } catch (error) {
        if (error instanceof ApiError){
            throw error
        }
        else {
            throw new ApiError("something went wrong while deleting playlist")
        }
    }
})

const updatePlaylist = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params
    const {name, description} = req.body
    if (!playlistId){
        throw new ApiError(400, "playlist Id is missing")
    }
    try {
        const updateObject = {
            name,
        }
        if (description){
            updateObject.description = description
        }
        const result = await Playlist.findOneAndUpdate(
            {_id: playlistId},
            {$set: updateObject},
            {new: true}
        )
        if (!result){
            throw new ApiError(404, "playlist does not exist")
        }
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            result,
            "playlist has been updated"
        ))
    } catch (error) {
        
        throw new ApiError(500, "something went wrong while updateing plalist")
    }


})

const getPlaylistById = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params
    if (!playlistId){
        throw new ApiError(400, "playlist Id is missing")
    }
    try {
        const playlist = await Playlist.findById(playlistId)
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "playlist has been fetched"
        ))
    } catch (error) {
        throw new ApiError(500, "something went wrong while fetching")
    }

})

export {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getUserPlaylists,
    getPlaylistById
}