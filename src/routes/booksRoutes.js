import express from 'express';
import jwt from 'jsonwebtoken';
import cloudinary from '../lib/cloudinary.js';
import Book from '../models/Book.js';
import protectRoute from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/', protectRoute, async (req, res) => {
    try{

        const {title, caption, rating, image} = req.body;

        if(!image || !title || !caption || !rating){
            return res.status(400).json({message: "Please fill all fields"})
        }

        // upload the image
        const uploadResponse= await cloudinary.uploader.upload(image);
        const imageUrl = uploadResponse.secure_url;
        
        const newBook = new Book({
            title,
            caption,
            rating,
            image: imageUrl,
            user: req.user._id
        });

        await newBook.save();
        res.status(201).json(newBook);

    }catch(e){
        console.log(e.message)
        res.status(500).json({message: e.message})
    }
});


router.get("/", protectRoute, async (req, res) => {
    try{

        const page = req.query.page || 1;;
        const limit = req.query.limit || 5;
        const skip = (page - 1) * limit;

        const totalBooks = await Book.countDocuments({});

        const books = await Book.find().sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .populate("user", "username profileImage")

        
        res.status(200).json({
            books,
            currentPage: page,
            totalBooks,
            totalPages: Math.ceil(totalBooks / limit),
        });
    }catch(e){
        console.log(e.message)
        res.status(500).json({message: e.message})
    }
});


router.delete("/:id", protectRoute, async (req, res) => {
    try{
        const bookId = req.params.id;
        const book = await Book.findById(bookId);
        if(!book){
            return res.status(404).json({message: "Book not found"})
        }

        // check if user is the owner of the book
        if(book.user.toString() !== req.user._id.toString()){
            return res.status(401).json({message: "Unauthorized"})
        }

        // delete the image from cloudinary
        if(book.user && book.image.includes("cloudinary")){
            try{

                const publicId = book.image.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(publicId);
                console.log("Image deleted from Cloudinary")

            }catch(e){
                console.log("error deleting from Cloudinary", e.message)
                res.status(500).json({message: e.message})
            }
        }

        await book.deleteOne();
        res.status(200).json({message: "Book deleted successfully"});
    }catch(e){
        console.log(e.message)
        res.status(500).json({message: e.message})
    }
});

// get recommended books by the logged in user
router.get("/user", protectRoute, async(req, res) => {
    try{
        const books = await Book.find({user: req.user._id}).sort({createdAt: -1});
        res.status(200).json(books);
    }catch(e){
        console.log("get user books error", e.message);
        res.status(500).json({message: e.message})

    }
} )

export default router;