// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const pool = require("./pool");

class Model_Measurements {
    async append(sensor_id, values) {
        try {
            values = values.map((row) => [sensor_id, ...row]);

            await pool.batch(
                `
                INSERT INTO measurements (
                    sensor_id,
                    measured_at,
                    temp0,
                    temp1,
                    tds
                )
                VALUES (?, ?, ?, ?, ?)
            ;`,
                values
            );

            return true;
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            }
            return false;
        }
    }

    async get_latest(sensor_id) {
        try {
            const rows = await pool.query(
                `
                SELECT
                    temp0,
                    tds
                  FROM
                    measurements
                  WHERE
                        sensor_id = ?
                    AND measured_at >= UNIX_TIMESTAMP() - 30
                  ORDER BY
                    measured_at DESC
                  LIMIT 1
                ;`,
                [sensor_id, sensor_id]
            );

            if (rows.length === 1) {
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

    async get_series(sensor_id, min_tick, max_tick, tick_length) {
        try {
            const rows = await pool.query(
                `
                SELECT
                    measured_at DIV ?              AS tick,
                    ROUND(TRIMMEAN(temp0, 0.2), 2) AS temp0,
                    ROUND(TRIMMEAN(temp1, 0.2), 2) AS temp1,
                    ROUND(TRIMMEAN(tds,   0.2), 2) AS tds
                  FROM
                    measurements
                  WHERE
                        sensor_id = ?
                    AND measured_at >= ?
                    AND measured_at <  ?
                  GROUP BY
                    tick
                  ORDER BY
                    tick
                ;
            `,
                [tick_length, sensor_id, min_tick * tick_length, max_tick * tick_length]
            );

            if (rows === null) {
                return null;
            }

            const series = [
                Array(max_tick - min_tick).fill(null),
                Array(max_tick - min_tick).fill(null),
                Array(max_tick - min_tick).fill(null),
            ];

            rows.forEach((row) => {
                const index = Number(row.tick) - min_tick;
                series[0][index] = row.temp0;
                series[1][index] = row.temp1;
                series[2][index] = row.tds;
            });

            return series;
        } catch (e) {
            if (e instanceof Error) {
                console.error(e.message);
            }
            return null;
        }
    }
}

const model_measurements = new Model_Measurements();
module.exports = model_measurements;
