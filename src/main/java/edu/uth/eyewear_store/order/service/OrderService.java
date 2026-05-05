package edu.uth.eyewear_store.order.service;

import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderItem;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.entity.OrderType;
import edu.uth.eyewear_store.order.repository.OrderRepository;
import edu.uth.eyewear_store.operations.service.InventoryService;
import edu.uth.eyewear_store.core.service.AuditLogService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private AuditLogService auditLogService;
    
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

            BigDecimal quantity = BigDecimal.valueOf(item.getQuantity());
            BigDecimal itemTotal = item.getPrice().multiply(quantity);

            calculatedTotal = calculatedTotal.add(itemTotal);
        }

        calculatedTotal = calculatedTotal.setScale(0, RoundingMode.HALF_UP);

        order.setTotalAmount(calculatedTotal);

        return orderRepository.save(order);
    }


    public Order getOrderById(@NonNull Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @Transactional
    public Order updateOrderStatus(@NonNull Long id, OrderStatus newStatus) {
        Order order = getOrderById(id);
        OrderStatus oldStatus = order.getStatus();

        // Kiểm tra: Nếu đơn hàng chuyển sang trạng thái "Đã gửi hàng" (SHIPPED) thì tiến hành trừ kho
        if (newStatus == OrderStatus.SHIPPED && oldStatus != OrderStatus.SHIPPED) {
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    inventoryService.reduceStock(item.getProductId(), item.getQuantity());
                }
            }
        }

        order.setStatus(newStatus);
        return orderRepository.save(order);
    }


    @Transactional
    public Order requestReturn(@NonNull Long id, String reason) {
        Order order = getOrderById(id);

        // Chỉ cho phép đổi trả khi đơn đã giao (DELIVERED) hoặc hoàn thành (COMPLETED)
        if (order.getStatus() != OrderStatus.DELIVERED && order.getStatus() != OrderStatus.COMPLETED) {
            throw new RuntimeException("Đơn hàng chưa giao thành công, không thể đổi trả.");
        }

        // Kiểm tra từ khóa trong lý do để phân loại là BẢO HÀNH hay ĐỔI TRẢ bình thường
        if (reason != null && reason.toUpperCase().contains("BẢO HÀNH")) {
            order.setStatus(OrderStatus.WARRANTY_REQUESTED);
        } else {
            order.setStatus(OrderStatus.RETURN_REQUESTED);
        }

        order.setReturnReason(reason);

        // Thêm ghi chú vào hệ thống support
        String timestamp = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
        String returnNote = String.format("\n[%s] Yêu cầu từ khách: %s", timestamp, reason);
        order.setSupportNote(order.getSupportNote() == null ? returnNote : order.getSupportNote() + returnNote);

        // Ghi Log hệ thống
        if (auditLogService != null) {
            auditLogService.logAction("UPDATE", "ORDER", id.toString(), "Yêu cầu đổi/trả đơn hàng: " + reason);
        }

        return orderRepository.save(order);
    }
}