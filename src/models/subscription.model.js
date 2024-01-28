import mongoose, {Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId, // one who has subscribed
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, // one to whom subscriber is subscribing
        ref: "User"
    }
}, {timestamps: true})

export const Subscription = new mongoose.model('Subscription', subscriptionSchema)

/// whenever a user will subscribe a channel a document wil be created. 