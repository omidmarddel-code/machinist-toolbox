const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const PASSWORD = "1370";

loginBtn.addEventListener("click", login);

passwordInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        login();
    }
});

function login() {

    if (passwordInput.value === PASSWORD) {

        sessionStorage.setItem("loggedIn", "true");

        window.location.href = "index.html";

    } else {

        loginError.textContent = "رمز عبور اشتباه است.";

    }

}