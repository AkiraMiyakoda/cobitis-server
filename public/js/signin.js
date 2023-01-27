// Copyright (c) 2023 Akira Miyakoda
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    document.querySelectorAll(".social-signin").forEach((button) => {
        button.addEventListener("click", () => {
            location.replace(`/auth/${button.getAttribute("data-provider")}`);
        });
    });
});
