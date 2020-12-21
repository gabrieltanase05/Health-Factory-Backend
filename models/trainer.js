import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const TrainerSchema = mongoose.Schema({
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    dateOfBirth: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: 'https://live.mgm-tp.com/wp-content/uploads/2019/04/default-avatar.png'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});
//Crypt the user password
    TrainerSchema.methods.generateHash = function(password){
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };
    TrainerSchema.methods.validPassword =function(password) {
        return bcrypt.compareSync(password, this.password);
    };


export default mongoose.model('Trainer', TrainerSchema)