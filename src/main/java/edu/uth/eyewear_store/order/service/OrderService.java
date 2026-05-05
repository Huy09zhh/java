package edu.uth.eyewear_store.order.service;

import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderItem;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.entity.OrderType;
import edu.uth.eyewear_store.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Transactional
    public Order createOrder(Order order) {
        // 1. Kiểm tra tính hợp lệ cơ bản của đơn hàng
        if (order.getOrderType() == null) {
            throw new RuntimeException("Order type is required");
        }
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item");
        }

        // 2. Nếu là đơn hàng cắt kính (PRESCRIPTION), bắt buộc phải có toa kính
        if (order.getOrderType() == OrderType.PRESCRIPTION &&
                (order.getPrescriptionDetails() == null || order.getPrescriptionDetails().isBlank())) {
            throw new RuntimeException("Prescription details are required for prescription orders");
        }

        // 3. Set trạng thái đơn hàng (Đơn cắt kính cần Sales duyệt toa, đơn thường vào thẳng PENDING)
        order.setStatus(order.getOrderType() == OrderType.PRESCRIPTION
                ? OrderStatus.PRESCRIPTION_REVIEW
                : OrderStatus.PENDING);

        // 4. Gắn liên kết 2 chiều giữa Order và OrderItem (bắt buộc cho Hibernate @OneToMany)
        for (OrderItem item : order.getOrderItems()) {
            item.setOrder(order);
        }

        // 5. Lưu xuống Database
        return orderRepository.save(order);
    }
}