// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const compression = require("compression-next");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const socket = require("socket.io");
const spdy = require("spdy");
const MySQLStore = require("express-mysql-session")(session);

const settings = require("./settings");
const route_index = require("./routes/index");
const route_auth = require("./routes/auth");
const webapp_api = require("./controllers/webapp_api");
const sensor_api = require("./controllers/sensor_api");

const app = express();
const https_server = spdy.createServer(settings.https_options, app);
const io = socket(https_server);

app.use(morgan(process.env === "production" ? "combined" : "dev"));
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "script-src": ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
                "style-src": ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
            },
        },
    })
);
app.use(compression());
app.use(express.static("./public"));
app.set("view engine", "pug");

const session_middleware = session({
    secret: settings.session_secret,
    store: new MySQLStore(settings.database_options("session")),
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 34560000000, // 400 days
        secure: true,
        httpOnly: true,
    },
});
app.use(session_middleware);
app.use(route_auth);
app.use(route_index);

webapp_api.initialize(io, session_middleware);
sensor_api.initialize(io);

https_server.listen(settings.https_port, () => {
    process.setuid(settings.service_user);
    console.log("Switched to user %s", settings.service_user);
    console.log("Started listening on port %d", settings.https_port);
});
