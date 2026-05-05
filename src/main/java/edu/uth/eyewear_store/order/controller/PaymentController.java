package edu.uth.eyewear_store.order.controller;

import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.service.ACBApiService;
import edu.uth.eyewear_store.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment/acb")
@CrossOrigin(origins = "*")
@SuppressWarnings("null")
public class PaymentController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private ACBApiService acbApiService;

    @Autowired
    private edu.uth.eyewear_store.core.repository.SystemConfigRepository configRepository;

    @GetMapping("/qr/{orderId}")
    public ResponseEntity<Map<String, String>> getVietQR(@PathVariable Long orderId) {
        String status = configRepository.findById("PAYMENT_POLLING_STATUS")
                .map(edu.uth.eyewear_store.core.entity.SystemConfig::getConfigValue)
                .orElse("ACTIVE");
        
        if ("MAINTENANCE".equals(status)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Hệ thống thanh toán tự động đang bảo trì. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.");
            return ResponseEntity.status(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
        }

        try {
            Order order = orderService.getOrderById(orderId);
            long amount = order.getTotalAmount().longValue();
            String code = "DONHANG" + order.getId();
            
            String accNo = acbApiService.getAccountNumber();
            String encodedCode = java.net.URLEncoder.encode(code, "UTF-8");

            String qrUrl = String.format("https://img.vietqr.io/image/ACB-%s-compact2.png?amount=%d&addInfo=%s",
                    accNo, amount, encodedCode);

            System.out.println("💳 Generated QR for Order #" + orderId + ": " + qrUrl);

            Map<String, String> response = new HashMap<>();
            response.put("qrUrl", qrUrl);
            response.put("code", code);
            response.put("amount", String.valueOf(amount));
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/check/{orderId}")
    public ResponseEntity<Map<String, Object>> checkPayment(@PathVariable Long orderId) {
        Map<String, Object> response = new HashMap<>();
        try {
            Order order = orderService.getOrderById(orderId);
            
            if (order.getStatus() == OrderStatus.CONFIRMED
                    || order.getStatus() == OrderStatus.SHIPPED
                    || order.getStatus() == OrderStatus.DELIVERED
                    || order.getStatus() == OrderStatus.COMPLETED) {
                response.put("paid", true);
                return ResponseEntity.ok(response);
            }

            String code = "DONHANG" + order.getId();
            double amount = order.getTotalAmount().doubleValue();

            boolean isPaid = acbApiService.checkPayment(code, amount);

            if (isPaid) {
                orderService.markOrderPaid(orderId);
                System.out.println("✅ ACB API: Đã nhận được tiền đơn hàng " + code);
                response.put("paid", true);
            } else {
                response.put("paid", false);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            e.printStackTrace();
            response.put("paid", false);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}