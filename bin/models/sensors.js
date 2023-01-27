// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const pool = require("./pool");

class Model_Sensors {
    async find_by_key(key1) {
        try {
            const rows = await pool.query(
                `
                SELECT
                    sensor_id,
                    key2
                  FROM
                    sensors
                  WHERE
                    key1 = ?
            ;`,
                [key1]
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

    async find_by_user_id(user_id) {
        try {
            const rows = await pool.query(
                `
                SELECT
                    sensor_id,
                    description
                  FROM
                    sensors
                  WHERE
                    user_id = ?
            ;`,
                [user_id]
            );

            if (rows.length >= 1) {
                return rows;
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

    async update_description(sensor_id, description) {
        let conn = null;
        try {
            conn = await pool.getConnection();

            await conn.beginTransaction();
            await pool.query(
                `
                UPDATE sensors
                  SET
                    description = ?
                  WHERE
                    sensor_id = ?
            ;`,
                [description, sensor_id]
            );
            await conn.commit();

            return true;
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            }

            if (conn) {
                conn.rollback();
            }

            return false;
        } finally {
            if (conn) {
                await conn.release();
            }
        }
    }
}

const model_sensors = new Model_Sensors();
module.exports = model_sensors;
