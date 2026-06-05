const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

const menuToggle = document.querySelector(".menu-toggle");
const header = document.querySelector("header");
const navLinks = document.querySelectorAll("#nav-list a");

if (menuToggle && header) {
  const closedLabel = menuToggle.getAttribute("aria-label") || "Open navigation";
  const openLabel = closedLabel === "Abrir navegacion" ? "Cerrar navegacion" : "Close navigation";

  menuToggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? openLabel : closedLabel);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      header.classList.remove("nav-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", closedLabel);
    });
  });
}
