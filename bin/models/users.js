// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const pool = require("./pool");

class Model_Users {
    async find_by_auth_id(auth_provider, auth_id) {
        try {
            const rows = await pool.query(
                `
                SELECT
                    user_id
                  FROM
                    users
                  WHERE
                        auth_provider = ?
                    AND auth_id = ?
            ;`,
                [auth_provider, auth_id]
            );

            if (rows.length == 1) {
                return rows[0];
            } else {
                return null;
            }
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            }
            return null;
        }
    }
}

const model_users = new Model_Users();
module.exports = model_users;
