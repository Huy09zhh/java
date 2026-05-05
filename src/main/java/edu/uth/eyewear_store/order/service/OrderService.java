package edu.uth.eyewear_store.order.service;

import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderItem;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.entity.OrderType;
import edu.uth.eyewear_store.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal; 

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Transactional
    public Order createOrder(Order order) {
        // 1. Kiểm tra tính hợp lệ cơ bản
        if (order.getOrderType() == null) {
            throw new RuntimeException("Order type is required");
        }
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item");
        }

        // 2. Ràng buộc toa kính
        if (order.getOrderType() == OrderType.PRESCRIPTION &&
                (order.getPrescriptionDetails() == null || order.getPrescriptionDetails().isBlank())) {
            throw new RuntimeException("Prescription details are required for prescription orders");
        }

        // 3. Set trạng thái ban đầu
        order.setStatus(order.getOrderType() == OrderType.PRESCRIPTION
                ? OrderStatus.PRESCRIPTION_REVIEW
                : OrderStatus.PENDING);

        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OrderItem item : order.getOrderItems()) {
            item.setOrder(order); // Gắn liên kết 2 chiều

            // Tính thành tiền cho từng món (Giá x Số lượng)
            BigDecimal itemTotal = item.getPrice().multiply(new BigDecimal(item.getQuantity()));

            // Cộng dồn vào tổng tiền của đơn hàng
            calculatedTotal = calculatedTotal.add(itemTotal);
        }

        // Cập nhật lại tổng tiền chính xác do Backend tính toán
        order.setTotalAmount(calculatedTotal);

        // 5. Lưu xuống Database
        return orderRepository.save(order);
    }
}