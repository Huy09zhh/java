const API_BASE_URL = 'http://localhost:8081/api';
let paymentPollingInterval = null;

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

async function loadProducts() {
    const productGrid = document.getElementById('product-grid');

    if (!productGrid) return;

    try {
        productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Đang tải danh sách sản phẩm...</p>';

        const response = await fetch(`${API_BASE_URL}/products`);

        if (!response.ok) {
            throw new Error('Lỗi khi tải dữ liệu sản phẩm từ máy chủ.');
        }

        const products = await response.json();

        productGrid.innerHTML = '';

        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Hiện chưa có sản phẩm nào được bán.</p>';
            return;
        }

        products.forEach(product => {
            if (!product.available) return;

            let displayImage = product.imageUrl || 'placeholder-glass.jpg';
            if (product.galleryImagesJson) {
                try {
                    const gallery = JSON.parse(product.galleryImagesJson);
                    if (Array.isArray(gallery) && gallery.length > 0) {
                        displayImage = gallery[0];
                    }
                } catch (e) {
                }
            }

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${displayImage}" alt="${product.name}" onerror="this.src='placeholder-glass.jpg'">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">${formatCurrency(product.basePrice)}</p>
                    <button class="btn-add-cart" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.basePrice}, '${displayImage}')">Thêm Vào Giỏ</button>
                </div>
            `;

            productGrid.appendChild(productCard);
        });

    } catch (error) {
        productGrid.innerHTML = '<p style="text-align: center; color: red; grid-column: 1 / -1;">Không thể kết nối đến máy chủ. Vui lòng tải lại trang.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartCount();

    const loginModal = document.getElementById('loginModal');
    const accountBtn = document.getElementById('accountBtn');
    const closeLoginBtn = document.getElementById('closeLoginBtn');

    if (accountBtn) {
        accountBtn.addEventListener('click', () => {
            loginModal.style.display = 'flex';
        });
    }

    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            loginModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });
});

function getCart() {
    const cart = localStorage.getItem('tbee_shopping_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('tbee_shopping_cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId, productName, price, imageUrl) {
    let cart = getCart();

    let existingItem = cart.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId: productId,
            name: productName,
            price: parseFloat(price),
            imageUrl: imageUrl,
            quantity: 1
        });
    }

    saveCart(cart);
    alert(`Đã thêm "${productName}" vào giỏ hàng thành công!`);
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartBadge = document.getElementById('cart-badge');
    if (cartBadge) {
        cartBadge.innerText = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

function toggleCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal.style.display === 'none' || modal.style.display === '') {
        modal.style.display = 'flex';
        renderCartItems(); 
    } else {
        modal.style.display = 'none';
    }
}

function renderCartItems() {
    const cart = getCart();
    const container = document.getElementById('cartItemsContainer');
    const totalPriceEl = document.getElementById('cartTotalPrice');

    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; margin-top: 20px;">Giỏ hàng của bạn đang trống.</p>';
        if (totalPriceEl) totalPriceEl.innerText = '0 đ';
        return;
    }

    cart.forEach((item, index) => {
        total += item.price * item.quantity;

        const itemHTML = `
            <div style="display: flex; gap: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                <img src="${item.imageUrl}" alt="${item.name}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="flex: 1;">
                    <h4 style="font-size: 0.9rem; margin: 0 0 5px 0; color: #1e293b;">${item.name}</h4>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #e63946; font-weight: bold;">${item.price.toLocaleString('vi-VN')} đ</span>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 0.9rem; color: #64748b;">x ${item.quantity}</span>
                            <button onclick="removeFromCart(${index})" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.8rem; text-decoration: underline;">Xóa</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHTML);
    });

    if (totalPriceEl) totalPriceEl.innerText = total.toLocaleString('vi-VN') + ' đ';
}

function removeFromCart(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartItems();
}

async function goToCheckout() {
    let cart = getCart();
    if (cart.length === 0) {
        alert("Giỏ hàng đang trống. Vui lòng chọn sản phẩm trước!");
        return;
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.innerText = 'Đang xử lý...';
        checkoutBtn.disabled = true;
    }

    try {
        const orderPayload = {
            orderType: "AVAILABLE",
            totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };

        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('jwt_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resOrder = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(orderPayload)
        });

        if (!resOrder.ok) throw new Error('Không thể tạo đơn hàng');
        const order = await resOrder.json();

        const resQr = await fetch(`${API_BASE_URL}/payment/acb/qr/${order.id}`, { headers: headers });
        if (!resQr.ok) {
            const errData = await resQr.json();
            throw new Error(errData.error || 'Hệ thống thanh toán hiện không khả dụng.');
        }
        const qrData = await resQr.json();

        const cartModal = document.getElementById('cartModal');
        if (cartModal) cartModal.style.display = 'none';

        let paymentModal = document.getElementById('paymentModal');
        if (!paymentModal) {
            const modalHtml = `
                <div id="paymentModal" style="display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:1000; align-items:center; justify-content:center;">
                    <div style="background:white; padding:30px; border-radius:12px; width:400px; text-align:center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                        <h2 style="margin-bottom: 20px; color: #1e293b;">Thanh Toán Đơn Hàng</h2>
                        <img id="qrImage" src="${qrData.qrUrl}" alt="Mã QR Thanh Toán" style="max-width:250px; margin: 0 auto 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
                        <p style="margin-bottom: 10px; font-size: 1.1rem; color: #475569;">Số tiền: <strong id="payAmount" style="color: #e63946;">${formatCurrency(qrData.amount)}</strong></p>
                        <p style="margin-bottom: 20px; font-size: 1.1rem; color: #475569;">Nội dung: <strong id="payContent" style="color: #2563eb;">${qrData.code}</strong></p>
                        <div id="paymentStatus" style="margin-bottom: 20px; padding: 12px; background: #fef3c7; color: #d97706; border-radius: 6px; font-weight: bold;">
                            🔄 Đang chờ thanh toán...
                        </div>
                        <button onclick="closePaymentModal()" style="width: 100%; padding: 12px; background: #64748b; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Đóng Cửa Sổ</button>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            paymentModal = document.getElementById('paymentModal');
        } else {
            paymentModal.style.display = 'flex';
            document.getElementById('qrImage').src = qrData.qrUrl;
            document.getElementById('payAmount').innerText = formatCurrency(qrData.amount);
            document.getElementById('payContent').innerText = qrData.code;
            
            const statusEl = document.getElementById('paymentStatus');
            if (statusEl) {
                statusEl.style.background = '#fef3c7';
                statusEl.style.color = '#d97706';
                statusEl.innerText = '🔄 Đang chờ thanh toán...';
            }
        }

        localStorage.removeItem('tbee_shopping_cart');
        updateCartCount();

        if (paymentPollingInterval) clearInterval(paymentPollingInterval);
        paymentPollingInterval = setInterval(() => checkPayment(order.id), 5000);

    } catch (e) {
        alert('Lỗi đặt hàng: ' + e.message);
    } finally {
        if (checkoutBtn) {
            checkoutBtn.innerText = 'Tiến hành thanh toán';
            checkoutBtn.disabled = false;
        }
    }
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
    if (paymentPollingInterval) clearInterval(paymentPollingInterval);
}

async function checkPayment(orderId) {
    try {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('jwt_token');
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${API_BASE_URL}/payment/acb/check/${orderId}`, { headers: headers });
        const data = await res.json();

        if (data.paid) {
            clearInterval(paymentPollingInterval);
            const statusEl = document.getElementById('paymentStatus');
            if (statusEl) {
                statusEl.style.background = '#dcfce3';
                statusEl.style.color = '#15803d';
                statusEl.innerText = '✅ Thanh toán thành công! Mã đơn: ' + orderId;
            }
        }
    } catch (e) {}
}