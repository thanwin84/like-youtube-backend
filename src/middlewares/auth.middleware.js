// import { publicKey } from "../utils/keypairs.js";
import jwt from 'jsonwebtoken'
import { ApiResponse } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { getKey } from '../utils/keypairs.js';
import { asyncHandler } from '../utils/asyncHandler.js';




function verifyJWT(req, res, next){
    const public_key = getKey({keyType: "public_key", tokenType: "accessToken"})
    // access token is stored either in cookies or header
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace("Bearer ", "")
    jwt.verify(
        token, 
       public_key,
        {algorithms: ['RS256'] }, (error, decoded)=>{
            if (decoded){
                // we will need this when we want to log out user
                req.user = decoded
                next();
            }
            else {
                throw new ApiError(401, "unauthorized request", error)
            }
        })
}


export default verifyJWT