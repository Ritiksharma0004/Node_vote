const express = require("express");
const router = express.Router();
const User = require("./../models/user");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");

router.post("/signup", async (req, res) => {
  try {
    const data = req.body;

    const newUser = new User(data);

    const response = await newUser.save();
    console.log("User registered sucessfully");

    const payLoad = {
      id: response.id,
    };

    console.log(JSON.stringify(payLoad));
    const token = generateToken(payLoad);
    console.log("Token is :", token);

    res.status(200).json({ response: response, token: token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { aadharCardNumber, password } = req.body;
    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: `Invalid username or password` });
    }

    const payLoad = {
      id: user.id,
    };

    const token = generateToken(payLoad);

    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.get("/profile", async (req, res) => {
  try {
    const userData = req.user;
    const userId = userData.id;
    const user = await User.findOne({ userId: userId });
    res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: `Internal server error` });
  }
});

router.put("/profile/password", jwtAuthMiddleware, async (req,res) => {
  
  const userId = req.user.id;
  const {currentPassword, newPassword} = req.body;

  const user = await User.findById(userId);

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({ error: `currentPassword not matched` });
  }

  user.password = newPassword;
  await user.save();

  console.log('password changed sucessfully');
  res.status(200).json({message: 'Password Updated'})
})

module.exports = router;
