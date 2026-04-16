"use strict";
function initNavbar() {
    const btnConnexion = document.querySelector(".btn-login");
    if (!btnConnexion)
        return;
    // Fonction pour mettre à jour l'affichage du bouton
    const updateNavbarUI = () => {
        const token = localStorage.getItem("user_token");
        const username = localStorage.getItem("username");
        if (token && username) {
            btnConnexion.textContent = `Déconnexion (${username})`;
        }
        else {
            btnConnexion.textContent = "Se connecter";
        }
    };
    // Logique au clic sur le bouton
    const handleAuthClick = () => {
        const token = localStorage.getItem("user_token");
        if (token) {
            // ---- DÉCONNEXION ----
            localStorage.removeItem("user_token");
            localStorage.removeItem("username");
            updateNavbarUI();
            // On prévient les autres pages (comme details) que l'état a changé
            window.dispatchEvent(new Event("authStateChanged"));
        }
        else {
            // ---- CONNEXION ----
            const username = prompt("Entrez votre pseudo :");
            const password = prompt("Entrez votre mot de passe :");
            if (username && password) {
                localStorage.setItem("user_token", "connected_as_" + username);
                localStorage.setItem("username", username);
                updateNavbarUI();
                // On prévient les autres pages
                window.dispatchEvent(new Event("authStateChanged"));
            }
        }
    };
    // 1. Initialiser l'affichage au chargement
    updateNavbarUI();
    // 2. Écouter le clic
    btnConnexion.addEventListener("click", handleAuthClick);
}
// Lancer la fonction quand la page a fini de charger
document.addEventListener("DOMContentLoaded", initNavbar);
