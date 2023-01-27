// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const express = require("express");

const route = express.Router();

route.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("index", { title_suffix: "" });
    } else {
        res.redirect("/auth/signin");
    }
});

const route_index = route;
module.exports = route_index;
