package edu.uth.eyewear_store.order.controller;

import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.entity.OrderType;
import edu.uth.eyewear_store.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
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
}