const API = 'http://localhost:8081/api';
let allOrdersData = [];
let currentEditingOrderId = null;

const orderTypeMap = {
    'AVAILABLE': 'Có Sẵn',
    'PRE_ORDER': 'Đặt Trước',
    'PRESCRIPTION': 'Kính Có Độ'
};

const orderStatusMap = {
    'PENDING': 'Chờ Xử Lý',
    'PRESCRIPTION_REVIEW': 'Chờ Duyệt Toa',
    'CONFIRMED': 'Đã Xác Nhận',
    'PREPARING': 'Đang Chuẩn Bị',
    'PROCESSING_LENS': 'Đang Mài Lắp Tròng',
    'READY_TO_SHIP': 'Chờ Giao ĐVVC',
    'SHIPPED': 'Đang Giao Hàng',
    'DELIVERED': 'Đã Giao',
    'COMPLETED': 'Hoàn Thành',
    'RETURN_REQUESTED': 'Yêu Cầu Trả Hàng',
    'RETURN_PROCESSING': 'Đang Trả Hàng',
    'REFUNDED': 'Đã Hoàn Tiền',
    'CANCELLED': 'Đã Hủy',
    'WARRANTY_REQUESTED': 'Yêu Cầu Bảo Hành',
    'WARRANTY_PROCESSING': 'Đang Bảo Hành'
};

async function loadOrders() {
    try {
        const res = await fetch(`${API}/orders`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') }
        });
        
        if (!res.ok) {
            if (res.status === 401) {
                alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
                localStorage.removeItem('jwt_token');
                window.location.href = 'index.html';
            } else if (res.status === 403) {
                alert("Bạn không có quyền xem danh sách đơn hàng. Vui lòng đăng nhập lại với tài khoản có quyền Quản lý.");
            }
            return;
        }

        allOrdersData = await res.json();

        if (typeof updateDashboardStats === "function") updateDashboardStats(allOrdersData);

        const sortedOrders = [...allOrdersData].sort((a, b) => b.id - a.id);
        renderSalesTable(sortedOrders);

        if (typeof renderOpsTable === "function") renderOpsTable(allOrdersData);
    } catch (e) { }
}

function renderSalesTable(orders) {
    const tbody = document.getElementById('salesTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">Không có đơn hàng nào.</td></tr>';
        return;
    }

    orders.forEach(o => {
        let actionButtons = '';
        const st = o.status;

        if (st === 'PENDING' && o.orderType !== 'PRE_ORDER') {
            actionButtons = `<button class="btn" style="background:#10b981;" onclick="updateStatus(${o.id}, 'CONFIRMED')">Duyệt Đơn (Có sẵn)</button>`;
        }
        else if (st === 'PRESCRIPTION_REVIEW' || (o.orderType === 'PRE_ORDER' && st === 'PENDING')) {
            actionButtons = `<button class="btn" style="background:#2563eb;" onclick="openOrderModal(${o.id})">Xử lý Chi tiết</button>`;
        }
        else if (st === 'WARRANTY_PROCESSING') {
            actionButtons = `<button class="btn" style="background:#10b981;" onclick="updateStatus(${o.id}, 'COMPLETED')">Đã Bảo Hành</button>`;
        }
        else if (st === 'DELIVERED') {
            actionButtons = `<span style="color: #64748b; font-size: 0.85rem;">Chờ khách yêu cầu (nếu có)</span>`;
        }
        else if (st === 'WARRANTY_REQUESTED') {
            actionButtons = `<button class="btn" style="background:#8b5cf6;" onclick="updateStatus(${o.id}, 'WARRANTY_PROCESSING')">Đồng ý bảo hành</button>`;
        }
        else if (st === 'RETURN_REQUESTED') {
            const isExchange = (o.supportNote || '').includes('ĐỔI HÀNG');
            const btnLabel = isExchange ? 'Đồng ý cho đổi hàng' : 'Đồng ý cho trả hàng';
            actionButtons = `<button class="btn" style="background:#f59e0b;" onclick="updateStatus(${o.id}, 'RETURN_PROCESSING')">${btnLabel}</button>`;
        }
        else if (st === 'RETURN_PROCESSING') {
            const isExchange = (o.supportNote || '').includes('ĐỔI HÀNG');
            if (isExchange) {
                actionButtons = `<button class="btn" style="background:#f43f5e;" onclick="updateStatus(${o.id}, 'COMPLETED')">Đã Đổi Hàng</button>`;
            } else {
                actionButtons = `<button class="btn" style="background:#f43f5e;" onclick="updateStatus(${o.id}, 'REFUNDED')">Đã Hoàn Tiền</button>`;
            }
        }

        const loaiDonHienThi = orderTypeMap[o.orderType] || o.orderType;
        const trangThaiHienThi = orderStatusMap[o.status] || o.status;

        let statusColor = '#64748b';
        if (st === 'PENDING') statusColor = '#d97706';
        else if (st === 'CONFIRMED' || st === 'READY_TO_SHIP') statusColor = '#0ea5e9';
        else if (st === 'SHIPPED') statusColor = '#3b82f6';
        else if (st === 'DELIVERED' || st === 'COMPLETED') statusColor = '#10b981';
        else if (st === 'CANCELLED') statusColor = '#ef4444';
        else if (st === 'REFUNDED') statusColor = '#2563eb';
        else if (st.includes('REQUESTED')) statusColor = '#f97316';
        else if (st.includes('PROCESSING')) statusColor = '#8b5cf6';

        const row = `
            <tr>
                <td><b>#ORD-${o.id}</b></td>
                <td><span class="badge" style="background:#f1f5f9; color:#475569">${loaiDonHienThi}</span></td>
                <td><span class="badge" style="background:${statusColor}; color:white">${trangThaiHienThi}</span></td>
                <td>
                    ${o.prescriptionDetails ? '<div style="color:#059669; font-weight:600; font-size:0.8rem;">[Có toa kính]</div>' : ''}
                    <div style="font-size:0.85rem; color:#1e293b; font-weight:600; margin-bottom:4px;">📍 ${o.shippingAddress || 'Chưa có địa chỉ'}</div>
                    <div style="font-size:0.8rem; color:#64748b; white-space: pre-wrap;">${o.supportNote || 'Chưa có ghi chú'}</div>
                </td>
                <td><div style="display:flex; flex-direction:column; gap:5px;">${actionButtons}</div></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterSalesOrders(status) {
    if (!allOrdersData) return;
    let filtered = allOrdersData;
    if (status !== 'ALL') {
        if (status === 'PRE_ORDER') {
            filtered = allOrdersData.filter(o => o.orderType === 'PRE_ORDER');
        } else if (status === 'COMPLAINTS') {
            filtered = allOrdersData.filter(o => o.status.includes('RETURN') || o.status.includes('WARRANTY'));
        } else if (status === 'PENDING') {
            filtered = allOrdersData.filter(o => o.status === 'PENDING' || o.status === 'PRESCRIPTION_REVIEW');
        } else {
            filtered = allOrdersData.filter(o => o.status === status);
        }
    }
    const sorted = [...filtered].sort((a, b) => b.id - a.id);
    renderSalesTable(sorted);
}

function openOrderModal(id) {
    const order = allOrdersData.find(o => o.id === id);
    if (!order) return;
    currentEditingOrderId = id;

    document.getElementById('modalOrderId').innerText = id;
    document.getElementById('modalCustomerInfo').innerText = "Mã KH: " + order.userId;
    document.getElementById('modalPrescription').value = order.prescriptionDetails || '';
    document.getElementById('modalNote').value = order.supportNote || '';

    const presGroup = document.getElementById('prescriptionDetailGroup');
    if (presGroup) {
        presGroup.style.display = (order.orderType === 'PRE_ORDER') ? 'none' : 'block';
    }

    document.getElementById('orderDetailModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
}

async function confirmPrescriptionAndMoveToLab() {
    const note = document.getElementById('modalNote').value;
    const prescription = document.getElementById('modalPrescription').value;

    await callApi(`${API}/orders/${currentEditingOrderId}/support-note`, 'PATCH', note, 'text/plain');
    await callApi(`${API}/orders/${currentEditingOrderId}/prescription`, 'PATCH', prescription, 'text/plain');
    await updateStatus(currentEditingOrderId, 'CONFIRMED');

    alert('Đã duyệt toa kính và xác nhận đơn! Đơn hàng đã được chuyển sang kho Ops.');
    closeModal();
}

async function updateStatus(id, status) {
    const success = await callApi(`${API}/orders/${id}/status?status=${status}`, 'PATCH');
    if (success) {
        alert('Cập nhật trạng thái thành công: ' + status);
        loadOrders();
    } else {
        alert('Lỗi: Không thể cập nhật trạng thái.');
    }
}

function handleComplaint(id, status) {
    if (confirm(`Bạn có chắc muốn chuyển trạng thái đơn sang ${status}?`)) {
        updateStatus(id, status);
    }
}

function updateDashboardStats(orders) {
    if (!document.getElementById('totalOrders')) return;
    
    let revenue = 0;
    let pendingCount = 0;

    orders.forEach(o => {
        const amount = Number(o.totalAmount || 0);
        
        if (o.status === 'DELIVERED') {
            revenue += amount;
        }

        if (o.status === 'PENDING' || o.status === 'PRESCRIPTION_REVIEW') {
            pendingCount++;
        }
    });

    document.getElementById('totalOrders').innerText = orders.length;
    document.getElementById('totalRevenue').innerText = revenue.toLocaleString('vi-VN') + 'đ';
    document.getElementById('pendingOrders').innerText = pendingCount;

    const tbody = document.getElementById('dashboardOrderTable');
    if (tbody) {
        const latestOrders = [...orders].sort((a, b) => b.id - a.id).slice(0, 20);
        tbody.innerHTML = latestOrders.map(o => {
            const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '---';
            return `
                <tr>
                    <td style="color:#64748b; font-size:0.9rem;">${date}</td>
                    <td style="font-weight:600;">#ORD-${o.id}</td>
                    <td><span class="badge" style="background:#f1f5f9; color:#475569;">${orderTypeMap[o.orderType] || o.orderType}</span></td>
                    <td><span class="badge ${o.status.toLowerCase()}">${orderStatusMap[o.status] || o.status}</span></td>
                    <td style="font-weight:700; color:#0f172a;">${(o.totalAmount || 0).toLocaleString('vi-VN')}đ</td>
                </tr>
            `;
        }).join('');
    }
}

async function callApi(url, method, body = null, contentType = 'application/json') {
    try {
        const headers = { 'Authorization': 'Bearer ' + localStorage.getItem('jwt_token') };
        if (body && contentType !== 'text/plain') headers['Content-Type'] = contentType;

        const options = { method, headers };
        if (body) options.body = body;

        const res = await fetch(url, options);
        return res.ok;
    } catch (e) { return false; }
}

function filterDashboard(type, btn) {
    if (!allOrdersData || allOrdersData.length === 0) return;
    const btns = document.querySelectorAll('#dashboardFilterBtns .btn');
    btns.forEach(b => { b.style.background = '#e2e8f0'; b.style.color = '#475569'; });
    if (btn && type !== 'custom') { btn.style.background = '#1e293b'; btn.style.color = 'white'; }

    let filtered = [...allOrdersData];
    const now = new Date();
    let startDate = null;
    let endDate = new Date();

    if (type === '1d') startDate = new Date(now.setHours(0, 0, 0, 0));
    else if (type === '1w') { startDate = new Date(now.setDate(now.getDate() - (now.getDay() || 7) + 1)); startDate.setHours(0,0,0,0); }
    else if (type === '1m') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (type === '1y') startDate = new Date(now.getFullYear(), 0, 1);
    else if (type === 'custom') {
        const s = document.getElementById('filterStart').value;
        const e = document.getElementById('filterEnd').value;
        if (!s || !e) { alert("Chọn ngày!"); return; }
        startDate = new Date(s); startDate.setHours(0,0,0,0);
        endDate = new Date(e); endDate.setHours(23,59,59,999);
    }
    if (type !== 'all') {
        filtered = allOrdersData.filter(o => {
            const d = new Date(o.createdAt);
            return d >= startDate && d <= endDate;
        });
    }
    updateDashboardStats(filtered);
}