
const API_BASE_URL = 'http://localhost:8081/api';

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

async function loadProducts() {
    const productGrid = document.getElementById('product-grid');

    // Nếu không tìm thấy element chứa grid (ví dụ đang ở trang admin), thì bỏ qua
    if (!productGrid) return;

    try {

        productGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1;">Đang tải danh sách sản phẩm...</p>';

        const response = await fetch(`${API_BASE_URL}/products`);

        if (!response.ok) {
            throw new Error('Lỗi khi tải dữ liệu sản phẩm từ máy chủ.');
        }

        const products = await response.json();

        // 2. Xóa trạng thái loading
        productGrid.innerHTML = '';

        // Kiểm tra nếu danh sách rỗng
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
                    console.error("Lỗi đọc mảng hình ảnh của sản phẩm:", product.id);
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
                    <!-- Nút Thêm vào giỏ hàng sẽ được TV3 viết logic xử lý ở bước C15 -->
                    <button class="btn-add-cart" onclick="addToCart(${product.id}, ${product.basePrice})">Thêm Vào Giỏ</button>
                </div>
            `;

            productGrid.appendChild(productCard);
        });

    } catch (error) {
        console.error('Chi tiết lỗi tải sản phẩm:', error);
        productGrid.innerHTML = '<p style="text-align: center; color: red; grid-column: 1 / -1;">Không thể kết nối đến máy chủ. Vui lòng tải lại trang.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});


function addToCart(productId, price) {
    console.log(`Đã chọn sản phẩm ID: ${productId} với giá ${price} để thêm vào giỏ.`);
    alert(`Đã thêm sản phẩm ID: ${productId} vào giỏ hàng!`);
}