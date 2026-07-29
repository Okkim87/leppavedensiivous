(() => {
    const menuButton = document.querySelector(".business-menu-button");
    const menu = document.querySelector("#business-menu");

    if (!menuButton || !menu) {
        return;
    }

    const closeMenu = () => {
        menu.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
    };

    menuButton.addEventListener("click", () => {
        const isOpen = menu.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    menu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });
})();
