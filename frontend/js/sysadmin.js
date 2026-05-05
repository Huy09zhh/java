async function loadAuditLogs() {
    try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch('http://localhost:8081/api/audit-logs', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const tbody = document.getElementById('auditLogTable');

        if (res.ok) {
            const logs = await res.json();
            tbody.innerHTML = logs.map(log => {
                const date = new Date(log.createdAt).toLocaleString('vi-VN');
                return `
                    <tr>
                        <td>${date}</td>
                        <td style="font-weight:600;">${log.username}</td>
                        <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${log.action}</span></td>
                        <td>${log.entityName}</td>
                        <td>${log.entityId}</td>
                        <td>${log.details || ''}</td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Lỗi tải dữ liệu. Bạn có đủ quyền?</td></tr>';
        }
    } catch (e) {
        document.getElementById('auditLogTable').innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Không thể kết nối đến server.</td></tr>';
    }
}

async function loadSystemConfigs() {
    try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch('http://localhost:8081/api/sys-config', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            const configs = await res.json();
            configs.forEach(conf => {
                if (conf.configKey === 'ACB_ACCOUNT') {
                    document.getElementById('configAcbAccount').value = conf.configValue;
                }
                if (conf.configKey === 'ACB_STATUS') {
                    document.getElementById('configAcbStatus').value = conf.configValue;
                }
            });
        }
    } catch (e) {
    }
}

async function saveSysConfig() {
    const account = document.getElementById('configAcbAccount').value;
    const status = document.getElementById('configAcbStatus').value;
    try {
        const token = localStorage.getItem('jwt_token');
        const res = await fetch('http://localhost:8081/api/sys-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify([
                { configKey: 'ACB_ACCOUNT', configValue: account },
                { configKey: 'ACB_STATUS', configValue: status }
            ])
        });
        if (res.ok) {
            alert('Lưu cấu hình hệ thống thành công!');
        } else {
            alert('Lỗi lưu cấu hình. Vui lòng thử lại!');
        }
    } catch (e) {
        alert('Không thể kết nối đến server.');
    }
}