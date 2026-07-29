// ================================
// Leppäveden Siivouspalvelu
// script.js
// ================================

// Sulava vieritys navigaatiolinkeille
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", function (e) {
        e.preventDefault();

        const target = document.querySelector(this.getAttribute("href"));

        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    });
});

// Scroll-animaatiot
const revealElements = document.querySelectorAll(
    ".card, .benefits li, .offer, form, footer, section"
);

const revealOnScroll = () => {
    const trigger = window.innerHeight * 0.85;

    revealElements.forEach(el => {
        const top = el.getBoundingClientRect().top;

        if (top < trigger) {
            el.classList.add("active");
            el.classList.add("reveal");
        }
    });
};

window.addEventListener("scroll", revealOnScroll);
window.addEventListener("load", revealOnScroll);

// Headerin varjo scrollattaessa
const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

    if (!header) return;

    if (window.scrollY > 40) {

        header.style.boxShadow = "0 10px 30px rgba(0,0,0,.08)";

    } else {

        header.style.boxShadow = "none";

    }

});

// Takaisin ylös -painike
const topButton = document.createElement("button");

topButton.innerHTML = "↑";

topButton.id = "backToTop";

document.body.appendChild(topButton);

Object.assign(topButton.style, {
    position: "fixed",
    bottom: "30px",
    left: "30px",
    width: "55px",
    height: "55px",
    borderRadius: "50%",
    border: "none",
    background: "#6d7550",
    color: "#fff",
    fontSize: "24px",
    cursor: "pointer",
    display: "none",
    zIndex: "999",
    boxShadow: "0 10px 25px rgba(0,0,0,.2)",
    transition: ".3s"
});

window.addEventListener("scroll", () => {

    if (window.scrollY > 500) {

        topButton.style.display = "block";

    } else {

        topButton.style.display = "none";

    }

});

topButton.addEventListener("click", () => {

    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

});

// Tarjouspyyntölomake
const form = document.querySelector("form");



// Hover-animaatio palvelukorteille
document.querySelectorAll(".card").forEach(card => {

    card.addEventListener("mouseenter", () => {

        card.style.transform = "translateY(-12px) scale(1.02)";

    });

    card.addEventListener("mouseleave", () => {

        card.style.transform = "";

    });

});

// Vuosiluku automaattisesti footeriin
const year = document.querySelector("#year");

if (year) {

    year.textContent = new Date().getFullYear();

}
