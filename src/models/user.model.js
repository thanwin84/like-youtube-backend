import mongoose, {Schema} from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from 'bcrypt'
import {generateKeypair, getKey} from '../utils/keypairs.js'
import { asyncHandler } from "../utils/asyncHandler.js"
import ApiError from "../utils/ApiError.js"

 
const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    avatar: {
        type: [String], //cloudinary url
        required: true

    },
    coverImage: {
        type: [String], //cloudinary url
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is required"]
    },
    refreshToken: {
        type: String
    }
}, {timestamps: true})

userSchema.pre("save", async function(next){
    if (this.isModified("password")){
        this.password =await bcrypt.hash(this.password, 10)
        next()
    }else {
        next()
    }
})
userSchema.methods.isPasswordCorrect = async function(password){
    const response = await bcrypt.compare(password, this.password)
    
    return response
}

userSchema.methods.generateAccessToken = function(){

    // generate public and private key
    generateKeypair("accessToken")
    // get the private key file path
    const private_key = getKey({keyType: "private_key", tokenType: "accessToken"})

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            userSchema: this.username,
            fullName: this.fullName
        },
        private_key,
        {
            algorithm: "RS256",
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken = function(){
    generateKeypair("refreshToken")
    // get the private key file path
    const private_key = getKey({keyType: "private_key", tokenType: "refreshToken"})

    return jwt.sign(
        {
            _id: this._id
        },
        private_key,
        {
            algorithm: "RS256",
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}


export const User = mongoose.model("User", userSchema)