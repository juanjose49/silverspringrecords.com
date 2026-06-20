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
  const theadRow = collectionTable.querySelector("thead tr");
  const tbody = collectionTable.querySelector("tbody");
  const heading = document.getElementById("collection-heading");
  const countLabel = document.getElementById("collection-count");
  const globalFilter = document.getElementById("collection-global-filter");
  const viewButtons = Array.from(document.querySelectorAll("[data-collection-view]"));
  const pageSizeSelect = document.getElementById("collection-page-size");
  const downloadCsvButton = document.getElementById("collection-download-csv");
  const previousPageButton = document.getElementById("collection-prev-page");
  const nextPageButton = document.getElementById("collection-next-page");
  const pageStatus = document.getElementById("collection-page-status");
  const collectionViews = {
    collection: {
      heading: "Music Collection",
      loadingText: "Loading collection...",
      emptyText: "No tracks match the current filters.",
      errorText: "Collection data could not be loaded.",
      totalLabel: "tracks",
      source: collectionTable.dataset.source,
      columns: [
        { key: "title", label: "Title" },
        { key: "artist", label: "Artist" },
        { key: "album", label: "Album" },
        { key: "duration", label: "Duration" },
        { key: "source", label: "Source" }
      ]
    },
    wishlist: {
      heading: "Music Wishlist",
      loadingText: "Loading wishlist...",
      emptyText: "No wishlist tracks match the current filters.",
      errorText: "Wishlist data could not be loaded.",
      totalLabel: "wishlist tracks",
      source: collectionTable.dataset.wishlistSource,
      columns: [
        { key: "title", label: "Title" },
        { key: "artist", label: "Artist" },
        { key: "duration", label: "Duration" },
        { key: "status", label: "Status" },
        { key: "reason", label: "Reason" },
        { key: "source", label: "Source" }
      ]
    }
  };
  const viewRows = {
    collection: [],
    wishlist: []
  };
  let activeView = "collection";
  let currentPage = 1;
  let currentFilteredRows = [];

  const getValue = (value) => value == null ? "" : String(value);
  const normalizeFilter = (value) => getValue(value).toLowerCase().trim();
  const isUrl = (value) => /^https?:\/\//i.test(getValue(value));
  const getPageSize = () => {
    const parsedSize = Number(pageSizeSelect ? pageSizeSelect.value : 25);
    return [25, 50, 100].includes(parsedSize) ? parsedSize : 25;
  };
  const getColumnValue = (row, column) => {
    if (column === "source") {
      return [
        row.sourceLabel,
        row.bpmSupremeAlbumUrl,
        row.bpmSupremeTrackUrl,
        row.source
      ].filter(Boolean).join(" ");
    }

    return getValue(row[column]);
  };
  const getSourceUrl = (row) => row.bpmSupremeAlbumUrl || row.bpmSupremeTrackUrl || row.source;
  const csvEscape = (value) => {
    const text = getValue(value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const buildCsv = (rows, config) => {
    const headers = config.columns.map((column) => column.label);
    const body = rows.map((row) => config.columns.map((column) => {
      if (column.key === "source") {
        return csvEscape(getSourceUrl(row) || getColumnValue(row, column.key));
      }

      return csvEscape(getColumnValue(row, column.key));
    }).join(","));

    return [headers.map(csvEscape).join(","), ...body].join("\r\n") + "\r\n";
  };
  const getCsvFilename = () => {
    const today = new Date().toISOString().slice(0, 10);
    return activeView === "wishlist"
      ? `music-wishlist-${today}.csv`
      : `music-collection-${today}.csv`;
  };
  const downloadFilteredCsv = () => {
    const config = getActiveConfig();
    const csv = buildCsv(currentFilteredRows, config);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = getCsvFilename();
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const resetCollectionPage = () => {
    currentPage = 1;
  };

  const getActiveConfig = () => collectionViews[activeView];
  const getActiveRows = () => viewRows[activeView];

  const renderTableHead = () => {
    const config = getActiveConfig();

    if (!theadRow) {
      return;
    }

    theadRow.replaceChildren();

    config.columns.forEach((column) => {
      const header = document.createElement("th");
      const label = document.createElement("span");
      const input = document.createElement("input");

      header.scope = "col";
      label.textContent = column.label;
      input.type = "search";
      input.autocomplete = "off";
      input.dataset.columnFilter = column.key;
      input.setAttribute("aria-label", `Filter by ${column.label.toLowerCase()}`);
      input.addEventListener("input", () => {
        resetCollectionPage();
        renderCollection();
      });

      header.append(label, input);
      theadRow.appendChild(header);
    });
  };

  const setActiveView = (view) => {
    if (!collectionViews[view] || activeView === view) {
      return;
    }

    activeView = view;
    resetCollectionPage();
    if (globalFilter) {
      globalFilter.value = "";
    }
    renderTableHead();
    renderCollection();
  };

  const renderCollection = () => {
    const config = getActiveConfig();
    const rows = getActiveRows();
    const searchableColumns = config.columns.map((column) => column.key);
    const columnFilters = Array.from(collectionTable.querySelectorAll("[data-column-filter]"));
    const globalTerm = normalizeFilter(globalFilter ? globalFilter.value : "");
    const columnTerms = columnFilters.reduce((terms, input) => {
      terms[input.dataset.columnFilter] = normalizeFilter(input.value);
      return terms;
    }, {});

    if (heading) {
      heading.textContent = config.heading;
    }

    viewButtons.forEach((button) => {
      const isActive = button.dataset.collectionView === activeView;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    const filteredRows = rows.filter((row) => {
      const globalMatch = !globalTerm || searchableColumns.some((column) =>
        normalizeFilter(getColumnValue(row, column)).includes(globalTerm)
      );
      const columnMatch = searchableColumns.every((column) =>
        !columnTerms[column] || normalizeFilter(getColumnValue(row, column)).includes(columnTerms[column])
      );

      return globalMatch && columnMatch;
    });

    currentFilteredRows = filteredRows;

    if (downloadCsvButton) {
      downloadCsvButton.textContent = `Download (${filteredRows.length})`;
      downloadCsvButton.disabled = !filteredRows.length;
    }

    const pageSize = getPageSize();
    const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    currentPage = Math.min(Math.max(currentPage, 1), pageCount);
    const startIndex = (currentPage - 1) * pageSize;
    const pageRows = filteredRows.slice(startIndex, startIndex + pageSize);
    const firstShown = filteredRows.length ? startIndex + 1 : 0;
    const lastShown = startIndex + pageRows.length;

    if (countLabel) {
      countLabel.textContent = filteredRows.length
        ? `Showing ${firstShown}-${lastShown} of ${filteredRows.length} filtered ${config.totalLabel} (${rows.length} total)`
        : `0 of ${rows.length} ${config.totalLabel} shown`;
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
      cell.textContent = config.emptyText;
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    pageRows.forEach((track) => {
      const row = document.createElement("tr");

      searchableColumns.forEach((column) => {
        const cell = document.createElement("td");
        cell.dataset.label = column.charAt(0).toUpperCase() + column.slice(1);
        const sourceUrl = column === "source" ? getSourceUrl(track) : "";
        if (column === "source" && isUrl(sourceUrl)) {
          const link = document.createElement("a");
          link.href = sourceUrl;
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

  const loadViewData = (view) => {
    const config = collectionViews[view];

    if (!config || !config.source) {
      return Promise.resolve();
    }

    return fetch(config.source)
      .then((response) => {
        if (!response.ok) {
          throw new Error(config.errorText);
        }
        return response.json();
      })
      .then((tracks) => {
        viewRows[view] = Array.isArray(tracks) ? tracks : [];
      });
  };

  renderTableHead();

  Promise.all([loadViewData("collection"), loadViewData("wishlist")])
    .then(() => {
      renderCollection();
    })
    .catch(() => {
      const config = getActiveConfig();
      if (countLabel) {
        countLabel.textContent = config.errorText;
      }
      if (tbody) {
        tbody.innerHTML = `<tr><td colspan="${config.columns.length}">${config.errorText}</td></tr>`;
      }
    });

  if (globalFilter) {
    globalFilter.addEventListener("input", () => {
      resetCollectionPage();
      renderCollection();
    });
  }

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveView(button.dataset.collectionView);
    });
  });

  if (downloadCsvButton) {
    downloadCsvButton.addEventListener("click", downloadFilteredCsv);
  }

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
