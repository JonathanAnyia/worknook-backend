const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Worker = require("../models/Worker");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/ids");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb(new Error("File upload only supports images and PDFs"));
  },
});

// Register client
router.post("/register/client", async (req, res) => {
  try {
    // res.setHeader("Content-Type", "application/json");
    const { fullName, email, phone, address, password, lga, state } =
      await req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !password ||
      !lga ||
      !state
    ) {
      console.error("All fields required");
      return res.status(500).json({ error: "All fields required" });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Create new user
    user = new User({
      fullName,
      email,
      phone,
      address,
      password,
      state,
      city: lga,
      userType: "Worker",
      message: "User created successfully",
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        userType: user.userType,
      },
    });
    res.status(200).json({ message: "User successfully signed up" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Register worker
router.post("/register/worker", async (req, res) => {
  try {
    // res.setHeader("Content-Type", "application/json");
    const { fullName, email, phone, address, password, lga, state } =
      await req.body;

    if (
      !fullName ||
      !email ||
      !phone ||
      !address ||
      !password ||
      !lga ||
      !state
    ) {
      console.error("All fields required");
      return res.status(500).json({ error: "All fields required" });
    }

    let user = await User.findOne({ email });

    if (user) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Create new user
    user = new User({
      fullName,
      email,
      phone,
      address,
      password,
      state,
      city: lga,
      userType: "Client",
      message: "User created successfully",
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        userType: user.userType,
      },
    });
    res.status(200).json({ message: "User successfully signed up" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType,
        message: "User successfully logged in",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
