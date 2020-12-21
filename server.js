// Imports
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import Trainer from './models/trainer.js';
import Member from './models/member.js';
import UserSession from './models/userSession.js';
import 'dotenv/config.js';

// Server config
const router = express.Router();
const app = express();
// Support JSON encoded bodies
app.use(bodyParser.json());
// Support encoded bodies ( x-www-form-urlencoded)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use('/api', router);

//Connection to MongoDB
mongoose.connect(
    process.env.DB_CONNECTION,
    {   useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: true
    },
    {
        useFindAndModify: false 
    },
    ()=> console.log('Connected to MongoDB!')
);

//Check the connection to MongoDB
mongoose.connection.on('error', console.error.bind(console, 'Error connection to MongoDB'))

// Mongoose settings
mongoose.set( 'useFindAndModify', false );

//SIGNUP API
router.post('/SIGNUP', (req, res) => {
    res.setHeader(
        'Content-Type','application/x-www-form-urlencoded',
        'Access-Control-Allow-Origin',
        'http://localhost:3000/',
        'Cache-Control',
        'max-age=31536000' );
    let {firstName, lastName, password, isTrainer, email} = req.body;
    email = email.toLowerCase().trim();
        console.log(req.body)
    // Set the user schema based on isTrainer value
    let UserType;
    if( isTrainer === 'true') {
        UserType = 'Trainer';
    } else if( isTrainer === 'false') {
        UserType = 'Member';
    } else return
    // Check if the user already exist
    eval(UserType).find({email: email}, (err, previousUser) => {

        if(err){
            return res.status(500).send({
                success: false,
                message: 'ERROR: Internal server Error!'
            });
        } else if (previousUser.length > 0){
                console.log("USER EXIST");
                console.log(previousUser);
                console.log(previousUser.length);
            return res.status(422).send({
                success: false,
                message: 'ERROR: Email already exist!'
            });
        }

    //Save the new user based on the user schema
    let user = new (eval(UserType))();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.password = user.generateHash(password);

    user.save((err) => {
            if (err){
               return res.status(500).send({
                   success: false,
                   message: 'ERROR: Internal server error!'
               });
            } else {
                return res.status(201).send({
                    success: true,
                    message: 'Signup successfully!<br/>Please login.'
                });
    
            }
        });
    });


    // if(!lastName){
    //     return res.end({
    //         succes: false,
    //         message: 'ERROR: Last Name cannot be empty!'
    //     });
    // };
    // if(!email){
    //     return res.end({
    //         succes: false,
    //         message: 'ERROR: Email cannot be empty!'
    //     });
    // };
    // if(!password){
    //     return res.end({
    //         succes: false,
    //         message: 'ERROR: Password cannot be empty!'
    //     });
    // };
    // user.save((err) => {
    //     if (err){
    //         res.send({succes: false,
    //             error: err,
    //         });
    //     } else {
    //         res.send({
    //             succes: true,
    //             message:'Signup succesfuly! Please Login.'
    //         });

    //     }
    // });
});

//POST Request for user Login
router.post('/LOGIN', (req, res) => {
    let {email, password, isTrainer} = req.body;
    email = email.toLowerCase().trim();

    // Set the user schema based on isTrainer value
    let UserType;
    if( isTrainer === 'true') {
        UserType = 'Trainer';
    } else if( isTrainer === 'false') {
        UserType = 'Member';
    } else return
    //Find the user based on email 
    eval(UserType).find({
        email: email
    }, (err, users)=>{
        console.log(users)
        if(err){
            // Handling errors
            return res.status(500).send({
                success: false,
                message: 'ERROR: Internal server error!'
            });
        }else if(users.length != 1){
            // Check if the email exist in db
            return res.status(422).send({
                success: false,
                message: 'Invalid e-mail!'
            });
        } else {
            // Check if the password is correct
            const user = users[0];
            if(!user.validPassword(password)){
                    return res.status(422).send({
                        success: false,
                        message: 'Invalid Password!'
                });
            };
            // Create new user session and receive the token and user ID
            // Create the session based on Session model
            const userSession = new UserSession();
            userSession.userID = user._id;
            userSession.save((err, doc)=>{
                if(err){
                    // Handling errors
                    return res.status(500).send({
                        success: false,
                        message: "ERROR: Internal server error!"
                    });
                }
                return res.status(200).send({
                    success: true,
                    message: 'Valid Login!',
                    token: doc._id,
                    userId: user._id
                });
            });
        }
        
    });
});

//Verify user token from localStorage
router.get('/VERIFY', (req, res, next) => {
    const {token} = req.query;
//Find the user session by token and check if it's valid
    UserSession.find({
        _id: token,
        isDeleted: false
        },(err, sessions)=>{
            if(err){
                return res.send({
                    succes: false,
                    message: 'ERROR: Internal server error!',
                });
            } else if(sessions.length!=1){
                return res.send({
                    succes: false,
                    message: 'ERROR: Invalid token',
                });
            } else {
                return res.send({
                    success: true,
                    message: 'Token verified!',
                    userID: sessions[0].userID
                })
            }
        });
});

//GET Request for user Logout
router.get('/LOGOUT', (req, res, next)=>{
    const {token} = req.query
    //Check the user and set isDeleted to TRUE
    UserSession.findOneAndUpdate({
        _id: token,
        isDeleted: false
    }, {
        $set:{isDeleted:true}
    }, null, (err, sessions)=>{
        console.log(sessions)
        if(err){
            return res.status(500).send({
                success: false,
                message: 'ERROR: Internal server error!'
            });
        };
        return res.status(200).send({
            success: true,
            message: 'Logout successfully!'
        });
    })
});

//Load the user informations for Profile
router.get('/USER/', function(req, res){
    const {id, isTrainer}=req.query
    console.log(req.query)
      // Set the user schema based on isTrainer value
      let UserType;
      if( isTrainer === 'true') {
          UserType = 'Trainer';
      } else {
          UserType = 'Member';
      }
    // Find the user in MobgoDB
    eval(UserType).find({_id: id}, function(err, docs){
        if(err) {
            return res.status(500).send({
                succes: false,
                message: 'ERROR: Internal server error!'
            });s
            //Send the data to FrontEnd
        } else {
            console.log(docs)
            res.status(200).send({
                succes: true,
                message: 'Load user data!',
                docs: docs
            })
        }
    })
});

// //Update the user informations(Save)
// router.post('/updateUserInfo/', function(req, res){
//     const {id}=req.query
//     //Data for update
//     const dataSend = req.body
//     //Find the user in MobgoDB and sent the update
//     User.findOneAndUpdate({_id: id}, dataSend, (err, result)=>{
//         if(err){
//             res.status(404).end({
//                 succes: false,
//                 message: 'ERROR: Server ERROR!'
//             })
//         }
//         return res.send({
//             succes: true,
//             message: 'Update!'
//         })
//     })//Check the file exist
//         .then(doc=>{
//             if(!doc){
//                 return res.status(404).end;
//             }
//             return res.status(200).json(doc);
//         })
//         // .catch(err=>console.log(err))
// });


//Port Listening Server
app.listen(process.env.PORT || 8080, () => console.log('Server is running on port 8080'));