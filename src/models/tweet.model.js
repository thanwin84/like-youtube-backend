import mongoose, {Schema} from "mongoose";

const tweetSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        content: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
)

export const Tweet = new mongoose.model("Tweet", tweetSchema)