const API_BASE_URL = 'http://localhost:8081/api';

let allProducts = [];

let productCache = {};

let currentCartTotal = 0;

let paymentPollingInterval = null;

let currentSelectedProduct = null;

let activeSubFilter = null;

// DOM Elements

const accountBtn = document.getElementById('accountBtn');

const cartBadge = document.getElementById('cartBadge');

const productGrid = document.getElementById('productGrid');

const searchInput = document.getElementById('searchInput');

// Utility

const formatVND = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

const getAuthHeaders = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('jwt_token')}` });

function viType(type) {
    const map = {
        LENS: 'TRÒNG KÍNH',
        FRAME: 'GỌNG KÍNH',
        SUNGLASSES: 'KÍNH MÁT',
        CONTACT_LENS: 'CONTACT LENS'
    };
    return map[type] || type;
}

// Modal Logic

function openModal(id) { document.getElementById(id).classList.add('active'); }

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Init

document.addEventListener('DOMContentLoaded', () => {

    checkAuth();

    fetchProducts();
    loadFooterPolicies();

    // Quick category tiles

    document.querySelectorAll('.category-tile').forEach(tile => {

        tile.onclick = (e) => {

            e.preventDefault();

            const filter = tile.dataset.filter || 'ALL';

            document.querySelectorAll('.nav-filter').forEach(b => {

                b.classList.remove('active');

                b.style.color = 'var(--text-muted)';

            });

            const btn = document.querySelector(`.nav-filter[data-filter="${filter}"]`);

            if (btn) {

                btn.classList.add('active');

                btn.style.color = '#38bdf8';

            }

            activeSubFilter = null;

            renderProducts(filter, searchInput.value, activeSubFilter);

            window.scrollTo({ top: document.getElementById('productGrid').offsetTop - 80, behavior: 'smooth' });

        };

    });

    // Filter Buttons (Nav Links)

    document.querySelectorAll('.nav-filter').forEach(btn => {

        btn.onclick = (e) => {

            e.preventDefault();

            document.querySelectorAll('.nav-filter').forEach(b => {

                b.classList.remove('active');

                b.style.color = 'var(--text-muted)';

            });

            e.target.classList.add('active');

            e.target.style.color = '#38bdf8';

            activeSubFilter = null;

            renderProducts(e.target.dataset.filter, searchInput.value, activeSubFilter);

            // Scroll to product grid
            window.scrollTo({ top: productGrid.offsetTop - 100, behavior: 'smooth' });
        }

    });

    document.querySelectorAll('.sub-filter').forEach(link => {

        link.onclick = (e) => {

            e.preventDefault();

            const parentFilter = link.dataset.parent;

            activeSubFilter = link.dataset.subfilter;

            document.querySelectorAll('.nav-filter').forEach(b => {

                b.classList.remove('active');

                b.style.color = 'var(--text-muted)';

            });

            const parentBtn = document.querySelector(`.nav-filter[data-filter="${parentFilter}"]`);

            if (parentBtn) {

                parentBtn.classList.add('active');

                parentBtn.style.color = '#38bdf8';

            }

            renderProducts(parentFilter, searchInput.value, activeSubFilter);

        };

    });

    // Search

    searchInput.oninput = (e) => {

        const activeFilterBtn = document.querySelector('.nav-filter.active');

        const activeFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : 'ALL';

        renderProducts(activeFilter, e.target.value, activeSubFilter);

    }

});

function checkAuth() {

    const token = localStorage.getItem('jwt_token');

    const roles = JSON.parse(localStorage.getItem('roles') || "[]");

    const isCustomer = roles.some(r => r === 'ROLE_CUSTOMER' || r === 'CUSTOMER');

    if (token) {

        document.getElementById('accountBtn').style.display = 'none';

        document.getElementById('userInfo').style.display = 'flex';

        // Đảm bảo luôn lấy Tên đăng nhập (username) thay vì Họ tên
        let displayName = localStorage.getItem('login_username') || localStorage.getItem('username');
        document.getElementById('userNameDisplay').innerText = displayName;

        document.getElementById('userNameDisplay').onclick = () => openProfile();
        document.getElementById('userNameDisplay').style.cursor = 'pointer';
        document.getElementById('userNameDisplay').title = 'Xem thông tin cá nhân';

        if (isCustomer) {

            document.getElementById('cartBtn').style.display = 'block';

            document.getElementById('adminLink').style.display = 'none';

            updateCartBadge();

        } else {

            document.getElementById('cartBtn').style.display = 'none';

            document.getElementById('adminLink').style.display = 'block';

        }

    } else {

        document.getElementById('accountBtn').style.display = 'block';

        document.getElementById('userInfo').style.display = 'none';

        document.getElementById('cartBtn').style.display = 'none';

        document.getElementById('adminLink').style.display = 'none';

    }

}

document.getElementById('accountBtn').onclick = () => openModal('loginModal');

function logout() {

    localStorage.clear();

    window.location.reload();

}

async function openProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}`, { headers: getAuthHeaders() });
        const user = await res.json();
        document.getElementById('profileFullName').value = user.fullName;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileUsername').value = user.username;
        document.getElementById('profilePassword').value = '';
        document.getElementById('profileMessage').innerText = '';
        openModal('profileModal');
    } catch (e) {
        alert('Không thể tải thông tin cá nhân.');
    }
}

document.getElementById('profileForm').onsubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    const fullName = document.getElementById('profileFullName').value;
    const email = document.getElementById('profileEmail').value;
    const password = document.getElementById('profilePassword').value;

    try {
        const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ fullName, email, password })
        });
        if (res.ok) {
            document.getElementById('profileMessage').innerText = '✅ Cập nhật thành công!';
            checkAuth();
            setTimeout(() => closeModal('profileModal'), 1500);
        } else {
            alert('Lỗi khi cập nhật thông tin.');
        }
    } catch (e) {
        alert('Lỗi kết nối.');
    }
};

function handleSessionError() {

    localStorage.clear();

    closeModal('productModal');

    openModal('loginModal');

    alert("Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!");

}

let isRegisterMode = false;

document.getElementById('toggleAuthMode').onclick = (e) => {

    e.preventDefault();

    isRegisterMode = !isRegisterMode;

    document.getElementById('authTitle').innerText = isRegisterMode ? 'Đăng Ký' : 'Đăng Nhập';

    document.getElementById('authSubmitBtn').innerText = isRegisterMode ? 'Tạo Tài Khoản' : 'Đăng Nhập';

    document.getElementById('toggleAuthMode').innerText = isRegisterMode ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay';

    document.getElementById('fullNameGroup').style.display = isRegisterMode ? 'block' : 'none';

    document.getElementById('emailGroup').style.display = isRegisterMode ? 'block' : 'none';

    document.getElementById('loginError').innerText = '';

};

document.getElementById('loginForm').onsubmit = async (e) => {

    e.preventDefault();

    const username = document.getElementById('username').value;

    const password = document.getElementById('password').value;

    const errorMsg = document.getElementById('loginError');

    try {

        if (isRegisterMode) {

            const fullName = document.getElementById('fullName').value;

            const email = document.getElementById('email').value;

            const res = await fetch(`${API_BASE_URL}/users/register`, {

                method: 'POST', headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ username, password, fullName, email })

            });

            if (res.ok) {

                alert('ÄÄƒng ký thành công! Vui lòng đăng nhập.');

                document.getElementById('toggleAuthMode').click(); // Chuyển về ÄÄƒng nháº­p

            } else {

                errorMsg.innerText = 'Tên đăng nhập hoặc Email đã tồn tại!';

            }

        } else {

            const res = await fetch(`${API_BASE_URL}/auth/login`, {

                method: 'POST', headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ username, password })

            });

            if (res.ok) {

                const data = await res.json();

                localStorage.setItem('jwt_token', data.token);

                localStorage.setItem('username', data.username);
                localStorage.setItem('login_username', data.username);

                localStorage.setItem('userId', data.userId);

                localStorage.setItem('roles', JSON.stringify(data.roles)); // LÆ°u Role

                closeModal('loginModal');

                checkAuth();

                // Redirect to admin portal if staff/admin

                if (data.roles.some(r => r !== 'ROLE_CUSTOMER' && r !== 'CUSTOMER')) {

                    if (confirm("Bạn có quyền Quản trị/Nhân viên. Chuyển đến Trang Quản Trị ERP?")) {

                        window.location.href = 'admin.html';

                    }

                }

            } else {

                errorMsg.innerText = 'Sai tài khoản hoặc mật khẩu';

            }

        }

    } catch (e) { errorMsg.innerText = 'Lỗi kết nối Backend'; }

}

// Products

async function fetchProducts() {

    try {

        const res = await fetch(`${API_BASE_URL}/products`);
        allProducts = await res.json();

        allProducts.forEach(p => productCache[p.id] = p.name);

        // Handle URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlSearch = urlParams.get('search');
        const urlFilter = urlParams.get('filter');
        const urlAction = urlParams.get('action');

        if (urlFilter) {
            // Apply filter from URL
            document.querySelectorAll('.nav-filter').forEach(b => {
                b.classList.remove('active');
                b.style.color = 'var(--text-muted)';
            });
            const btn = document.querySelector(`.nav-filter[data-filter="${urlFilter}"]`);
            if (btn) {
                btn.classList.add('active');
                btn.style.color = '#38bdf8';
            }
            renderProducts(urlFilter, searchInput.value || '');
        } else if (urlSearch) {
            searchInput.value = urlSearch;
            renderProducts('ALL', urlSearch);
        } else {
            renderProducts('ALL', '');
        }

        if (urlAction === 'checkout') {
            // Automatically open checkout modal
            // We need to wait a bit for products/cart to load?
            // Or just call openCheckout()
            setTimeout(() => {
                if (localStorage.getItem('jwt_token')) {
                    openCheckout();
                }
            }, 500);
        }

    } catch (e) { productGrid.innerHTML = `<div style="color:var(--danger)">Lỗi tải sản phẩm. Backend chưa chạy?</div>`; }

}

function renderProducts(filter, search, subFilter = null) {

    let filtered = allProducts;

    if (filter !== 'ALL') filtered = filtered.filter(p => p.type === filter);

    if (subFilter) {

        filtered = filtered.filter(p => p.tags && p.tags.split(',').some(tag => tag.includes(subFilter)));

    }

    if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    productGrid.innerHTML = '';

    if (filtered.length === 0) {

        productGrid.innerHTML = `<div style="padding:20px;color:var(--text-muted)">Không có sản phẩm trong bộ lọc này.</div>`;

        return;

    }

    filtered.forEach(p => {

        // Sá»­ dá»¥ng áº£nh tá»« Backend, náº¿u khÃ´ng cÃ³ thÃ¬ dÃ¹ng áº£nh máº·c Ä‘á»‹nh

        const imgUrl = p.imageUrl || 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80';

        productGrid.innerHTML += `

            <div class="product-card glass" onclick="goToProductDetail(${p.id})" style="position:relative;">
                ${p.discountPercentage > 0 ? `<div class="sale-badge" style="position:absolute; top:12px; right:12px; background:#f43f5e; color:white; padding:4px 10px; border-radius:6px; font-weight:800; font-size:0.85rem; z-index:20; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">-${p.discountPercentage}%</div>` : ''}
                <div class="product-img">
                    <img src="${imgUrl}" alt="${p.name}">
                </div>
                <div class="product-info">
                    <div class="product-type">${viType(p.type)}</div>
                    <div class="product-name">${p.name}</div>
                    <div class="product-price-box" style="display:flex; flex-direction:column; gap:2px; margin-top:5px;">
                        <span class="product-price" style="color:var(--accent); font-weight:700; font-size:1.1rem;">${formatVND(p.basePrice)}</span>
                        ${p.discountPercentage > 0 ? `
                            <span style="text-decoration:line-through; font-size:0.85rem; color:#94a3b8;">
                                ${formatVND(Math.round(p.basePrice / (1 - p.discountPercentage / 100)))}
                            </span>` : ''}
                    </div>
                </div>
            </div>

        `;

    });

}

function goToProductDetail(id) {

    window.location.href = `product.html?id=${id}`;

}

// Product Details & Add to Cart

function showProductDetails(id) {

    currentSelectedProduct = allProducts.find(p => p.id === id);

    if (!currentSelectedProduct) return;

    document.getElementById('modalProductName').innerText = currentSelectedProduct.name;

    document.getElementById('modalProductPrice').innerText = formatVND(currentSelectedProduct.basePrice);

    document.getElementById('modalProductType').innerText = `THÆ¯Æ NG HIá»†U / LOáº I: ${viType(currentSelectedProduct.type)}`;

    document.getElementById('modalProductDesc').innerText = currentSelectedProduct.description || "Chưa có mÃ´ táº£ cho sản phẩm nÃ y.";

    document.getElementById('modalProductImage').src = currentSelectedProduct.imageUrl || 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80';

    const prescSection = document.getElementById('prescriptionSection');

    if (currentSelectedProduct.type === 'FRAME' || currentSelectedProduct.type === 'LENS') {

        prescSection.style.display = 'block';

    } else {

        prescSection.style.display = 'none';

    }

    openModal('productModal');

}

document.getElementById('confirmAddCartBtn').onclick = async () => {

    const userId = localStorage.getItem('userId');

    if (!userId || userId === 'undefined') {

        handleSessionError();

        return;

    }

    const p = currentSelectedProduct;

    try {

        const res = await fetch(`${API_BASE_URL}/cart/${userId}/add?productId=${p.id}&quantity=1&price=${p.basePrice}`, {

            method: 'POST', headers: getAuthHeaders()

        });

        if (res.status === 401 || res.status === 403 || res.status === 400) {

            handleSessionError();

            return;

        }

        if (!res.ok) throw new Error("HTTP " + res.status);

        alert(`ÄÃ£ thÃªm ${p.name} vÃ o giá» hÃ ng`);

        closeModal('productModal');

        updateCartBadge();

    } catch (e) {

        alert('Lá»—i thÃªm giá» hÃ ng! ' + e.message);

    }

}

// Cart

async function updateCartBadge() {
    const userId = localStorage.getItem('userId');
    if (!userId || userId === 'undefined') return;
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}`, { headers: getAuthHeaders() });
        if (res.status === 401 || res.status === 403) {
            handleSessionError();
            return;
        }
        if (!res.ok) return;
        const cart = await res.json();
        const cartBadge = document.getElementById('cartBadge');

        // Tính tổng số lượng của tất cả sản phẩm
        const totalQty = cart.items ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

        if (cartBadge) cartBadge.innerText = totalQty;

        const cartTitle = document.getElementById('cartModalTitle');
        if (cartTitle) cartTitle.innerText = `Giỏ Hàng (${totalQty})`;
    } catch (e) { }
}

document.getElementById('cartBtn').onclick = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId || userId === 'undefined') {
        openModal('loginModal');
        return;
    }
    openModal('cartModal');
    const list = document.getElementById('cartItemsList');
    list.innerHTML = '<div style="padding:20px;text-align:center">Đang tải giỏ hàng...</div>';

    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}`, { headers: getAuthHeaders() });
        const cart = await res.json();

        if (!cart.items || cart.items.length === 0) {
            list.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8">Giỏ hàng đang trống</div>';
            document.getElementById('cartTotalAmount').innerText = '0đ';
            document.getElementById('checkoutBtn').disabled = true;
            if (document.getElementById('cartModalTitle')) document.getElementById('cartModalTitle').innerText = 'Giỏ Hàng (0)';
            return;
        }

        list.innerHTML = '';
        currentCartTotal = 0;

        for (const item of cart.items) {
            const total = item.quantity * item.price;
            currentCartTotal += total;

            // Render immediately using cache or placeholder
            const prod = productCache[item.productId];
            const pName = (prod && prod.name) ? prod.name : `Sản phẩm #${item.productId}`;
            const nameId = `cart-pname-${item.productId}`;

            list.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <div class="cart-item-name" id="${nameId}" style="font-size: 1.05rem; color: #1e293b; font-weight: 600;">${pName}</div>
                        <div class="cart-item-controls" style="margin-top: 10px;">
                            <div class="qty-btns">
                                <button onclick="updateCartQty(${item.productId}, -1, ${item.quantity}, ${item.price}, ${item.id})">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateCartQty(${item.productId}, 1, ${item.quantity}, ${item.price}, ${item.id})">+</button>
                            </div>
                            <div class="cart-item-price">${formatVND(item.price)}</div>
                        </div>
                    </div>
                    <div class="cart-item-remove" onclick="removeFromCart(${item.id})">&times;</div>
                </div>
            `;

            // If not in cache, fetch and update all instances of this product name
            if (!prod || !prod.name) {
                fetch(`${API_BASE_URL}/products/${item.productId}`, { headers: getAuthHeaders() })
                    .then(r => r.json())
                    .then(p => {
                        if (p && p.name) {
                            productCache[item.productId] = p;
                            const els = document.querySelectorAll(`[id^="cart-pname-${item.productId}"]`);
                            els.forEach(el => el.innerText = p.name);
                        }
                    })
                    .catch(err => console.error('Lỗi lấy tên sản phẩm:', item.productId, err));
            }
        }

        const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cartTotalAmount').innerText = formatVND(currentCartTotal);
        document.getElementById('checkoutBtn').disabled = false;
        if (document.getElementById('cartModalTitle')) document.getElementById('cartModalTitle').innerText = `Giỏ Hàng (${totalQty})`;

    } catch (e) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#ef4444">Lỗi tải giỏ hàng</div>';
    }
}

async function updateCartQty(productId, delta, currentQty, price, cartItemId) {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('jwt_token');

    if (currentQty === 1 && delta === -1) {
        removeFromCart(cartItemId);
        return;
    }

    try {
        const url = `${API_BASE_URL}/cart/${userId}/add?productId=${productId}&quantity=${delta}&price=${price}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            document.getElementById('cartBtn').click();
            updateCartBadge();
        }
    } catch (e) { }
}

async function removeFromCart(cartItemId) {
    const token = localStorage.getItem('jwt_token');
    if (!confirm('Xóa sản phẩm này khỏi giỏ hàng?')) return;

    try {
        // Back to using productId removal if items are merged
        const res = await fetch(`${API_BASE_URL}/cart/item/${cartItemId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const cartBtn = document.getElementById('cartBtn');
            if (cartBtn) cartBtn.click();
            updateCartBadge();
        }
    } catch (e) {
        alert('Lỗi kết nối khi xóa.');
    }
}

// Checkout & Payment

async function openCheckout() {
    const userId = localStorage.getItem('userId');
    if (!userId || userId === 'undefined') {
        openModal('loginModal');
        return;
    }
    closeModal('cartModal');

    // Lấy danh sách sản phẩm từ giỏ hàng
    let productsToCheck = [];
    try {
        const res = await fetch(`${API_BASE_URL}/cart/${userId}`, { headers: getAuthHeaders() });
        const cart = await res.json();
        if (cart.items) {
            for (const item of cart.items) {
                // Fetch product if not cached fully
                const pRes = await fetch(`${API_BASE_URL}/products/${item.productId}`);
                const pData = await pRes.json();
                productsToCheck.push(pData);
            }
        }
    } catch (e) { console.error(e); }

    const select = document.getElementById('shipOrderType');
    const options = select.querySelectorAll('option');

    let canAvailable = productsToCheck.length > 0;
    let canPreOrder = productsToCheck.length > 0;
    let canPrescription = productsToCheck.length > 0;

    productsToCheck.forEach(p => {
        if (!p.available) canAvailable = false;
        if (!p.preOrder) canPreOrder = false;
        if (p.showPrescriptionForm === null || !p.showPrescriptionForm) canPrescription = false;
    });

    let firstValidValue = '';

    let isPrescriptionProduct = productsToCheck.some(p => p.showPrescriptionForm);

    options.forEach(opt => {
        if (opt.value === 'AVAILABLE') {
            opt.style.display = canAvailable ? 'block' : 'none';
            if (canAvailable && !firstValidValue) firstValidValue = 'AVAILABLE';
        }
        if (opt.value === 'PRE_ORDER') {
            opt.style.display = canPreOrder ? 'block' : 'none';
            if (canPreOrder && !firstValidValue) firstValidValue = 'PRE_ORDER';
        }
    });

    if (!firstValidValue) {
        alert("Giỏ hàng của bạn có các sản phẩm xung đột về loại đơn hàng. Vui lòng tách đơn hàng!");
        return;
    }

    select.value = firstValidValue;
    openModal('shippingModal');
    document.getElementById('shipName').value = localStorage.getItem('username') || '';

    const fields = document.getElementById('prescriptionFields');
    if (fields) {
        fields.style.display = isPrescriptionProduct ? 'grid' : 'none';
    }
}

function togglePrescriptionFields() {
    // Không làm gì vì đã hiện dựa trên thuộc tính sản phẩm lúc mở modal
}

document.getElementById('checkoutBtn').onclick = () => openCheckout();

document.getElementById('shippingForm').onsubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId');
    const orderType = document.getElementById('shipOrderType').value;
    const payMethod = document.querySelector('input[name="payMethod"]:checked').value;

    const name = document.getElementById('shipName').value;
    const phone = document.getElementById('shipPhone').value;
    const address = document.getElementById('shipAddress').value;
    const note = document.getElementById('shipNote').value;

    let prescriptionDetails = "";
    const fields = document.getElementById('prescriptionFields');
    const isPrescriptionVisible = fields && fields.style.display === 'grid';

    if (isPrescriptionVisible) {
        const lSph = document.getElementById('leftSph')?.value || '0.00';
        const lCyl = document.getElementById('leftCyl')?.value || '0.00';
        const lAxis = document.getElementById('leftAxis')?.value || '0';

        const rSph = document.getElementById('rightSph')?.value || '0.00';
        const rCyl = document.getElementById('rightCyl')?.value || '0.00';
        const rAxis = document.getElementById('rightAxis')?.value || '0';

        const pd = document.getElementById('pdValue')?.value || '60';

        prescriptionDetails = `[L: SPH=${lSph}, CYL=${lCyl}, AXIS=${lAxis}] | [R: SPH=${rSph}, CYL=${rCyl}, AXIS=${rAxis}] | PD=${pd}`;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerText = 'Đang xử lý...';
    submitBtn.disabled = true;

    try {
        const fullAddress = `Người nhận: ${name} | SĐT: ${phone} | ĐC: ${address}`;

        const payload = {
            orderType: orderType,
            shippingAddress: fullAddress,
            customerNote: note || "",
            prescriptionDetails: (orderType === 'PRESCRIPTION') ? prescriptionDetails : ""
        };

        const resOrder = await fetch(`${API_BASE_URL}/cart/${userId}/checkout`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!resOrder.ok) throw new Error('Không thể tạo đơn hàng');
        const order = await resOrder.json();

        if (payMethod === 'COD') {
            alert(`Đặt hàng thành công! (Mã: #ORD-${order.id}). Hình thức: COD. Chúng tôi sẽ giao đến: ${address}`);
            closeModal('shippingModal');
            updateCartBadge();
            submitBtn.innerText = 'XÁC NHẬN ĐẶT HÀNG';
            submitBtn.disabled = false;
            return;
        }

        // Online Payment Flow
        const resQr = await fetch(`${API_BASE_URL}/payment/acb/qr/${order.id}`, { headers: getAuthHeaders() });
        if (!resQr.ok) {
            const errData = await resQr.json();
            throw new Error(errData.error || 'Hệ thống thanh toán hiện không khả dụng.');
        }
        const qrData = await resQr.json();

        closeModal('shippingModal');
        openModal('paymentModal');

        document.getElementById('qrImage').src = qrData.qrUrl;
        document.getElementById('payAmount').innerText = formatVND(qrData.amount);
        document.getElementById('payContent').innerText = qrData.code;

        const statusEl = document.getElementById('paymentStatus');
        statusEl.className = 'status-badge status-pending';
        statusEl.innerText = '🔄 Đang chờ thanh toán...';

        if (paymentPollingInterval) clearInterval(paymentPollingInterval);
        paymentPollingInterval = setInterval(() => checkPayment(order.id), 5000);
        updateCartBadge();
        submitBtn.innerText = 'XÁC NHẬN ĐẶT HÀNG';
        submitBtn.disabled = false;

    } catch (e) {
        alert('Lỗi đặt hàng: ' + e.message);
        submitBtn.innerText = 'XÁC NHẬN ĐẶT HÀNG';
        submitBtn.disabled = false;
    }
};

async function checkPayment(orderId) {

    try {

        const res = await fetch(`${API_BASE_URL}/payment/acb/check/${orderId}`, { headers: getAuthHeaders() });

        const data = await res.json();

        if (data.paid) {

            clearInterval(paymentPollingInterval);

            const statusEl = document.getElementById('paymentStatus');

            statusEl.className = 'status-badge status-success';
            statusEl.innerText = '✅ Thanh toán thành công! Mã: ' + orderId;
            updateCartBadge();

        }

    } catch (e) { }

}

// Order History

async function loadOrderHistory() {

    const userId = localStorage.getItem('userId');

    if (!userId) return;

    try {

        const res = await fetch(`${API_BASE_URL}/orders/user/${userId}`, { headers: getAuthHeaders() });

        const orders = await res.json();

        const tbody = document.getElementById('historyTableBody');

        tbody.innerHTML = '';

        if (orders.length === 0) {

            tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">Chưa có đơn hàng nào.</td></tr>';

            return;

        }

        orders.forEach(o => {
            const st = (o.status || '').toUpperCase();
            let color = '#64748b'; // Mặc định xám
            let statusText = st;

            if (st === 'COMPLETED') { statusText = 'Hoàn Thành'; color = '#10b981'; }
            else if (st === 'DELIVERED') { statusText = 'Đã Giao'; color = '#10b981'; }
            else if (st === 'REFUNDED') { statusText = 'Hoàn Tiền'; color = '#2563eb'; } // Xanh dương
            else if (st === 'SHIPPED') { statusText = 'Đang Giao'; color = '#3b82f6'; }
            else if (st === 'PENDING') { statusText = 'Chờ Xác Nhận'; color = '#f59e0b'; }
            else if (st === 'CONFIRMED') { statusText = 'Đã Xác Nhận'; color = '#0ea5e9'; }
            else if (st === 'RETURN_REQUESTED' || st === 'RETURN_PROCESSING') { statusText = 'Đang Đổi/Trả'; color = '#f97316'; }
            else if (st === 'CANCELLED') { statusText = 'Đã Hủy'; color = '#ef4444'; }

            let actionBtn = '';

            if (st === 'PENDING') {

                actionBtn = `<button class="btn" style="background: #ef4444; padding: 4px 8px; font-size: 0.8rem;" onclick="updateOrderStatusCustomer(${o.id}, 'CANCELLED')">Hủy Đơn</button>`;

            } else if (st === 'COMPLETED' || st === 'DELIVERED') {
                actionBtn = `<button class="btn" style="background: #f59e0b; padding: 4px 8px; font-size: 0.8rem;" onclick="openReturnModalForOrder(${o.id})">📦 Hỗ trợ / Đổi trả</button>`;
            } else if (st === 'RETURN_REQUESTED' || st === 'RETURN_PROCESSING') {
                actionBtn = `<span style="font-size: 0.8rem; color: #f59e0b;">Đang xử lý đổi/trả</span>`;
            } else if (st === 'CANCELLED') {

                actionBtn = `<span style="font-size: 0.8rem; color: #ef4444;">Đã hủy</span>`;

            }

            tbody.innerHTML += `

                <tr style="border-bottom: 1px solid #f1f5f9;">

                    <td style="padding: 10px;"><b>#ORD-${o.id}</b></td>

                    <td style="padding: 10px;">${o.orderType || 'AVAILABLE'}</td>

                    <td style="padding: 10px;">${formatVND(o.totalAmount)}</td>

                    <td style="padding: 10px; font-weight: 600; color: ${color};">${statusText}</td>

                    <td style="padding: 10px;">${actionBtn}</td>

                </tr>

            `;

        });

    } catch (e) { console.error('Lỗi tải lịch sử đơn', e); }

}

async function updateOrderStatusCustomer(orderId, newStatus) {

    if (newStatus === 'CANCELLED' && !confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;

    if (newStatus === 'RETURN_REQUESTED' && !confirm('Gửi yêu cầu đổi/trả cho đơn hàng này? Nhân viên sẽ liên hệ bạn.')) return;

    try {

        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status?status=${newStatus}`, {

            method: 'PATCH',

            headers: getAuthHeaders()

        });

        if (res.ok) {

            alert('Thao tác thành công!');

            loadOrderHistory();

        } else {

            alert('Lỗi thao tác.');

        }

    } catch (e) {

        alert('Lỗi kết nối.');

    }

}



// Logic cho Yêu Cầu Đổi/Trả
async function loadOrdersForReturn() {
    const userId = localStorage.getItem('userId');
    const select = document.getElementById('returnOrderSelect');
    try {
        const res = await fetch(`${API_BASE_URL}/orders/user/${userId}`, { headers: getAuthHeaders() });
        const orders = await res.json();
        // Lọc các đơn đã giao thành công (DELIVERED hoặc COMPLETED)
        const eligibleOrders = orders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED');

        if (eligibleOrders.length === 0) {
            select.innerHTML = '<option value="">-- Không có đơn hàng đủ điều kiện --</option>';
            return;
        }

        select.innerHTML = '<option value="">-- Chọn đơn hàng --</option>';
        eligibleOrders.forEach(o => {
            select.innerHTML += `<option value="${o.id}">Mã: #ORD-${o.id} - ${formatVND(o.totalAmount)}</option>`;
        });
    } catch (e) {
        select.innerHTML = '<option value="">-- Lỗi tải đơn hàng --</option>';
    }
}

// Gán sự kiện mở modal Đổi/Trả thì load đơn hàng
const originalOpenModal = openModal;
window.openModal = function (modalId) {
    if (modalId === 'returnModal') loadOrdersForReturn();
    originalOpenModal(modalId);
};

function openReturnModalForOrder(orderId) {
    closeModal('historyModal');
    openModal('returnModal');
    // Đợi modal load xong thì set giá trị select
    setTimeout(() => {
        const select = document.getElementById('returnOrderSelect');
        select.value = orderId;
    }, 200);
}

document.getElementById('returnForm').onsubmit = async (e) => {
    e.preventDefault();
    const orderId = document.getElementById('returnOrderSelect').value;
    const type = document.getElementById('returnType').value; // ĐỔI HÀNG, TRẢ HÀNG, BẢO HÀNH
    const reason = document.getElementById('returnReason').value;
    const messageEl = document.getElementById('returnMessage');

    if (!orderId) {
        alert('Vui lòng chọn đơn hàng!');
        return;
    }

    // Xác định trạng thái mục tiêu dựa trên loại yêu cầu
    let targetStatus = 'RETURN_REQUESTED';
    if (type === 'BẢO HÀNH') targetStatus = 'WARRANTY_REQUESTED';

    try {
        // 1. Lưu ghi chú lý do vào Support Note (thông qua API return)
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/return`, {
            method: 'POST',
            headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' },
            body: `[KHÁCH GỬI YÊU CẦU - ${type}]: ${reason}`
        });

        if (res.ok) {
            messageEl.innerText = '✅ Đã gửi yêu cầu thành công! Nhân viên sẽ xử lý.';
            setTimeout(() => {
                closeModal('returnModal');
                loadOrderHistory(); // Refresh history
            }, 2000);
        } else {
            alert('Lỗi: Không thể gửi yêu cầu. Vui lòng thử lại sau.');
        }
    } catch (e) {
        alert('Lỗi kết nối.');
    }
};

async function loadFooterPolicies() {
    const footerList = document.getElementById('footerPolicyList');
    if (!footerList) return;

    try {
        const res = await fetch(`${API_BASE_URL}/policies`);
        if (res.ok) {
            const policies = await res.json();
            if (policies.length > 0) {
                footerList.innerHTML = policies.map(p => `
                    <li><a href="policies.html?tab=${p.code}">${p.title}</a></li>
                `).join('');
            }
        }
    } catch (e) {
        console.error("Lỗi nạp chính sách footer:", e);
    }
}
