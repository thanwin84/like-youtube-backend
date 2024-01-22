import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who has subscribed
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom subsriber is subscribing
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = new mongoose.model('Subscription', subscriptionSchema)