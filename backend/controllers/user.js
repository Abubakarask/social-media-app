const User = require("../models/User");
const Post = require("../models/Post");
const {sendEmail} = require("../middlewares/sendEmail")
const crypto = require("crypto")

exports.register = async (req, res) => {
    try {
        const {name, email, password} = req.body;

        let user = await User.findOne({email});

        if (user) {
            return res
                .status(400)
                .json({success: false, message: "User already exists"});
        }

        user = await User.create({
            name, 
            email, 
            password,
            avatar: {public_id: "sample_id", url: "sample_url"}
        });

        const token = await user.generateToken();

        const options = {
            expires: new Date(Date.now() + 90*24*60*60*1000),
            httpOnly: true
        }

        res
            .status(201)
            .cookie("token", token, options)
            .json({
                success: true,
                user,
                token
            });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {

    try {
        
        const {email, password} = req.body;

        const user = await User.findOne({email}).select("+password");

        if (!user){
            return res.status(400).json({
                success: false,
                message: "User does not exist"
            });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch){
            return res.status(400).json({
                success: false,
                message: "Incorrect Password"
            });
        }
        
        const token = await user.generateToken();

        const options = {
            expires: new Date(Date.now() + 90*24*60*60*1000),
            httpOnly: true
        }

        res
            .status(200)
            .cookie("token", token, options)
            .json({
                success: true,
                user,
                token
            });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,    
        });
    }
}

exports.logout = async (req, res) => {
    try {

        res
            .status(200)
            .cookie("token", null, {expires: new Date(Date.now()), httpOnly:true})
            .json({
            success: true,
            message: "Logged Out"
            })
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
        
    }
}


exports.followUser = async (req,res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const loggedInUser = await User.findById(req.user._id);

        if (!userToFollow){
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        if (loggedInUser.following.includes(userToFollow._id)){
            const followingidx = loggedInUser.following.indexOf(userToFollow._id)
            loggedInUser.following.splice(followingidx, 1)

            const idxfollowers = userToFollow.followers.indexOf(loggedInUser._id)
            userToFollow.followers.splice(idxfollowers, 1)

            await loggedInUser.save();
            await userToFollow.save();

            return res.status(200).json({
                success: true,
                message: "User Unfollowed"
            })
        } else {

            loggedInUser.following.push(userToFollow._id);
            userToFollow.followers.push(loggedInUser._id);

            await loggedInUser.save();
            await userToFollow.save();

            return res.status(200).json({
                success: true,
                message: "User Followed"
            })
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,    
        });
    }
}

exports.updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        const {oldPassword, newPassword} = req.body;

        if (!oldPassword || !newPassword){
            return res.status(404).json({
                success: false,
                message: "Please provide Old Password or New Password"
            });
        }

        //added by me
        if (oldPassword == newPassword){
            return res.status(400).json({
                success: false,
                message: "Old Password and New Password are same"
            });
        }

        const isMatch = await user.matchPassword(oldPassword);

        if (!isMatch){
            return res.status(404).json({
                success: false,
                message: "Incorrect Old Password"
            });
        }

        user.password = newPassword;
        await user.save()

        return res.status(200).json({
            success: true,
            message: "Updated Password"
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


exports.updateProfile = async (req,res) => {
    try {

        const user = await User.findById(req.user._id);

        const {name, email} = req.body;

        if (name){
            user.name = name;
        }

        if (email){
            user.email = email;
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: "Profile Updated"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.deleteMyProfile = async (req,res) => {
    try {

        const user = await User.findById(req.user._id);
        const posts = user.posts;
        const followers = user.followers;
        const followings = user.following;
        const userId = user._id;

        await user.remove();

        //logout User after Deleting Profile
        res.cookie("token", null, {
            expires: new Date(Date.now()), 
            httpOnly:true
        });

        //Deleting all post of User
        posts.forEach(async postId => {
            const postt = await Post.findById(postId);
            await postt.remove();
        })

        //Removing Users from followers' following
        followers.forEach(async followerId => {
            const follower = await User.findById(followerId);

            const index = follower.following.indexOf(userId);
            follower.following.splice(index, 1);

            await follower.save();
        })

        //Removing Users from following's follower
        followings.forEach(async followingId => {
            const following = await User.findById(followingId);

            const index = following.followers.indexOf(userId);
            following.followers.splice(index, 1);

            await following.save();
        })


        res.status(200).json({
            success: true,
            message: "Profile Deleted"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.myProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("posts");
        
        res.status(200).json({
            success: true,
            user
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.getUserProfile = async (req, res) => {
    try {
        const userProfile = await User.findById(req.params.id).populate("posts")

        if (!userProfile){
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            })
        }

        res.status(200).json({
            success: true,
            userProfile
        })


        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });  
    }
}

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({})
        
        res.status(200).json({
            success: true,
            users
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.forgotPassword = async (req,res) => {
    try {
        const user = await User.findOne({email: req.body.email})

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User does not exist"
            });
        }

        const resetPasswordToken = user.getResetPasswordToken();

        await user.save();

        const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetPasswordToken}`;

        const message = `Reset your password by clicking on the link below:  \n\n${resetUrl}`;


        try {
            await sendEmail({
                email: user.email,
                subject: "Reset Password",
                message
            });

            res.status(200).json({
                success: true,
                message: `Email sent to ${user.email}`
            });
            
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            user.save();

            res.status(500).json({
                success: false,
                message: error.message
            });
            
        }       
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

exports.resetPassword = async (req, res) => {
    try {
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        })

        if (!user) {
            return res.status(401).json({
                success: true,
                message: "Token is invalid or has expired"
            });
        }

        user.password = req.body.password;

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        user.save();

        return res.status(200).json({
            success: true,
            message: "Updated Password"
        })
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}