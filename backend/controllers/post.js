const { post } = require("../app");
const Post = require("../models/Post")
const User= require("../models/User")

exports.createPost = async (req, res )=> {
    try {
        const newPostData = {
            caption: req.body.caption,
            image:{
                public_id: "req.body.public_id",
                url: "req.body.url"
            },
            owner: req.user._id
        };

        const post = await Post.create(newPostData);

        const user = await User.findById(req.user._id);

        user.posts.push(post._id);
        
        await user.save();
        res.status(201).json({
            success: true,
            post,
        });
    
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post Not Found"
            });
        }

        if (post.owner.toString() !== req.user._id.toString()){
            return res.status(404).json({
                success: false,
                message: "Unauthorized User"
            });
        }

        await post.remove();

        const user = await User.findById(req.user._id);

        const index = user.posts.indexOf(req.params.id);
        user.posts.splice(index, 1);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Post Deleted"
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
        
    }
}

exports.likeAndUnlikePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post Not Found"
            });
        }

        if (post.likes.includes(req.user._id)){
            const index = post.likes.indexOf(req.user._id);
            post.likes.splice(index, 1);
            
            await post.save();

            return res.status(200).json({
                success: true,
                message: "Post Unliked"
            });

        } else {
            post.likes.push(req.user._id);

            await post.save();

            return res.status(200).json({
                success: true,
                message: "Post Liked"
            });
        }
       
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

exports.getPostOfFollowing = async (req, res) => {

    try {

        const user = await User.findById(req.user._id);

        const posts = await Post.find({
            owner: {
                $in: user.following
            }
        });

        return res.status(200).json({
            success: true,
            posts
        });

        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });      
    }
}

exports.updateCaption = async (req, res) => {
    try {

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post Not Found"
            });
        }

        if (post.owner.toString() !== req.user._id.toString()){
            return res.status(404).json({
                success: false,
                message: "Unauthorized User"
            });
        }

        post.caption = req.body.caption;
        await post.save()

        return res.status(200).json({
            success: true,
            message: "Updated Caption"
        });
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });    
    }
}

exports.commentOnPost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post Not Found"
            });
        }

        let commentExists = -1;
        let index = 0;
        
        post.comments.forEach((item) => {
            if (item.user.toString() === req.user._id.toString()){
                commentExists = index;
                return
                index++;
            }
        })

        if (commentExists !== -1) {
            post.comments[index].comment = req.body.comment;
            await post.save()

            return res.status(200).json({
                success: true,
                message: "Comment updated Successfully"
            })

        } else {
            post.comments.push({
                user: req.user._id,
                comment: req.body.comment
            })

            await post.save()

            return res.status(200).json({
                success: true,
                message: "Comment added Successfully"
            })
        }

        
        
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });  
    }
}

exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post Not Found"
            });
        }

        if (post.owner.toString() === req.user._id.toString()) {
            if (req.body.commentId == undefined){
                return res.status(400).json({
                    success: false,
                    message: "Comment Id is required"
                });  
            }
            post.comments.forEach(function (item, index) {
                if (item._id.toString() === req.body.commentId.toString()){
                    return post.comments.splice(index, 1);
                }
            });
        
            await post.save()
            return res.status(200).json({
                success: true,
                message: "Selected Comment has been Deleted"
            })
            
        } else {
            post.comments.forEach(function (item, index) {
                if (item.user.toString() === req.user._id.toString()){
                    return post.comments.splice(index, 1);
                }
            });

            await post.save()
            return res.status(200).json({
                success: true,
                message: "Your Comment has been Deleted"
            })
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });  
    }
}