// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

const model_users = require("../models/users");
const model_sensors = require("../models/sensors");
const model_measurements = require("../models/measurements");

const CHART_TICKS = 360;
const CHART_RANGES = [
    { range: 6 * 60 * 60, description: "6時間" },
    { range: 24 * 60 * 60, description: "24時間" },
    { range: 7 * 24 * 60 * 60, description: "7日間" },
    { range: 30 * 24 * 60 * 60, description: "30日間" },
];
CHART_RANGES.forEach((r) => console.assert(r.range % CHART_TICKS === 0));

const PUSH_INTERVAL = 10 * 1000;

class Controller_WebAppAPI {
    initialize(io, session_middleware) {
        const nsp = io.of("/webapp");

        nsp.use((socket, next) => {
            session_middleware(socket.request, {}, next);
        });

        nsp.on("connect", async (socket) => {
            console.log("WebApp '\x1b[32m%s\x1b[0m' connected.", socket.id);

            socket.on("disconnect", () => {
                console.log("WebApp '\x1b[32m%s\x1b[0m' disconnected.", socket.id);
            });

            const user_id = await this.authenticate(socket.request.session?.passport?.user);
            if (user_id) {
                console.log("WebApp '\x1b[32m%s\x1b[0m' accepted.", socket.id);
            } else {
                console.log("WebApp '\x1b[32m%s\x1b[0m' rejected.", socket.id);
                socket.disconnect();
            }

            const context = {
                sensors: [],
                sensor_index: 0,
                range_index: 0,
                prev_max_tick: 0,
                timer: null,
            };

            socket.on("init-context", async (params, callback) => {
                if (typeof callback !== "function") {
                    return;
                }

                if (context.timer) {
                    clearInterval(context.timer);
                    context.timer = null;
                }

                context.sensors = await model_sensors.find_by_user_id(user_id);
                if (!context.sensors) {
                    callback(null);
                    return;
                }

                context.sensor_index = params.sensor_index;
                if (!(context.sensor_index in context.sensors)) {
                    context.sensor_index = 0;
                }

                context.range_index = params.range_index;
                if (!(context.range_index in CHART_RANGES)) {
                    context.range_index = 0;
                }

                context.prev_max_tick = 0;

                context.timer = setInterval(push, PUSH_INTERVAL);
                setImmediate(push);

                callback({
                    sensors: context.sensors.map((s) => s.description),
                    sensor_index: context.sensor_index,
                    ranges: CHART_RANGES.map((r) => r.description),
                    range_index: context.range_index,
                    chart_range: CHART_RANGES[context.range_index].range,
                    chart_ticks: CHART_TICKS,
                });
            });

            socket.on("edit-sensor", async (params, callback) => {
                if (typeof callback !== "function") {
                    return;
                }

                if (!(params.sensor_index in context.sensors)) {
                    callback(false);
                    return;
                }

                if (typeof params.description !== "string") {
                    callback(false);
                    return;
                }

                params.description = params.description.trim();
                if (!params.description) {
                    callback(false);
                    return;
                }

                const result = await model_sensors.update_description(
                    context.sensors[params.sensor_index],
                    params.description
                );
                callback(result);
            });

            const push = async () => {
                const sensor_id = context.sensors[context.sensor_index].sensor_id;
                const latest = await model_measurements.get_latest(sensor_id);

                let values = [null, null];
                if (latest) {
                    values[0] = latest.temp0;
                    values[1] = latest.tds;
                }

                socket.emit("values", values);

                const tick_length = CHART_RANGES[context.range_index].range / CHART_TICKS;
                const max_tick = Math.floor(Date.now() / tick_length / 1000);
                if (max_tick > context.prev_max_tick) {
                    const min_tick = Math.max(context.prev_max_tick, max_tick - CHART_TICKS);
                    const series = await model_measurements.get_series(
                        context.sensors[context.sensor_index].sensor_id,
                        min_tick,
                        max_tick,
                        tick_length
                    );

                    socket.emit("series", {
                        series: series,
                        min_tick: min_tick,
                        max_tick: max_tick,
                        ticks: CHART_TICKS,
                        tick_length: tick_length,
                    });

                    context.prev_max_tick = max_tick;
                }
            };
        });
    }

    async authenticate(auth) {
        if (typeof auth.auth_provider !== "string") {
            return null;
        }

        if (typeof auth.auth_id !== "string") {
            return null;
        }

        const user = await model_users.find_by_auth_id(auth.auth_provider, auth.auth_id);
        if (!user) {
            return null;
        }

        return user.user_id;
    }
}

const controller_webapp_api = new Controller_WebAppAPI();
module.exports = controller_webapp_api;
