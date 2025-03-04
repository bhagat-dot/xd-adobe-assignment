let allProducts = []; // Stores all fetched products
let filteredProducts = [];
let currentIndex = 0;
let isAscending = true; // Toggle state
const productsPerLoad = 10; // Number of products per click
const sidePanel = document.getElementById("side-panel");

document.addEventListener("DOMContentLoaded", () => {
  showShimmerLoader();
  fetchDataWithRetries(3);
  document
    .getElementById("search-bar")
    .addEventListener("keyup", debounce(filterProducts, 300));

  document.querySelectorAll(".sort-product").forEach((button) => {
    button.addEventListener("click", sortProducts);
  });

  document.getElementById("hamburger").addEventListener("click", sidePanelOpen);

  document.getElementById("close-panel").addEventListener("click", () => {
    sidePanel.classList.remove("active");
  });
});

const loadMoreBtn = document.getElementById("load-more");

const fetchDataWithRetries = async (maxRetries = 3, timeout = 5000) => {
  const productsContainer = document.querySelector(".products");

  if (!productsContainer) {
    console.error("Element with class 'products' not found!");
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      allProducts = await fetchWithTimeout(
        "https://fakestoreapi.com/products",
        timeout
      );
      filteredProducts = allProducts;

      if (allProducts.length > productsPerLoad) {
        loadMoreBtn.style.display = "block";
      }
      displayData();
      return;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === maxRetries) {
        productsContainer.innerHTML = `<p class="error">⚠️ Unable to load products. Please check your connection and try again.</p>`;
      }
    }
  }
};

const fetchWithTimeout = async (url, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
};

const displayData = () => {
  const productsContainer = document.querySelector(".products");
  const productCount = document.getElementById("product-count");
  if (!productsContainer) return;

  if (currentIndex === 0) {
    productsContainer.innerHTML = ""; // Clear only when displaying from start
  }

  const nextProducts = filteredProducts.slice(
    currentIndex,
    currentIndex + productsPerLoad
  );

  nextProducts.forEach(({ image, title, price }) => {
    const productHTML = `
        <div class="product">
          <img src="${image}" alt="${title}">
          <h2>${title}</h2>
          <h3>$${price}</h3>
          <i class="fa-regular fa-heart" style="font-size:24px; width:100%; text-align:left"></i>
        </div>
      `;
    productsContainer.insertAdjacentHTML("beforeend", productHTML);
  });

  productCount.textContent = `${productsContainer.children.length} Results`;

  currentIndex += productsPerLoad;
  loadMoreBtn.style.display =
    currentIndex < filteredProducts.length ? "block" : "none";
};

const filterProducts = () => {
  const selectedFilters = [
    ...document.querySelectorAll(".filter-checkbox:checked"),
  ].map((cb) => cb.value);

  if (selectedFilters.length === 0) {
    filteredProducts = allProducts; // Show all if no filters selected
  } else {
    filteredProducts = allProducts.filter((product) => {
      const isCategoryMatch = selectedFilters.includes(
        product.category.toLowerCase()
      );
      return isCategoryMatch;
    });
  }

  currentIndex = 0;
  displayData();
};

// Debounce Function (Prevents excessive API calls)
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Shimmer Loader (Skeleton UI)
const showShimmerLoader = () => {
  const productsContainer = document.querySelector(".products");
  if (currentIndex === 0) {
    productsContainer.innerHTML = ""; // Only clear when starting from the first record
  }

  const shimmerHTML = Array(productsPerLoad)
    .fill(
      `
    <div class="shimmer-product">
      <div class="shimmer-image"></div>
      <div class="shimmer-text"></div>
      <div class="shimmer-text small"></div>
      
    </div>
  `
    )
    .join("");

  productsContainer.innerHTML = shimmerHTML;
};

const sortProducts = () => {
  // Sort based on the toggle state
  filteredProducts.sort((a, b) =>
    isAscending ? a.price - b.price : b.price - a.price
  );

  isAscending = !isAscending; // Toggle the sorting order
  currentIndex = 0;
  displayData(); // Refresh the product list
};

const sidePanelOpen = () => {
  sidePanel.classList.add("active");
  const filters = document.querySelector(".filter-category").cloneNode(true);
  const slider = document.getElementById("side-panel");
  slider.append(filters);
};

// Load More Button Event Listener
loadMoreBtn.addEventListener("click", displayData);

document.querySelectorAll(".filter-checkbox").forEach((checkbox) => {
  checkbox.addEventListener("change", filterProducts);
});
