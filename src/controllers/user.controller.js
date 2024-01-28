import {asyncHandler} from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary, deleteAsset } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import jwt from 'jsonwebtoken'
import { getKey } from '../utils/keypairs.js'
import mongoose from 'mongoose'



const generateAcessAndRefreshTokens = async(userId)=>{
    try {
        
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        // save it in the database
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res)=>{

    // get user details from frontend
    const {username, email, fullName, password} = req.body

    //  validation -- checking for not empty
    if (
        [fullName, email, username, password]
        .some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
     // check if user already exists by username or email
    const existedUser = await User.findOne({
        $or: [{username}, {email}]
    })
    // check if username or email exists
    if (existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // check locally saved avatar and cover image and get their path
   
    let avatarLocalPath;
    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length){
        avatarLocalPath = req.files.avatar[0].path
    }
    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // avatar file must be included
    if (!avatarLocalPath){
        throw new ApiError(400, "Please make sure you have included your avatar")
    }

    // upload avatar and coverImage file on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // checking if avatar is uploaded successfully on the cloud
    if (!avatar){
        throw new ApiError(400, "Please make sure you have included your avatar")
    }

    // create the new user
    const user = await User.create({
        fullName,
        avatar: [avatar.url, avatar.public_id],
        coverImage: coverImage ? [coverImage.url, coverImage.public_id] : [],
        email,
        password,
        username
    })
     
    // exlude password and refresh token for the user
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registering")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "user registered successfully")
    )

})

const loginUser = asyncHandler(async (req, res)=>{
    // todos
    // req body ->> data
    // username or email
    // find the user
    // if user is found, check password
    // if password is checkd, generate access and refresh token
    // send cookies

    const {email, username, password} = req.body

    if (!username && !email){
        throw new ApiError(404, "username or password is required")
    }
    // find user based on username or email
    const user = await User.findOne({
        $or: [{email}, {username}]
    })

    if (!user){
        return new ApiError(404, "user does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    

    if (!isPasswordValid){
        return new ApiError(404, "Password does not match.")
    }
    const {accessToken, refreshToken} = await generateAcessAndRefreshTokens(user._id)
    
    const loggedInUser = {
        username: user.username,
        email: user.email || "",
        fullName: user.fullName,
        avatar: user.avatar,
        coverImage: user.coverImage,
        watchHistory: user.watchHistory,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt

    }

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, 
                accessToken, 
                refreshToken
            },
            "User is logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res)=>{
    // load user data from db
    // set undefined in refreshToken feild
    // clear cookies at the client site
   
    const user = await User.findOneAndUpdate(
        {_id: req.user._id}, {$set: {refreshToken: undefined}, new: true}
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "user has been logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res)=>{

        // get the refresh token from user
        // if user doesn't have the refresh token, throw error

        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if (!incomingRefreshToken){
            throw new ApiError(401, "unauthorized request")
        }
        // get the refresh public key
        const public_key = getKey({keyType: "public_key", tokenType: "refreshToken"})
        // verify the refresh token
        let decodedToken;
        jwt.verify(
            incomingRefreshToken, 
            public_key,
                {algorithms: ['RS256'] }, (error, decoded)=>{
                    if (decoded){
                        decodedToken = decoded
                    }
                    else {
                        throw new ApiError(401, "invalid refresh token")
            }
        })
        // load user data from db
        const user = await User.findById(decodedToken._id)

        if (!user){
            throw new ApiError(401, "invalid refresh token")
        }
        
        if (incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "refresh is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        // generate new access token and refresh token
        const {accessToken, refreshToken} = await generateAcessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { accessToken, refreshToken},
                "access token is refreshed"
            )
        )

})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body
    const userId = req.user
    const user = await User.findById(userId)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    // validateBeforeSave: false --> by doing this we are skipping other validation process
    try {
        await user.save({validateBeforeSave: false})
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password has been changed successfully"))
    } catch (error) {
        throw new ApiError(500, "Error while saving the password")
    }

})

const getCurrentUser = asyncHandler(async (req, res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user information is fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res)=>{
    const {fullName, email} = req.body
    const user = await User.findById(req.user._id)
    if (!fullName && !email){
        throw new ApiError(404, "Either fullName or email is required")
    }
    if (fullName){
        user.fullName = fullName
    }
    if (email){
        user.email = email
    }
    try {
        const user = await User.findByIdAndUpdate(
            req.user?._id, 
            {
                $set: req.body
            }, {new: true}
            ).select("-password")
        // console.log(req.body)
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Updated sucessfully"))
    } catch (error) {
        throw new ApiError(500, "Someting went wrong while updating the document")
    }
})

const updateAvatar = asyncHandler(async (req, res)=>{
    // delete the existing image from cloudinary
    // then upload the update image
    const user = await User.findById(req.user._id)
    if (!user){
        throw new ApiError(400, "The user does not exist")
    }
    const public_id = user.avatar[1]
    let avatarLocalPath;
    if (req.file && req.file.fieldname === 'avatar'){
        avatarLocalPath = req.file.path
    }
    if (!avatarLocalPath){
        throw new ApiError(400, "Updated file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar){
        throw new ApiError(500, "Something went wrong while uploading avatar file")
    }
    user.avatar[0] = avatar.url
    user.avatar[1] = avatar.public_id
    try {
        await user.save()
        // now delete the old avatar
        deleteAssetInTheBackground(public_id)
        
    } catch (error) {
        throw new ApiError(500, "something went wrong while updating document")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {},
        "Avatar has been updated successfully"
    ))
})

const updateCoverImage = asyncHandler(async (req, res)=>{
    // delete the existing image from cloudinary
    // then upload the update image
    const user = await User.findById(req.user._id)
    if (!user){
        throw new ApiError(400, "The user does not exist")
    }
    const public_id = user.coverImage[1]
    let coverImageLocalPath;
    if (req.file && req.file.fieldname === 'coverImage'){
        coverImageLocalPath = req.file.path
    }
    if (!coverImageLocalPath){
        throw new ApiError(400, "Updated file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage){
        throw new ApiError(500, "Something went wrong while uploading cover image file")
    }
    user.coverImage[0] = coverImage.url
    user.coverImage[1] = coverImage.public_id
    try {
        await user.save()
        // now delete the old avatar
        deleteAssetInTheBackground(public_id)
        
    } catch (error) {
        throw new ApiError(500, "something went wrong while updating document")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        {},
        "Cover Image  has been updated successfully"
    ))
})

const deleteAssetInTheBackground = async (publicId)=>{
    try {
        await deleteAsset(publicId)
    } catch (error) {
        console.log("old photo could not delete!")
    }
}

// need testing
const getChannelProfile = asyncHandler(async (req, res)=>{
    const {username} = req.params

    if (!username?.trim()){
        throw new ApiError(400, "username is missing")
    }
    const channel = await User.aggregate(
        [
            {
              $match: {
                username: username?.toLowerCase()
              },
            },
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
              },
            },
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
              },
            },
            {
              $addFields: {
                subscriberCount: {$size: "$subscribers"},
                subscribedToOthersCount: {
                  $size: "$subscribedTo"
                },
                isSubscribed: {
                  $cond: {
                    if : {$in: [req.user?._id, "$subscribers.subscriber"]},
                    then: true,
                    else: false
                  }
                }
              }
            },
            {
              $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribers: "$subscriberCount",
                subscribedToOthers: "$subscribedToOthersCount",
                isSubscribed: "$isSubscribed"
              }
            }
          ]
    )

    if (!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "user channel has been fetched successfully")
    )
})

// need testing
const getWatchHistory = asyncHandler(async (req, res)=>{
    const user = await User.aggregate(
        [
            {
              $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
              }
            },
            {
              $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                  {
                    $lookup: {
                      from: "users",
                      localField: "owner",
                      foreignField: "_id",
                            as: "owner",
                      pipeline: [
                        {
                          $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                          }
                        },
                        
                      ]
                    }
                  },
                  {
                    $addFields: {
                      "owner": {
                        $first: "$owner"
                      }
                    }
                  }
                ]
              }
            },
            {
              $project: {
                _id: 0,
                password: 0,
                refreshToken: 0
              }
            }
          ]
    )

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history is fetched successfully"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getChannelProfile,
    getWatchHistory

}