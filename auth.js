const express = require("express");
const passport = require("passport");
const LocalStratergy = require("passport-local").Strategy;
const User = require("./models/user");
passport.use(
  new LocalStratergy(async (aadharCardNumber, password, done) => {
    try {
      const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

      if (!user) return done(null, false, { message: `Invalid Identity` });

      //   const isPasswordMatch = (user.password = password ? true : false);
      const isPasswordMatch = await user.comparePassword(password);

      if (isPasswordMatch) return done(null, user);
      else 
        return done(null, false, { message: `Incorrect Password` });
    } catch (error) {
      return done(error);
    }
  })
);

module.exports = passport;
