import mongoose, {isValidObjectId} from "mongoose";
import {User} from '../models/user.model.js'
import {Playlist} from '../models/playlist.model.js'
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from '../utils/ApiResponse.js'

const createPlaylist = asyncHandler(async (req, res)=>{
    const {name, description} = req.body
})

const getUserPlaylists = asyncHandler(async (req, res)=>{
    const {userId} = req.params
})

const addVideoToPlaylist = asyncHandler(async (req, res)=>{
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res)=>{
    const {playlistId, videoId} = req.params
})

const deletePlaylist = asyncHandler(async (req, res)=>{
    const {playlistId} = req.params
})

const updatePlaylist = asyncHandler(async(req, res)=>{
    const {playlistId} = req.params
    const {name, description} = req.body
})
export {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getUserPlaylists
}