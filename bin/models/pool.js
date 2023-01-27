// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const mariadb = require("mariadb");

const settings = require("../settings");

const model_pool = mariadb.createPool(settings.database_options("app"));
module.exports = model_pool;
