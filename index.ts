// Remarquez les declaration de variable ci-dessous

let modalLogin: boolean = false;

const btnLogin = document.querySelector(".btn-login") as HTMLButtonElement;

btnLogin.addEventListener("click", function () {
  toggleModale();
});

const headerCloser = document.querySelector("header") as HTMLElement;
headerCloser.addEventListener("click", function (e) {
  if (!(e.target as HTMLElement).closest("button")) {
    modalLogin = false;
    document.querySelector("main")!.classList.remove("blured");
    document.querySelector(".loginModal")!.classList.remove("active");
    document.querySelectorAll<HTMLButtonElement>(".btn-view").forEach((btn) => {
      btn.setAttribute("tabindex", "0");
      btn.classList.add("active");
    });
    document.querySelector("body")!.classList.remove("fixed");
    document.querySelector("main")!.classList.remove("invisible");
  }
});

const btnCloseModale = document.querySelector(
  ".close-modal",
) as HTMLButtonElement;

btnCloseModale.addEventListener("click", function () {
  toggleModale();
});

function toggleModale() {
  modalLogin = !modalLogin;
  document.querySelector("main")!.classList.toggle("blured");
  document.querySelector(".loginModal")!.classList.toggle("active");
  document.querySelectorAll<HTMLButtonElement>(".btn-view").forEach((btn) => {
    modalLogin
      ? btn.setAttribute("tabindex", "-1")
      : btn.setAttribute("tabindex", "0");
    btn.classList.toggle("active");
  });
}
