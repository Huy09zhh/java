package edu.uth.eyewear_store.order.controller;

import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.entity.OrderType;
import edu.uth.eyewear_store.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        return orderService.createOrder(order);
    }

    @GetMapping
    public List<Order> getOrders(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) OrderType type) {
        if (status != null) {
            return orderService.getOrdersByStatus(status);
        }
        if (type != null) {
            return orderService.getOrdersByType(type);
        }
        return orderService.getAllOrders();
    }

    @GetMapping("/user/{userId}")
    public List<Order> getOrdersByUser(@PathVariable Long userId) {
        return orderService.getOrdersByUserId(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable @NonNull Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }


    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'SALES', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable @NonNull Long id,
            @RequestParam OrderStatus status,
            Authentication authentication) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, status, authentication));
    }

    @PatchMapping("/{id}/tracking")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Order> updateTracking(
            @PathVariable @NonNull Long id,
            @RequestParam String trackingCode) {
        return ResponseEntity.ok(orderService.updateTrackingCode(id, trackingCode));
    }

    @PatchMapping("/{id}/support-note")
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'MANAGER')")
    public ResponseEntity<Order> addSupportNote(
            @PathVariable @NonNull Long id,
            @RequestBody String note,
            Authentication authentication) {
        String staffName = authentication.getName();
        return ResponseEntity.ok(orderService.addSupportNote(id, note, staffName));
    }

    @PatchMapping("/{id}/prescription")
    @PreAuthorize("hasAnyRole('SALES', 'ADMIN', 'MANAGER')")
    public ResponseEntity<Order> updatePrescription(
            @PathVariable @NonNull Long id,
            @RequestBody String prescriptionDetails) {
        return ResponseEntity.ok(orderService.updatePrescriptionDetails(id, prescriptionDetails));
    }
    
    @PatchMapping("/{id}/refund")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<Order> processRefund(
            @PathVariable @NonNull Long id,
            Authentication authentication) {
        return ResponseEntity.ok(orderService.updateOrderStatus(id, OrderStatus.REFUNDED, authentication));
    }

    @PostMapping("/{id}/ops/pre-order-arrival")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Order> processPreOrderArrival(
            @PathVariable @NonNull Long id,
            Authentication authentication) {
        return ResponseEntity.ok(orderService.processPreOrderArrival(id, authentication));
    }

    @PostMapping("/{id}/ops/start-lens-processing")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Order> startLensProcessing(
            @PathVariable @NonNull Long id,
            Authentication authentication) {
        return ResponseEntity.ok(orderService.startLensProcessing(id, authentication));
    }

    @PostMapping("/{id}/ops/pack-and-waybill")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Order> packAndCreateWaybill(
            @PathVariable @NonNull Long id,
            @RequestParam String trackingCode,
            Authentication authentication) {
        return ResponseEntity.ok(orderService.packAndCreateWaybill(id, trackingCode, authentication));
    }

    @PostMapping("/{id}/ops/dispatch")
    @PreAuthorize("hasAnyRole('OPERATIONS', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Order> dispatchToCarrier(
            @PathVariable @NonNull Long id,
            Authentication authentication) {
        return ResponseEntity.ok(orderService.dispatchToCarrier(id, authentication));
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<Order> requestReturn(
            @PathVariable @NonNull Long id,
            @RequestBody String reason) {
        return ResponseEntity.ok(orderService.requestReturn(id, reason));
    }
}