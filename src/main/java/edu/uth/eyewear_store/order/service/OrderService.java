package edu.uth.eyewear_store.order.service;

import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderItem;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.entity.OrderType;
import edu.uth.eyewear_store.order.repository.OrderRepository;
import edu.uth.eyewear_store.operations.service.InventoryService; // Thêm thư viện gọi Service của Kho

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryService inventoryService;

    @Transactional
    public Order createOrder(Order order) {
        if (order.getOrderType() == null) {
            throw new RuntimeException("Order type is required");
        }
        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            throw new RuntimeException("Order must contain at least one item");
        }
        if (order.getOrderType() == OrderType.PRESCRIPTION &&
                (order.getPrescriptionDetails() == null || order.getPrescriptionDetails().isBlank())) {
            throw new RuntimeException("Prescription details are required for prescription orders");
        }

        order.setStatus(order.getOrderType() == OrderType.PRESCRIPTION
                ? OrderStatus.PRESCRIPTION_REVIEW
                : OrderStatus.PENDING);

        BigDecimal calculatedTotal = BigDecimal.ZERO;
        for (OrderItem item : order.getOrderItems()) {
            item.setOrder(order);
            BigDecimal itemTotal = item.getPrice().multiply(new BigDecimal(item.getQuantity()));
            calculatedTotal = calculatedTotal.add(itemTotal);
        }
        order.setTotalAmount(calculatedTotal);

        return orderRepository.save(order);
    }


    // Hàm lấy đơn hàng theo ID
    public Order getOrderById(@NonNull Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    // Hàm cập nhật trạng thái đơn và TỰ ĐỘNG TRỪ KHO
    @Transactional
    public Order updateOrderStatus(@NonNull Long id, OrderStatus newStatus) {
        Order order = getOrderById(id);
        OrderStatus oldStatus = order.getStatus();

        // Kiểm tra: Nếu đơn hàng chuyển sang trạng thái "Đã gửi hàng" (SHIPPED) thì tiến hành trừ kho
        if (newStatus == OrderStatus.SHIPPED && oldStatus != OrderStatus.SHIPPED) {
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    // Gọi hàm reduceStock từ InventoryService của TV2
                    inventoryService.reduceStock(item.getProductId(), item.getQuantity());
                }
            }
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }
}