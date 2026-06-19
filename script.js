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

const collectionTable = document.querySelector("[data-collection-table]");

if (collectionTable) {
  const tbody = collectionTable.querySelector("tbody");
  const countLabel = document.getElementById("collection-count");
  const globalFilter = document.getElementById("collection-global-filter");
  const columnFilters = Array.from(collectionTable.querySelectorAll("[data-column-filter]"));
  const pageSizeSelect = document.getElementById("collection-page-size");
  const previousPageButton = document.getElementById("collection-prev-page");
  const nextPageButton = document.getElementById("collection-next-page");
  const pageStatus = document.getElementById("collection-page-status");
  let collectionRows = [];
  let currentPage = 1;

  const searchableColumns = ["title", "artist", "album", "duration", "source"];
  const getValue = (value) => value == null ? "" : String(value);
  const normalizeFilter = (value) => getValue(value).toLowerCase().trim();
  const isUrl = (value) => /^https?:\/\//i.test(getValue(value));
  const getPageSize = () => {
    const parsedSize = Number(pageSizeSelect ? pageSizeSelect.value : 25);
    return [25, 50, 100].includes(parsedSize) ? parsedSize : 25;
  };
  const getColumnValue = (row, column) => {
    if (column === "source") {
      return [row.sourceLabel, row.source].filter(Boolean).join(" ");
    }

    return getValue(row[column]);
  };

  const resetCollectionPage = () => {
    currentPage = 1;
  };

  const renderCollection = () => {
    const globalTerm = normalizeFilter(globalFilter ? globalFilter.value : "");
    const columnTerms = columnFilters.reduce((terms, input) => {
      terms[input.dataset.columnFilter] = normalizeFilter(input.value);
      return terms;
    }, {});

    const filteredRows = collectionRows.filter((row) => {
      const globalMatch = !globalTerm || searchableColumns.some((column) =>
        normalizeFilter(getColumnValue(row, column)).includes(globalTerm)
      );
      const columnMatch = searchableColumns.every((column) =>
        !columnTerms[column] || normalizeFilter(getColumnValue(row, column)).includes(columnTerms[column])
      );

      return globalMatch && columnMatch;
    });

    const pageSize = getPageSize();
    const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), pageCount);
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);
    const firstShown = filteredRows.length ? startIndex + 1 : 0;
    const lastShown = startIndex + pageRows.length;

    if (countLabel) {
      countLabel.textContent = filteredRows.length
        ? `Showing ${firstShown}-${lastShown} of ${filteredRows.length} filtered tracks (${collectionRows.length} total)`
        : `0 of ${collectionRows.length} tracks shown`;
    }

    if (pageStatus) {
      pageStatus.textContent = `Page ${currentPage} of ${pageCount}`;
    }

    if (previousPageButton) {
      previousPageButton.disabled = currentPage <= 1 || !filteredRows.length;
    }

    if (nextPageButton) {
      nextPageButton.disabled = currentPage >= pageCount || !filteredRows.length;
    }

    if (!tbody) {
      return;
    }

    tbody.replaceChildren();

    if (!filteredRows.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = searchableColumns.length;
      cell.textContent = "No tracks match the current filters.";
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    pageRows.forEach((track) => {
      const row = document.createElement("tr");

      searchableColumns.forEach((column) => {
        const cell = document.createElement("td");
        cell.dataset.label = column.charAt(0).toUpperCase() + column.slice(1);
        if (column === "source" && isUrl(track.source)) {
          const link = document.createElement("a");
          link.href = track.source;
          link.textContent = track.sourceLabel || track.source;
          link.rel = "noopener";
          link.target = "_blank";
          cell.appendChild(link);
        } else {
          cell.textContent = getColumnValue(track, column);
        }
        row.appendChild(cell);
      });

      tbody.appendChild(row);
    });
  };

  fetch(collectionTable.dataset.source)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Collection data could not be loaded.");
      }
      return response.json();
    })
    .then((tracks) => {
      collectionRows = Array.isArray(tracks) ? tracks : [];
      renderCollection();
    })
    .catch(() => {
      if (countLabel) {
        countLabel.textContent = "Collection data could not be loaded.";
      }
      if (tbody) {
        tbody.innerHTML = '<tr><td colspan="5">Collection data could not be loaded.</td></tr>';
      }
    });

  if (globalFilter) {
    globalFilter.addEventListener("input", () => {
      resetCollectionPage();
      renderCollection();
    });
  }

  columnFilters.forEach((input) => {
    input.addEventListener("input", () => {
      resetCollectionPage();
      renderCollection();
    });
  });

  if (pageSizeSelect) {
    pageSizeSelect.addEventListener("change", () => {
      resetCollectionPage();
      renderCollection();
    });
  }

  if (previousPageButton) {
    previousPageButton.addEventListener("click", () => {
      currentPage -= 1;
      renderCollection();
    });
  }

  if (nextPageButton) {
    nextPageButton.addEventListener("click", () => {
      currentPage += 1;
      renderCollection();
    });
  }
}
