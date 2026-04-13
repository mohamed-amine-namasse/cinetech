"use strict";
// Remarquez les declaration de variable ci-dessous
let modalLogin = false;
const btnLogin = document.querySelector(".btn-login");
btnLogin.addEventListener("click", function () {
    toggleModale();
});
const headerCloser = document.querySelector("header");
headerCloser.addEventListener("click", function (e) {
    if (!e.target.closest("button")) {
        modalLogin = false;
        document.querySelector("main").classList.remove("blured");
        document.querySelector(".loginModal").classList.remove("active");
        document.querySelectorAll(".btn-view").forEach((btn) => {
            btn.setAttribute("tabindex", "0");
            btn.classList.add("active");
        });
        document.querySelector("body").classList.remove("fixed");
        document.querySelector("main").classList.remove("invisible");
    }
});
const btnCloseModale = document.querySelector(".close-modal");
btnCloseModale.addEventListener("click", function () {
    toggleModale();
});
function toggleModale() {
    modalLogin = !modalLogin;
    document.querySelector("main").classList.toggle("blured");
    document.querySelector(".loginModal").classList.toggle("active");
    document.querySelectorAll(".btn-view").forEach((btn) => {
        modalLogin
            ? btn.setAttribute("tabindex", "-1")
            : btn.setAttribute("tabindex", "0");
        btn.classList.toggle("active");
    });
}
