package edu.uth.eyewear_store.core.config;

import edu.uth.eyewear_store.core.entity.Role;
import edu.uth.eyewear_store.core.entity.User;
import edu.uth.eyewear_store.core.entity.Product;
import edu.uth.eyewear_store.core.repository.ProductRepository;
import edu.uth.eyewear_store.core.repository.RoleRepository;
import edu.uth.eyewear_store.core.repository.UserRepository;
import edu.uth.eyewear_store.operations.entity.Inventory;
import edu.uth.eyewear_store.operations.repository.InventoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {

        // 1. Tạo các Role mặc định nếu chưa có
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(null, "ROLE_CUSTOMER"));
            roleRepository.save(new Role(null, "ROLE_SALES"));
            roleRepository.save(new Role(null, "ROLE_OPERATIONS"));
            roleRepository.save(new Role(null, "ROLE_MANAGER"));
            roleRepository.save(new Role(null, "ROLE_ADMIN"));
        }

        // 2. Tạo sẵn các tài khoản cơ bản nếu database trống
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").get();
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            User adminUser = User.builder()
                    .username("admin").email("admin@eyewearstore.com")
                    .password(passwordEncoder.encode("123456")).fullName("System Administrator")
                    .roles(roles).build();
            userRepository.save(adminUser);
            System.out.println("====== ĐÃ TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH (admin / 123456) ======");
        }

        if (!userRepository.existsByUsername("sales")) {
            Role salesRole = roleRepository.findByName("ROLE_SALES").get();
            Set<Role> salesRoles = new HashSet<>();
            salesRoles.add(salesRole);
            userRepository.save(User.builder().username("sales").email("sales@eyewear.com")
                    .password(passwordEncoder.encode("123456")).fullName("Nhân viên Sales")
                    .roles(salesRoles).build());
        }

        if (!userRepository.existsByUsername("ops")) {
            Role opsRole = roleRepository.findByName("ROLE_OPERATIONS").get();
            Set<Role> opsRoles = new HashSet<>();
            opsRoles.add(opsRole);
            userRepository.save(User.builder().username("ops").email("ops@eyewear.com")
                    .password(passwordEncoder.encode("123456")).fullName("Nhân viên Kho")
                    .roles(opsRoles).build());
        }

        if (!userRepository.existsByUsername("manager")) {
            Role managerRole = roleRepository.findByName("ROLE_MANAGER").get();
            Set<Role> managerRoles = new HashSet<>();
            managerRoles.add(managerRole);
            userRepository.save(User.builder().username("manager").email("manager@eyewear.com")
                    .password(passwordEncoder.encode("123456")).fullName("Quản lý")
                    .roles(managerRoles).build());
        }

        if (!userRepository.existsByUsername("customer")) {
            Role customerRole = roleRepository.findByName("ROLE_CUSTOMER").get();
            Set<Role> customerRoles = new HashSet<>();
            customerRoles.add(customerRole);
            userRepository.save(User.builder().username("customer").email("customer@eyewear.com")
                    .password(passwordEncoder.encode("123456")).fullName("Khách hàng VIP")
                    .roles(customerRoles).build());
        }

        // 3. Tạo dữ liệu 5 Sản phẩm mẫu cho demo
        if (productRepository.count() == 0) {
            List<Product> demoProducts = List.of(
                    buildProduct("TRÒNG KÍNH ĐỔI MÀU 1.50 ESSILOR TRANSITIONS GEN S",
                            "LENS-ESSILOR-GENS-150", "LENS", "5000",
                            "https://matkinhsaigon.com.vn/img/product/1746346945-Trong_Kinh_Essilor_TransitionsGenS_4.jpg",
                            "lens_blue_light,lens_photochromic,lens_index_150"),
                    buildProduct("TRÒNG KÍNH 1.56 ZEISS DURAVISION GOLD UV",
                            "LENS-ZEISS-GOLDUV-156", "LENS", "2500",
                            "https://matkinhsaigon.com.vn/img/product/1773018487_6u8b1L1wo5_69ae1d774d790.jpg",
                            "lens_zeiss,lens_premium,lens_index_156,lens_blue_light"),
                    buildProduct("KÍNH KIỂM SOÁT CẬN THỊ ZEISS MYOCARE",
                            "LENS-ZEISS-MYOCARE", "LENS", "3000",
                            "https://matkinhsaigon.com.vn/img/product/1739782388-Tròng_Kính_Zeiss_MyoCare.jpg",
                            "lens_zeiss,lens_myope_control,lens_kid"),
                    buildProduct("TRÒNG KÍNH 1.55 HOYA NULUX FULL CONTROL",
                            "LENS-HOYA-FULLCONTROL-155", "LENS", "1580000",
                            "https://matkinhsaigon.com.vn/img/product/1676023027-TrongKinhHoya_Nulux_Full_Control_6.png",
                            "lens_hoya,lens_blue_light,lens_index_155"),
                    buildProduct("TRÒNG KÍNH 1.67 ZEISS BLUEGUARD",
                            "LENS-ZEISS-BLUEGUARD-167", "LENS", "6780000",
                            "https://matkinhsaigon.com.vn/img/product/1675168180-Trong_Kinh167_ZEISSBlueGuard_1.png",
                            "lens_zeiss,lens_blue_light,lens_index_167")
            );

            productRepository.saveAll(demoProducts);
            System.out.println("====== ĐÃ TẠO 5 SẢN PHẨM MẪU ======");

            // Nạp kho cho từng sản phẩm
            if (inventoryRepository.count() == 0) {
                for (Product p : demoProducts) {
                    inventoryRepository.save(new Inventory(null, p.getId(), 100));
                }
                System.out.println("====== ĐÃ NẠP KHO (100) CHO 5 SẢN PHẨM ======");
            }
        }

        if (orderRepository.count() == 0) {
            // Lấy tài khoản khách hàng mẫu ("customer")
            User customer = userRepository.findByUsername("customer").orElse(null);
            // Lấy danh sách sản phẩm hiện có
            List<Product> allProducts = productRepository.findAll();

            if (customer != null && allProducts.size() >= 4) {
                // KỊCH BẢN 1: Đơn mua ngay (AVAILABLE) - Trạng thái PENDING
                Product p1 = allProducts.get(0);
                Order order1 = Order.builder()
                        .userId(customer.getId())
                        .totalAmount(p1.getBasePrice().multiply(new BigDecimal("1")))
                        .status(OrderStatus.PENDING)
                        .orderType(OrderType.AVAILABLE)
                        .shippingAddress("123 Đường ABC, TP.HCM")
                        .build();
                OrderItem item1 = new OrderItem();
                item1.setOrder(order1);
                item1.setProductId(p1.getId());
                item1.setQuantity(1);
                item1.setPrice(p1.getBasePrice());
                order1.setOrderItems(List.of(item1));
                orderRepository.save(order1);

                // KỊCH BẢN 2: Đơn đặt trước (PRE_ORDER) - Trạng thái PENDING
                Product p2 = allProducts.get(1);
                Order order2 = Order.builder()
                        .userId(customer.getId())
                        .totalAmount(p2.getBasePrice().multiply(new BigDecimal("2"))) // Mua 2 cái
                        .status(OrderStatus.PENDING)
                        .orderType(OrderType.PRE_ORDER)
                        .shippingAddress("456 Đường XYZ, Hà Nội")
                        .build();
                OrderItem item2 = new OrderItem();
                item2.setOrder(order2);
                item2.setProductId(p2.getId());
                item2.setQuantity(2);
                item2.setPrice(p2.getBasePrice());
                order2.setOrderItems(List.of(item2));
                orderRepository.save(order2);

                // KỊCH BẢN 3: Đơn hàng cắt kính (PRESCRIPTION) - Trạng thái PRESCRIPTION_REVIEW
                Product p3 = allProducts.get(2);
                Order order3 = Order.builder()
                        .userId(customer.getId())
                        .totalAmount(p3.getBasePrice().multiply(new BigDecimal("1")))
                        .status(OrderStatus.PRESCRIPTION_REVIEW)
                        .orderType(OrderType.PRESCRIPTION)
                        .prescriptionDetails("Mắt trái: -2.00, Mắt phải: -1.50")
                        .shippingAddress("123 Đường ABC, TP.HCM")
                        .build();
                OrderItem item3 = new OrderItem();
                item3.setOrder(order3);
                item3.setProductId(p3.getId());
                item3.setQuantity(1);
                item3.setPrice(p3.getBasePrice());
                order3.setOrderItems(List.of(item3));
                orderRepository.save(order3);

                // KỊCH BẢN 4: Đơn đã giao thành công (DELIVERED) - Dùng để test Doanh thu cho TV4
                Product p4 = allProducts.get(3);
                Order order4 = Order.builder()
                        .userId(customer.getId())
                        .totalAmount(p4.getBasePrice().multiply(new BigDecimal("1")))
                        .status(OrderStatus.DELIVERED)
                        .orderType(OrderType.AVAILABLE)
                        .shippingAddress("789 Đường LMN, Đà Nẵng")
                        .build();
                OrderItem item4 = new OrderItem();
                item4.setOrder(order4);
                item4.setProductId(p4.getId());
                item4.setQuantity(1);
                item4.setPrice(p4.getBasePrice());
                order4.setOrderItems(List.of(item4));
                orderRepository.save(order4);

                System.out.println("====== ĐÃ TẠO THÀNH CÔNG 4 ĐƠN HÀNG TEST CHO SALES & OPS ======");
            }
        }
    }

    private Product buildProduct(String name, String sku, String type, String price, String imageUrl, String tags) {
        return Product.builder()
                .name(name)
                .sku(sku)
                .description("Sản phẩm mẫu được tạo tự động cho C6.")
                .basePrice(new BigDecimal(price))
                .type(type)
                .imageUrl(imageUrl)
                .tags(tags)
                .available(true)
                .preOrder(false)
                .allowPrescription("LENS".equalsIgnoreCase(type))
                .build();
    }

}