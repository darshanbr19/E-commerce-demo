// ===== ELEMENT REFERENCES =====
const productContainer = document.getElementById("products");

// cart
const cartPopup = document.getElementById("cart-popup");
const cartItemsList = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const totalPriceEl = document.getElementById("total-price");

// search
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

// login UI
const welcomeText = document.getElementById("welcome-text");
const loginLink = document.getElementById("login-link");
const logoutBtn = document.getElementById("logout-btn");

// category buttons
const filterButtons = document.querySelectorAll(".filter-btn");

// ===== CART (persistent) =====
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

// ===== DISPLAY PRODUCTS =====
function displayProducts(list = products) {
    if (!productContainer) return;

    if (!list.length) {
        productContainer.innerHTML = "<p>No products found.</p>";
        return;
    }

    productContainer.innerHTML = list.map(p => `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p><strong>Category:</strong> ${p.category}</p>
            <p class="price">₹${p.price}</p>

            <div class="product-actions">
                <button class="btn amazon-add" onclick="addToCart(${p.id}, 1, this)">Add to Cart</button>
                <button class="btn buy-now" onclick="buyNow(${p.id})">Buy Now</button>
            </div>
        </div>
    `).join("");
}

// ===== CART HELPERS =====
function findProduct(id) {
    return products.find(p => p.id === id);
}

function persistCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCart() {
    if (!cartItemsList || !cartCount || !totalPriceEl) return;

    if (cart.length === 0) {
        cartItemsList.innerHTML = "<li>Your cart is empty.</li>";
        cartCount.textContent = "0";
        totalPriceEl.textContent = "0";
        return;
    }

    cartItemsList.innerHTML = cart.map(item => `
        <li class="cart-item" data-id="${item.id}">
            <div style="flex:1;">
                <strong>${item.name}</strong><br>
                <small>₹${item.price} each</small>
            </div>

            <div class="qty-controls">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
                <span class="qty-display">${item.qty}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
                <button class="qty-btn" onclick="removeFromCart(${item.id})" title="Remove">✕</button>
            </div>
        </li>
    `).join("");

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    cartCount.textContent = cart.reduce((s, i) => s + i.qty, 0);
    totalPriceEl.textContent = total;
}

// ===== TOAST & WARNING (no browser alerts) =====
function showToast(message) {
    let toast = document.getElementById("global-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "global-toast";
        toast.className = "added-toast"; // uses existing CSS
        document.body.appendChild(toast);
    }

    toast.textContent = message;

    setTimeout(() => toast.classList.add("show"), 10);
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 1500);
}

function showWarning(message) {
    let warnBox = document.getElementById("warning-box");
    if (!warnBox) {
        warnBox = document.createElement("div");
        warnBox.id = "warning-box";
        warnBox.className = "warning-box"; // styled in style.css
        document.body.prepend(warnBox);
    }
    warnBox.textContent = message;
}

// ===== CART ACTIONS =====
function addToCart(id, qty = 1, btnEl = null) {
    const product = findProduct(id);
    if (!product) return;

    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.qty = existing.qty + qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: qty,
            image: product.image
        });
    }

    persistCart();
    updateCart();
    showToast(`"${product.name}" added to cart`);
}

function buyNow(id) {
    addToCart(id, 1);
    openCart();
}

function changeQty(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty = item.qty + delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    persistCart();
    updateCart();
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    persistCart();
    updateCart();
}

function clearCart() {
    if (cart.length === 0) {
        // no alert; just a small info message
        showWarning("Your cart is already empty.");
        return;
    }

    // directly clear cart, no confirm popup
    cart = [];
    persistCart();
    updateCart();
    showToast("Your cart has been cleared.");
}

// ===== CART UI (open/close) =====
function openCart() {
    if (cartPopup) cartPopup.style.display = "block";
    updateCart();
}

function closeCart() {
    if (cartPopup) cartPopup.style.display = "none";
}

// ===== PLACE ORDER =====
function placeOrder() {
    const userJSON = localStorage.getItem("loggedInUser");

    if (!userJSON) {
        // no alert, just warning + redirect
        showWarning("Please login first to place an order.");
        window.location.href = "login.html";
        return;
    }

    if (cart.length === 0) {
        showWarning("Your cart is empty.");
        return;
    }

    const user = JSON.parse(userJSON);
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");

    orders.push({
        id: Date.now(),
        userEmail: user.email,
        items: cart,
        total: cart.reduce((s, i) => s + i.price * i.qty, 0),
        date: new Date().toLocaleString()
    });

    localStorage.setItem("orders", JSON.stringify(orders));

    // success message (toast, not alert)
    showToast("Order placed successfully!");

    cart = [];
    persistCart();
    updateCart();
    closeCart();
}

// expose functions for HTML onclick attributes
window.openCart = openCart;
window.closeCart = closeCart;
window.placeOrder = placeOrder;
window.addToCart = addToCart;
window.buyNow = buyNow;
window.clearCart = clearCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;

// ===== SEARCH =====
function filterSearch() {
    if (!searchInput) return;

    const term = searchInput.value.trim().toLowerCase();
    if (!term) {
        displayProducts(products);
        return;
    }

    const filtered = products.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
    );

    displayProducts(filtered);
}

if (searchBtn) {
    searchBtn.addEventListener("click", filterSearch);
}

if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") filterSearch();
        if (searchInput.value.trim() === "") displayProducts(products);
    });
}

// ===== CATEGORY FILTER =====
if (filterButtons && filterButtons.length) {
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const category = btn.getAttribute("data-category");

            if (category === "All") {
                displayProducts(products);
            } else {
                const filtered = products.filter(p => p.category === category);
                displayProducts(filtered);
            }

            // clear search text when category clicked
            if (searchInput) searchInput.value = "";
        });
    });
}

// ===== LOGIN / LOGOUT UI =====
function updateUserUI() {
    const userJSON = localStorage.getItem("loggedInUser");

    if (!welcomeText || !loginLink || !logoutBtn) return;

    if (userJSON) {
        const user = JSON.parse(userJSON);
        welcomeText.textContent = "Hi, " + user.name;
        loginLink.style.display = "none";
        logoutBtn.style.display = "inline-block";
    } else {
        welcomeText.textContent = "Guest";
        loginLink.style.display = "inline-block";
        logoutBtn.style.display = "none";
    }
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        updateUserUI();
    });
}

// ===== INITIAL LOAD =====
displayProducts(products);
updateUserUI();
updateCart();
