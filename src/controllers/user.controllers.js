import {asyncHandler} from "../utils/asyncHandler.js"
import{ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler( async (req,res)=>{
    // return res.status(200).json({
    //     message: "everything is running fine"
    // })

    //get user details from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
    //create user object - create entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return response

    //declare data point for req body
    const {fullname,email, username,password}=req.body
    // console.log("email: ", email);

    // if(fullname===""){
    //     throw new ApiError(400,"fullname is required")
    // }

    //check validation field is empty or not
    // if(
    //     [fullname,email,username,password].some((field)=> field?.trim=="")
    // ){
    //     throw new ApiError(400, "all fields are required")
    // }

    if ([fullname, email, username, password].some((field) => field?.trim === "")) {
        throw new ApiError(400, "All fields are required");
    }
    
    
    //checking the user already exist or not
    //for finding user
    const existedUser= await User.findOne({
        $or: [{ username },{ email }]
    })

    //if we find then throw error if not then continue
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files);
    
    //here we extract local path of avatar
    const avatarLocalPath= req.files?.avatar[0]?.path
    //const coverImageLocalPath= req.files?.coverImage[0]?.path;

    //here we extract local path of coverImage
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0 ){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    //if avatar not found then show an error
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //if avatar and coverImage found then upload it on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    //if avatar not uploading then throw error
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    //if everythind is fine then create an object of user and upload it to database
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })

    //leave password and token from received value due to security reason
    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //if user is not created then throw error
    if(!createdUser){
        throw new ApiError(500, "something went wrong while registering user")

    }

    //return if user created
    return res.status(201).json(
        new ApiResponse(200, createdUser,"User registered successfully")
    )

})

export {registerUser}
