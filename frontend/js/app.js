const API_BASE_URL = 'http://localhost:8081/api';
let paymentPollingInterval; 

function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0 đ';
    return Number(amount).toLocaleString('vi-VN') + ' đ';
}

async function loadProducts() {
    const productGrid = document.getElementById('product-grid');
    if (!productGrid) return;

    try {
        productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Đang tải danh sách sản phẩm...</p>';

        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Lỗi tải dữ liệu');
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
                    if (gallery && gallery.length > 0) displayImage = gallery[0];
                } catch(e) {}
            }

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-image">
                    <img src="${displayImage}" alt="${product.name}" onerror="this.src='placeholder-glass.jpg'">
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <!-- Áp dụng formatCurrency toàn cục -->
                    <p class="product-price">${formatCurrency(product.basePrice)}</p>
                    <button class="btn-add-cart" onclick="addToCart(${product.id}, '${product.name.replace(/'/g, "\\'")}', ${product.basePrice}, '${displayImage}')">
                        Thêm Vào Giỏ
                    </button>
                </div>
            `;
            productGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Lỗi:', error);
        productGrid.innerHTML = '<p style="text-align: center; color: red; grid-column: 1 / -1;">Lỗi kết nối máy chủ. Vui lòng thử lại sau.</p>';
    }
}

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function addToCart(id, name, price, image) {
    const existing = cart.find(item => item.productId === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ productId: id, name, price, image, quantity: 1 });
    }
    saveCart();
    alert(`Đã thêm "${name}" vào giỏ hàng!`);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.productId !== id);
    saveCart();
}

function updateQuantity(id, change) {
    const item = cart.find(item => item.productId === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(id);
        } else {
            saveCart();
        }
    }
}

function renderCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalContainer = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count'); // Badge đếm số lượng hiển thị trên menu

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;
    let count = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        count += item.quantity;

        cartItemsContainer.innerHTML += `
            <div class="cart-item" style="display: flex; gap: 10px; margin-bottom: 15px; align-items: center;">
                <img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">
                <div style="flex: 1;">
                    <h4 style="font-size: 0.9rem; margin: 0;">${item.name}</h4>
                    <p style="color: #2563eb; margin: 5px 0 0; font-weight: bold;">${formatCurrency(item.price)}</p>
                </div>
                <div class="qty-controls" style="display: flex; align-items: center; gap: 5px;">
                    <button onclick="updateQuantity(${item.productId}, -1)" style="padding: 2px 6px; cursor: pointer;">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.productId}, 1)" style="padding: 2px 6px; cursor: pointer;">+</button>
                </div>
                <button onclick="removeFromCart(${item.productId})" style="background: #ef4444; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer;">X</button>
            </div>
        `;
    });

    if (cartTotalContainer) cartTotalContainer.innerText = formatCurrency(total);
    if (cartCount) cartCount.innerText = count;
}

function toggleCart() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.classList.toggle('active');
    }
}

document.addEventListener('click', (event) => {
    const cartModal = document.getElementById('cart-modal');
    const cartIcon = document.getElementById('cart-icon');
    
    if (cartModal && cartModal.classList.contains('active')) {
        // Kiểm tra xem vị trí click có nằm ngoài cartModal, cartIcon và các nút Add to Cart không
        if (!cartModal.contains(event.target) && 
            (!cartIcon || !cartIcon.contains(event.target)) && 
            !event.target.closest('.btn-add-cart')) {
            cartModal.classList.remove('active');
        }
    }
});

async function checkout() {
    if (cart.length === 0) {
        alert("Giỏ hàng đang trống, vui lòng chọn sản phẩm trước khi thanh toán!");
        return;
    }

    const shippingAddress = document.getElementById('shipping-address')?.value || 'Nhận tại cửa hàng';
    const customerNote = document.getElementById('customer-note')?.value || '';
    
    const userId = localStorage.getItem('userId') || 1;

    try {
        const orderItems = cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
        }));

        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const orderPayload = {
            userId: userId,
            totalAmount: totalAmount,
            orderType: 'AVAILABLE',
            shippingAddress: shippingAddress,
            supportNote: customerNote ? `[Ghi chú khách]: ${customerNote}` : '',
            orderItems: orderItems
        };

        const orderRes = await fetch(`${API_BASE_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        if (!orderRes.ok) throw new Error("Lỗi khi tạo đơn hàng trên máy chủ");
        const orderData = await orderRes.json();

        cart = [];
        saveCart();
        toggleCart();

        const qrRes = await fetch(`${API_BASE_URL}/payment/acb/qr/${orderData.id}`);
        if (qrRes.ok) {
            const qrData = await qrRes.json();
            
            const qrModal = document.getElementById('qr-modal');
            const qrImage = document.getElementById('qr-image');
            
            if (qrModal && qrImage) {
                qrImage.src = qrData.qrUrl;
                qrModal.style.display = 'flex'; // Mở modal QR
            } else {
                alert(`Đặt hàng thành công! Mã đơn: DONHANG${orderData.id}\nVui lòng chuyển khoản ${formatCurrency(totalAmount)}.\nLink quét QR: ${qrData.qrUrl}`);
            }
        } else {
            alert(`Đặt hàng thành công! Mã đơn của bạn là #${orderData.id}. Chúng tôi sẽ liên hệ sớm nhất.`);
        }

    } catch (error) {
        console.error('Lỗi thanh toán:', error);
        alert("Lỗi khi xử lý đơn hàng, vui lòng thử lại sau.");
    }
}


function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
    if (paymentPollingInterval) clearInterval(paymentPollingInterval);
}

async function loadUserOrders() {
    const userId = localStorage.getItem('userId') || 1; 

    try {
        const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`);
        if (!response.ok) throw new Error("Không thể lấy danh sách đơn hàng");
        const orders = await response.json();

        const tbody = document.getElementById('userOrderHistoryTable');
        if(!tbody) return;
        tbody.innerHTML = '';

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">Bạn chưa có đơn hàng nào.</td></tr>';
        } else {
            orders.forEach(order => {
                let statusColor = '#f59e0b';
                if (order.status === 'COMPLETED' || order.status === 'DELIVERED') statusColor = '#10b981';
                if (order.status === 'CANCELLED' || order.status === 'REFUNDED') statusColor = '#ef4444';

                const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : 'N/A';

                tbody.innerHTML += `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 15px 10px; font-weight: 500;">#ORD-${order.id}</td>
                        <td style="padding: 15px 10px; color: #64748b;">${dateStr}</td>
                        <td style="padding: 15px 10px; color: #e63946; font-weight: bold;">${order.totalAmount.toLocaleString('vi-VN')} đ</td>
                        <td style="padding: 15px 10px; color: ${statusColor}; font-weight: 600;">${order.status}</td>
                        <td style="padding: 15px 10px;">
                            <button onclick="viewOrderDetails(${order.id})" style="padding: 6px 12px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                                Xem chi tiết
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        const modal = document.getElementById('orderHistoryModal');
        if (modal) modal.style.display = 'flex';
    } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
        alert("Có lỗi xảy ra khi tải lịch sử đơn hàng!");
    }
}

async function viewOrderDetails(orderId) {
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error("Không thể tải chi tiết");
        const order = await response.json();

        const detailIdEl = document.getElementById('detailOrderId');
        const detailTotalEl = document.getElementById('detailOrderTotal');
        const itemsContainer = document.getElementById('detailOrderItems');

        if (detailIdEl) detailIdEl.innerText = order.id;
        if (detailTotalEl) detailTotalEl.innerText = order.totalAmount.toLocaleString('vi-VN') + ' đ';
        if (itemsContainer) {
            itemsContainer.innerHTML = '';
            order.orderItems.forEach(item => {
                itemsContainer.innerHTML += `
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #cbd5e1; padding: 12px 0;">
                        <div style="color: #334155;">
                            <span style="font-weight: 600;">Sản phẩm ID: ${item.productId}</span>
                            <span style="color: #64748b; font-size: 0.9rem; margin-left: 5px;">(Số lượng: ${item.quantity})</span>
                        </div>
                        <strong style="color: #1e293b;">${item.price.toLocaleString('vi-VN')} đ</strong>
                    </div>
                `;
            });
        }

        const modal = document.getElementById('customerOrderDetailModal');
        if (modal) modal.style.display = 'flex';
    } catch (error) {
        console.error("Lỗi xem chi tiết:", error);
        alert("Không thể tải chi tiết đơn hàng này!");
    }
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

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    renderCart(); // renderCart đã bao gồm update luôn cart count ở trên (id="cart-count")
});