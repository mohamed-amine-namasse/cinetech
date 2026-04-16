"use strict";
function initNavbar() {
    const btnConnexion = document.querySelector(".btn-login");
    // On récupère le lien favoris dans la navigation
    const navFavorites = document.getElementById("nav-favorites");
    if (!btnConnexion)
        return;
    // Fonction pour mettre à jour l'affichage de la barre de navigation
    const updateNavbarUI = () => {
        const token = localStorage.getItem("user_token");
        const username = localStorage.getItem("username");
        if (token && username) {
            // Utilisateur connecté
            btnConnexion.textContent = `Déconnexion (${username})`;
            // Affiche le lien favoris
            if (navFavorites) {
                navFavorites.style.display = "inline-block";
            }
        }
        else {
            // Utilisateur déconnecté
            btnConnexion.textContent = "Se connecter";
            // Masque le lien favoris
            if (navFavorites) {
                navFavorites.style.display = "none";
            }
        }
    };
    // Logique au clic sur le bouton (Connexion / Déconnexion)
    const handleAuthClick = () => {
        const token = localStorage.getItem("user_token");
        if (token) {
            // ---- DÉCONNEXION ----
            localStorage.removeItem("user_token");
            localStorage.removeItem("username");
            updateNavbarUI();
            // On prévient les autres pages (comme favorites.ts ou details.ts)
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
    // 1. Initialiser l'affichage au chargement de la page
    updateNavbarUI();
    // 2. Écouter le clic sur le bouton de connexion
    btnConnexion.addEventListener("click", handleAuthClick);
}
// Lancement au chargement du DOM
document.addEventListener("DOMContentLoaded", initNavbar);
