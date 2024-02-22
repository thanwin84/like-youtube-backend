import mongoose, {Schema} from "mongoose";

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
        },
        videos:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        owner: {
            type: Schema.Types.ObjectId,
            rer: "User"
        }
    },
    {
        timestamps: true
    }
)

export const Playlist = new mongoose.model("Playlist", playlistSchema)