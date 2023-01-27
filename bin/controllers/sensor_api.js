// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const bcrypt = require("bcrypt");

const model_sensors = require("../models/sensors");
const model_measurements = require("../models/measurements");

class Controller_SensorAPI {
    initialize(io) {
        const nsp = io.of("/sensor");

        nsp.on("connect", async (socket) => {
            console.log("Sensor '\x1b[34m%s\x1b[0m' connected.", socket.id);

            socket.on("disconnect", () => {
                console.log("Sensor '\x1b[34m%s\x1b[0m' disconnected.", socket.id);
            });

            const sensor_id = await this.authenticate(socket.handshake.auth);
            if (sensor_id) {
                console.log("Sensor '\x1b[34m%s\x1b[0m' accepted.", socket.id);
            } else {
                console.log("Sensor '\x1b[34m%s\x1b[0m' rejected.", socket.id);
                socket.disconnect();
            }

            socket.on("post", async (values, callback) => {
                if (typeof callback !== "function") {
                    return;
                }
                console.log(values);

                const result = await model_measurements.append(sensor_id, values);
                callback(result);
            });
        });
    }

    async authenticate(auth) {
        if (typeof auth?.key1 !== "string") {
            return null;
        }

        if (typeof auth?.key2 !== "string") {
            return null;
        }

        const sensor = await model_sensors.find_by_key(auth.key1);
        if (!sensor) {
            return null;
        }

        if (bcrypt.compare(auth.key2, sensor.key2)) {
            return sensor.sensor_id;
        } else {
            return null;
        }
    }
}

const controller_sensor_api = new Controller_SensorAPI();
module.exports = controller_sensor_api;
