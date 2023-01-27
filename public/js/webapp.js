// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* global io */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const SNACKBAR_DURATION = 3000;

    const utils = {
        set_text: (el, text) => {
            if (!(el instanceof HTMLElement)) {
                el = document.querySelector(el);
            }

            el.innerText = text;
        },

        activate: (el, active) => {
            if (!(el instanceof HTMLElement)) {
                el = document.querySelector(el);
            }

            if (active) {
                el.classList.add("active");
            } else {
                el.classList.remove("active");
            }
        },
    };

    // =========================================================================
    //  Current values
    // =========================================================================

    const update_values = (values) => {
        let temp_s = "--.-";
        let tds_s = "--.-";

        if (Array.isArray(values) && values.length === 2) {
            if (typeof values[0] === "number") {
                temp_s = values[0].toFixed(1);
            }

            if (typeof values[1] === "number") {
                tds_s = values[1].toFixed(1);
            }
        }

        document.querySelector("#temp-box > .value").innerText = temp_s;
        document.querySelector("#tds-box > .value").innerText = tds_s;
    };

    const update_chart = (data) => {
        if (data == null) {
            console.error("Failed to get chart data");
            return;
        }

        const shift = data.max_tick - data.min_tick;
        context.series = context.series.map((s, i) => s.slice(shift).concat(data.series[i]));

        const params = {
            base_tick: data.max_tick - data.ticks,
            ticks: data.ticks,
            tick_length: data.tick_length,
            range: context.range_index,
        };
        draw_chart(
            Object.assign(params, {
                canvas: "#temp-box canvas",
                scale: 1,
                series: [context.series[0], context.series[1]],
                colors: ["#5DADE2", "#82E0AA"],
            })
        );
        draw_chart(
            Object.assign(params, {
                canvas: "#tds-box canvas",
                scale: 5,
                series: [context.series[2]],
                colors: ["#EB984E"],
            })
        );

        utils.activate(".overlay", false);
    };

    // =========================================================================
    //  Navigation and side drawer
    // =========================================================================

    const update_navigation = () => {
        utils.set_text("#current-sensor", context.sensors[context.sensor_index]);

        {
            const ul = document.querySelector("#list-ranges");
            ul.innerHTML = "";

            context.ranges.forEach((range, i) => {
                const li = document.createElement("li");
                utils.activate(li, i === context.range_index);
                li.innerText = range;
                li.addEventListener("click", () => {
                    init_context({
                        sensor_index: context.sensor_index,
                        range_index: i,
                    });
                    utils.activate("nav.drawer", false);
                });

                ul.appendChild(li);
            });
        }

        {
            const ul = document.querySelector("#list-sensors");
            ul.innerHTML = "";

            context.sensors.forEach((sensor, i) => {
                const li = document.createElement("li");
                utils.activate(li, i === context.sensor_index);
                li.innerText = sensor;
                li.classList.add("editable");
                li.addEventListener("click", (e) => {
                    if (e.offsetX < li.offsetLeft + li.offsetWidth - 50) {
                        init_context({ sensor_index: i, range_index: context.range_index });
                        utils.activate("nav.drawer", false);
                    } else {
                        open_edit_sensor_dialog(i);
                    }
                });

                ul.appendChild(li);
            });
        }
    };

    document.querySelector("#button-menu").addEventListener("click", () => {
        utils.activate("nav.drawer", true);
    });

    document.querySelector(".drawer-backdrop").addEventListener("click", () => {
        utils.activate("nav.drawer", false);
    });

    document.querySelector("#item-signout").addEventListener("click", () => {
        location.replace("/auth/signout");
    });

    // =========================================================================
    //  Dialogs
    // =========================================================================

    const open_edit_sensor_dialog = (index) => {
        const input_description = document.querySelector("#sensor-description");
        input_description.value = context.sensors[index];
        input_description.select();

        const dialog = document.querySelector("#dialog-sensor");
        dialog.execute = () => {
            utils.activate(".overlay", true);
            utils.activate("nav.drawer", false);
            edit_sensor({
                sensor_index: index,
                description: input_description.value,
            });
            dialog.close();
        };
        dialog.showModal();
    };

    document.querySelectorAll("button.execute-dialog").forEach((button) => {
        button.addEventListener("click", () => {
            const dialog = button.closest("dialog");
            if ("execute" in dialog) {
                dialog.execute();
            }
        });
    });

    document.querySelectorAll("button.cancel-dialog").forEach((button) => {
        button.addEventListener("click", () => {
            button.closest("dialog").close();
        });
    });

    // =========================================================================
    //  Snackbar
    // =========================================================================

    const show_snackbar = (text) => {
        const bar = document.querySelector(".snackbar");
        bar.innerText = text;
        utils.activate(bar, true);
        window.setTimeout(() => {
            utils.activate(bar, false);
        }, SNACKBAR_DURATION);
    };

    // =========================================================================
    //  Communication with Server
    // =========================================================================

    const socket = io("/webapp");

    const context = {
        sensors: [],
        sensor_index: parseInt(window.localStorage.getItem("sensor_index")) || 0,
        ranges: [],
        range_index: parseInt(window.localStorage.getItem("range_index")) || 0,
        series: [[], [], []],
    };

    socket.on("connect", () => {
        init_context({
            sensor_index: context.sensor_index,
            range_index: context.range_index,
        });
    });

    socket.on("disconnect", () => {
        document.querySelector(".overlay").classList.add("active");
    });

    socket.on("values", update_values);
    socket.on("series", update_chart);

    const init_context = (params) => {
        socket.emit("init-context", params, init_context_callback);
    };

    const init_context_callback = (new_context) => {
        if (!new_context) {
            console.error("Failed to init context");
            return;
        }

        Object.assign(context, new_context);
        window.localStorage.setItem("sensor_index", context.sensor_index);
        window.localStorage.setItem("range_index", context.range_index);

        context.series = [...Array(3).keys()].map((_) => Array(context.chart_ticks).fill(null));

        update_navigation();
    };

    const edit_sensor = async (params) => {
        socket.emit("edit-sensor", params, edit_sensor_callback);
    };

    const edit_sensor_callback = (result) => {
        if (result) {
            show_snackbar("センサー情報の更新に成功しました");
            init_context({
                sensor_index: context.sensor_index,
                range_index: context.range_index,
            });
        } else {
            console.error("Failed to edit sensor");
            show_snackbar("センサー情報の更新に失敗しました");
        }
    };
});
