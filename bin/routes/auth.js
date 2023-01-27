// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

const settings = require("../settings");

const route = express.Router();

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

passport.use(
    new GoogleStrategy(settings.oauth2_options("google"), (_accessToken, _refreshToken, profile, done) => {
        done(null, { auth_provider: "google", auth_id: profile.id });
    })
);

route.use(passport.initialize());
route.use(passport.session());

route.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["https://www.googleapis.com/auth/userinfo.profile"],
    })
);

route.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        successRedirect: "/",
        failureRedirect: "/auth/signin",
        session: true,
    })
);

route.get("/auth/signin", (_req, res) => {
    res.render("signin", { title_suffix: " - Sign in" });
});

route.get("/auth/signout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        res.redirect("/auth/signin");
    });
});

const route_auth = route;
module.exports = route_auth;
