// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const YAML = require("yaml");
const readFileSync = require("fs").readFileSync;

class Config {
    #values_;

    constructor() {
        const filename = "./.settings/settings.yml";
        this.#values_ = YAML.parse(readFileSync(filename, "utf-8"));
    }

    get service_user() {
        return this.#values_.service.user;
    }

    get https_port() {
        return this.#values_.https.port;
    }

    get https_options() {
        return {
            cert: readFileSync(this.#values_.https.cert),
            key: readFileSync(this.#values_.https.key),
        };
    }

    get session_secret() {
        return this.#values_.session.secret;
    }

    database_options(name) {
        return this.#values_.database[name];
    }

    oauth2_options(provider) {
        return this.#values_.OAuth2[provider];
    }
}

const config = new Config();
module.exports = config;
