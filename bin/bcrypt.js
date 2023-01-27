// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const bcrypt = require("bcrypt");

if (process.argv.length < 3) {
    process.exit(1);
}

bcrypt.hash(process.argv[2], 10).then((value) => {
    console.log(value);
});
