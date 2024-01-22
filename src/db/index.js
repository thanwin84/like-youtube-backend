import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectToDB = async()=>{
    try {
        const connectionString = `${process.env.MONGO_URI}/${DB_NAME}`
        const connectionInstance = await mongoose.connect(connectionString)
        console.log(`Mongodb has connected successfully: \n host:${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("MONGODB connection Failed ", error)
        process.exit(1)
    }
}

export default connectToDB