import mongoose from 'mongoose';

const UserSessionSchema = mongoose.Schema({
    userID: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now()
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});


export default mongoose.model('UserSession', UserSessionSchema);