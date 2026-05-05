const API_BASE_URL = 'http://localhost:8081/api';

let productsList = [];

async function loadInventory() {
    const inventoryTable = document.getElementById('inventoryTable');
    if (!inventoryTable) return;

    try {
        inventoryTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">Đang tải dữ liệu kho...</td></tr>';

        // 1. Cần lấy danh sách sản phẩm trước để map ID ra Tên và Hình ảnh
        const productRes = await fetch(`${API_BASE_URL}/products`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        productsList = await productRes.json();

        // 2. Lấy danh sách tồn kho từ InventoryController
        const invRes = await fetch(`${API_BASE_URL}/inventory`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (!invRes.ok) throw new Error('Không thể tải dữ liệu kho.');
        const inventoryData = await invRes.json();

        // 3. Render dữ liệu ra bảng
        inventoryTable.innerHTML = '';
        if (inventoryData.length === 0) {
            inventoryTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">Kho hiện đang trống.</td></tr>';
            return;
        }

        inventoryData.forEach(inv => {
            // Tìm thông tin sản phẩm tương ứng với productId
            const product = productsList.find(p => p.id === inv.productId);

            // Xử lý hình ảnh hiển thị (Lấy ảnh chính hoặc ảnh đầu tiên trong gallery)
            let displayImage = 'placeholder-glass.jpg';
            if (product) {
                displayImage = product.imageUrl || displayImage;
                if (product.galleryImagesJson) {
                    try {
                        const gallery = JSON.parse(product.galleryImagesJson);
                        if (gallery.length > 0) displayImage = gallery[0];
                    } catch(e) {}
                }
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${displayImage}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"></td>
                <td style="font-weight: 500;">${product ? product.name : 'Sản phẩm không xác định (ID: ' + inv.productId + ')'}</td>
                <td><span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${product ? product.sku : 'N/A'}</span></td>
                <td>
                    <strong style="font-size: 1.1rem; color: ${inv.quantity > 10 ? '#10b981' : '#ef4444'};">${inv.quantity}</strong>
                </td>
                <td>
                    <button class="btn" style="background: #3b82f6; margin-right: 5px;" onclick="openUpdateStockModal(${inv.productId}, ${inv.quantity})">Sửa tồn kho</button>
                    <button class="btn" style="background: #ef4444;" onclick="deleteInventoryItem(${inv.productId})">Xóa</button>
                </td>
            `;
            inventoryTable.appendChild(tr);
        });

    } catch (error) {
        console.error('Lỗi load kho:', error);
        inventoryTable.innerHTML = '<tr><td colspan="5" style="text-align:center; color: red;">Lỗi khi lấy dữ liệu kho. Vui lòng thử lại.</td></tr>';
    }
}


async function submitAddStock(productId, quantity) {
    try {
        const formData = new URLSearchParams();
        formData.append('productId', productId);
        formData.append('quantity', quantity);

        const response = await fetch(`${API_BASE_URL}/inventory/add-stock`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok) {
            alert("Đã thêm thành công!");
            loadInventory(); // Reload lại bảng kho
        } else {
            alert("Lỗi khi thêm sản phẩm vào kho.");
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}


async function submitSetStock(productId, newQuantity) {
    try {
        const formData = new URLSearchParams();
        formData.append('productId', productId);
        formData.append('quantity', newQuantity);

        const response = await fetch(`${API_BASE_URL}/inventory/set-stock`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok) {
            alert("Đã cập nhật lại lượng tồn kho!");
            loadInventory();
        } else {
            alert("Lỗi khi cập nhật kho.");
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}


async function deleteInventoryItem(productId) {
    if (!confirm('Bạn có chắc muốn ngừng theo dõi tồn kho cho sản phẩm này?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/inventory/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });

        if (response.ok) {
            loadInventory();
        } else {
            alert("Không thể xóa sản phẩm khỏi kho.");
        }
    } catch (error) {
        console.error("Lỗi xóa kho:", error);
    }
}


function openAddInventoryModal() {
    let prodId = prompt("Nhập ID Sản phẩm cần thêm vào kho:");
    if (!prodId) return;
    let qty = prompt("Nhập số lượng nhập kho:");
    if (qty && !isNaN(qty)) {
        submitAddStock(prodId, parseInt(qty));
    }
}

function openUpdateStockModal(productId, currentQty) {
    let newQty = prompt(`Nhập số lượng tồn kho mới chính xác (Hiện tại: ${currentQty}):`, currentQty);
    if (newQty !== null && newQty !== "") {
        submitSetStock(productId, parseInt(newQty));
    }
}