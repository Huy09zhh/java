package edu.uth.eyewear_store.core.config;

import edu.uth.eyewear_store.core.entity.Role;
import edu.uth.eyewear_store.core.entity.User;
import edu.uth.eyewear_store.core.entity.Product;
import edu.uth.eyewear_store.core.repository.ProductRepository;
import edu.uth.eyewear_store.core.repository.RoleRepository;
import edu.uth.eyewear_store.core.repository.UserRepository;
import edu.uth.eyewear_store.order.entity.Order;
import edu.uth.eyewear_store.order.entity.OrderItem;
import edu.uth.eyewear_store.order.entity.OrderStatus;
import edu.uth.eyewear_store.order.entity.OrderType;
import edu.uth.eyewear_store.order.repository.OrderRepository;
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
    private OrderRepository orderRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    @SuppressWarnings("null")
    public void run(String... args) throws Exception {
        // Cố gắng mở rộng cột trong DB để tránh lỗi tràn chuỗi
        try {
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN support_note NVARCHAR(MAX)");
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN return_reason NVARCHAR(MAX)");
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN prescription_details NVARCHAR(MAX)");
            jdbcTemplate.execute("ALTER TABLE orders ALTER COLUMN shipping_address NVARCHAR(MAX)");
            try {
                jdbcTemplate.execute("ALTER TABLE products ADD allow_prescription BIT DEFAULT 0");
                jdbcTemplate.execute("UPDATE products SET allow_prescription = 0 WHERE allow_prescription IS NULL");
            } catch (Exception ignored) { }
        } catch (Exception e) {
            System.err.println("Lưu ý: Không thể chạy ALTER TABLE (có thể do đã đúng định dạng hoặc DB không hỗ trợ).");
        }

        // 1. Tạo các Role mặc định nếu chưa có
        if (roleRepository.count() == 0) {
            roleRepository.save(new Role(null, "ROLE_CUSTOMER"));
            roleRepository.save(new Role(null, "ROLE_SALES"));
            roleRepository.save(new Role(null, "ROLE_OPERATIONS"));
            roleRepository.save(new Role(null, "ROLE_MANAGER"));
            roleRepository.save(new Role(null, "ROLE_ADMIN"));
        }

        // 2. Tạo sẵn tài khoản
        if (!userRepository.existsByUsername("admin")) {
            Role adminRole = roleRepository.findByName("ROLE_ADMIN").get();
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            User adminUser = User.builder()
                    .username("admin").email("admin@eyewearstore.com")
                    .password(passwordEncoder.encode("123456")).fullName("System Administrator")
                    .roles(roles).build();
            userRepository.save(adminUser);
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

        // BƯỚC C40: BƠM ĐẦY ĐỦ 23 SẢN PHẨM THẬT VÀO DATABASE
        if (productRepository.count() == 0) {
            List<Product> demoProducts = List.of(
                    // 1. TRÒNG KÍNH ĐỔI MÀU 1.50 ESSILOR
                    buildProduct("TRÒNG KÍNH ĐỔI MÀU 1.50 ESSILOR TRANSITIONS GEN S", "LENS-ESSILOR-GENS-150", "LENS", "5000",
                            "https://matkinhsaigon.com.vn/img/product/1746346945-Trong_Kinh_Essilor_TransitionsGenS_4.jpg",
                            "lens_blue_light,lens_photochromic,lens_index_150",
                            tabs("Thông tin chi tiết", "Thương hiệu: Essilor\nXuất xứ: Pháp\nChiết suất: 1.50", "Lợi ích từ Gen S", "Transitions Gen S phản ứng nhanh với ánh sáng."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1746346945-Trong_Kinh_Essilor_TransitionsGenS_4.jpg", "https://matkinhsaigon.com.vn/img/product/1746344233-Trong_Kinh_Essilor_TransitionsGenS_5.jpg", "https://matkinhsaigon.com.vn/img/product/1746348013-Trong_Kinh_Essilor_TransitionsGenS_2.jpg")),

                    // 2. TRÒNG KÍNH 1.56 ZEISS DURAVISION GOLD UV
                    buildProduct("TRÒNG KÍNH 1.56 ZEISS DURAVISION GOLD UV", "LENS-ZEISS-GOLDUV-156", "LENS", "2500",
                            "https://matkinhsaigon.com.vn/img/product/1773018487_6u8b1L1wo5_69ae1d774d790.jpg",
                            "lens_zeiss,lens_premium,lens_index_156,lens_blue_light",
                            tabs("Nội dung", "Thương hiệu: Zeiss\nXuất xứ: Đức\nVật liệu: ZEISS BlueGuard", "Thông số kỹ thuật", "Lớp phủ CleanGuard giúp chống bám bẩn."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1773018487_6u8b1L1wo5_69ae1d774d790.jpg", "https://matkinhsaigon.com.vn/img/product/1773018487_obFwmKbEnT_69ae1d774e71d.jpg")),

                    // 3. KÍNH KIỂM SOÁT CẬN THỊ ZEISS MYOCARE
                    buildProduct("KÍNH KIỂM SOÁT CẬN THỊ ZEISS MYOCARE", "LENS-ZEISS-MYOCARE", "LENS", "3000",
                            "https://matkinhsaigon.com.vn/img/product/1739782388-Tròng_Kính_Zeiss_MyoCare.jpg",
                            "lens_zeiss,lens_myope_control,lens_kid",
                            tabs("Thông tin chi tiết", "Thương hiệu: Zeiss\nXuất xứ: Đức\nVật liệu: Polycarbonate", "Lợi ích sản phẩm", "Hỗ trợ quản lý tiến triển cận thị."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1739782388-Tròng_Kính_Zeiss_MyoCare.jpg", "https://matkinhsaigon.com.vn/img/product/1739784024-Trong_kinh_ZEISS_Myocare_2.jpg")),

                    // 4. TRÒNG KÍNH 1.55 HOYA NULUX FULL CONTROL
                    buildProduct("TRÒNG KÍNH 1.55 HOYA NULUX FULL CONTROL", "LENS-HOYA-FULLCONTROL-155", "LENS", "1580000",
                            "https://matkinhsaigon.com.vn/img/product/1676023027-TrongKinhHoya_Nulux_Full_Control_6.png",
                            "lens_hoya,lens_blue_light,lens_index_155",
                            tabs("Thông tin chi tiết", "Thương hiệu: Hoya Nhật\nChiết suất: 1.55", "Tư vấn sử dụng", "Phù hợp người làm việc máy tính."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1676023027-TrongKinhHoya_Nulux_Full_Control_6.png", "https://matkinhsaigon.com.vn/img/product/1676023027-TrongKinhHoya_Nulux_Full_Control_7.png")),

                    // 5. TRÒNG KÍNH 1.67 ZEISS BLUEGUARD
                    buildProduct("TRÒNG KÍNH 1.67 ZEISS BLUEGUARD", "LENS-ZEISS-BLUEGUARD-167", "LENS", "6780000",
                            "https://matkinhsaigon.com.vn/img/product/1675168180-Trong_Kinh167_ZEISSBlueGuard_1.png",
                            "lens_zeiss,lens_blue_light,lens_index_167",
                            tabs("Thông tin chi tiết", "Thương hiệu: ZEISS\nXuất xứ: Đức\nChiết suất: 1.67", "Cách nhận diện Zeiss", "Có logo nhận diện thương hiệu khắc chìm."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1675168180-Trong_Kinh167_ZEISSBlueGuard_1.png", "https://matkinhsaigon.com.vn/img/product/1675158846-Trong_Kinh167_ZEISSBlueGuard_2.png")),

                    // 6. GỌNG KÍNH HELEN KELLER H83026 C26
                    buildProduct("GỌNG KÍNH HELEN KELLER H83026 C26", "FRAME-HK-H83026-C26", "FRAME", "1300000",
                            "https://matkinhsaigon.com.vn/img/product/1760003539-H83026_C26_2.jpg",
                            "frame_helen_keller,frame_unisex,frame_square",
                            tabs("Thông tin chi tiết", "Thương hiệu: Helen Keller\nDòng sản phẩm: H83026 C26", "Tư vấn sử dụng", "Giá demo: 1.300.000 VND."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1760003539-H83026_C26_2.jpg", "https://matkinhsaigon.com.vn/img/product/1760003539-H83026_C26_1.jpg")),

                    // 7. GỌNG KÍNH HELEN KELLER H82612 C3
                    buildProduct("GỌNG KÍNH HELEN KELLER H82612 C3", "FRAME-HK-H82612-C3", "FRAME", "1300000",
                            "https://matkinhsaigon.com.vn/img/product/1760001025-H82612_C3_7.jpg",
                            "frame_helen_keller,frame_unisex,frame_square,frame_rose_gold",
                            tabs("Thông tin chi tiết", "Thương hiệu: Helen Keller\nXuất xứ: Hồng Kông", "Thông số kỹ thuật", "Chiều dài tròng: 50 mm\nCầu kính: 19 mm"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1760001025-H82612_C3_7.jpg", "https://matkinhsaigon.com.vn/img/product/1760001025-H82612_C3_3.jpg")),

                    // 8. GỌNG KÍNH EXFASH KID EF45405 C06
                    buildProduct("GỌNG KÍNH EXFASH KID EF45405 C06", "FRAME-EXFASH-EF45405-C06", "FRAME", "680000",
                            "https://matkinhsaigon.com.vn/img/product/1759826783-EF45405_C06_1.jpg",
                            "frame_kid,frame_exfash,frame_tr90",
                            tabs("Thông tin chi tiết", "Thương hiệu: ExFash Kid\nMã mẫu: EF45405 C06", "Tư vấn sử dụng", "Phù hợp trẻ em lắp tròng cận."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1759826783-EF45405_C06_1.jpg")),

                    // 9. GỌNG KÍNH EXFASH KID EF45405 C12
                    buildProduct("GỌNG KÍNH EXFASH KID EF45405 C12", "FRAME-EXFASH-EF45405-C12", "FRAME", "680000",
                            "https://matkinhsaigon.com.vn/img/product/1759827010-EF45405_C12_2.jpg",
                            "frame_kid,frame_exfash,frame_tr90",
                            tabs("Thông tin chi tiết", "Thương hiệu: ExFash Kid\nMã mẫu: EF45405 C12", "Tư vấn sử dụng", "Dòng sản phẩm trẻ em, dễ đeo hằng ngày"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1759827010-EF45405_C12_2.jpg")),

                    // 10. GỌNG KÍNH EXFASH KID EF45401 C09
                    buildProduct("GỌNG KÍNH EXFASH KID EF45401 C09", "FRAME-EXFASH-EF45401-C09", "FRAME", "680000",
                            "https://matkinhsaigon.com.vn/img/product/1759634279-EF45401_C09_2.jpg",
                            "frame_kid,frame_exfash,frame_tr90",
                            tabs("Thông tin chi tiết", "Thương hiệu: ExFash Kid\nMã mẫu: EF45401 C09", "Thông số kỹ thuật", "Giá demo 680.000 VND."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1759634279-EF45401_C09_2.jpg")),

                    // 11. GỌNG KÍNH EXFASH KID EF45400 C06
                    buildProduct("GỌNG KÍNH EXFASH KID EF45400 C06", "FRAME-EXFASH-EF45400-C06", "FRAME", "680000",
                            "https://matkinhsaigon.com.vn/img/product/1759569754-EF45400_C06_2.jpg",
                            "frame_kid,frame_exfash,frame_round,frame_tr90",
                            tabs("Thông tin chi tiết", "Thương hiệu: ExFash\nXuất xứ: Hàn Quốc", "Thông số kỹ thuật", "Chiều dài tròng: 48 mm\nCầu kính: 16 mm"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1759569754-EF45400_C06_2.jpg")),

                    // 12. KÍNH MÁT BOLON BX8005 A10
                    buildProduct("KÍNH MÁT BOLON BX8005 A10", "SUN-BOLON-BX8005-A10", "SUNGLASSES", "3180000",
                            "https://matkinhsaigon.com.vn/img/product/1755144751-BX8005_A10_2.jpg",
                            "sun_bolon,sun_unisex,sun_square,sun_black",
                            tabs("Thông tin chi tiết", "Thương hiệu: Bolon\nXuất xứ: Pháp", "Tư vấn sử dụng", "Tròng Polarized giúp giảm chói, tăng tương phản."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1755144751-BX8005_A10_2.jpg")),

                    // 13. KÍNH MÁT MOLSION MS3123 A62
                    buildProduct("KÍNH MÁT MOLSION MS3123 A62", "SUN-MOLSION-MS3123-A62", "SUNGLASSES", "2480000",
                            "https://matkinhsaigon.com.vn/img/product/1752460922-MS3123_A62_2.jpg",
                            "sun_molsion,sun_unisex,sun_cat_eye",
                            tabs("Thông tin chi tiết", "Thương hiệu: Molsion\nXuất xứ: Pháp", "Tư vấn sử dụng", "Công nghệ tròng: Polarized by Essilor"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1752460922-MS3123_A62_2.jpg")),

                    // 14. KÍNH MÁT POLICE SPLN34 Z42Y
                    buildProduct("KÍNH MÁT POLICE SPLN34 Z42Y", "SUN-POLICE-SPLN34-Z42Y", "SUNGLASSES", "3900000",
                            "https://matkinhsaigon.com.vn/img/product/1729734315-SPLN34_Z42Y_2.jpg",
                            "sun_police,sun_unisex,sun_polygon,sun_black",
                            tabs("Thông tin chi tiết", "Thương hiệu: POLICE\nXuất xứ: Italy", "Tư vấn sử dụng", "Phù hợp phong cách mạnh, hiện đại."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1729734315-SPLN34_Z42Y_2.jpg")),

                    // 15. KÍNH MÁT INVU IP22409 C
                    buildProduct("KÍNH MÁT INVU IP22409 C", "SUN-INVU-IP22409-C", "SUNGLASSES", "2050000",
                            "https://matkinhsaigon.com.vn/img/product/1721698279-IP22409_C_2.jpg",
                            "sun_invu,sun_women,sun_square,sun_polarized",
                            tabs("Thông tin chi tiết", "Thương hiệu: INVU\nXuất xứ: Thuỵ Sĩ", "Thông số kỹ thuật", "Chiều dài tròng: 52 mm\nCầu kính: 15 mm"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1721698279-IP22409_C_2.jpg")),

                    // 16. KÍNH MÁT INVU IB22430 D
                    buildProduct("KÍNH MÁT INVU IB22430 D", "SUN-INVU-IB22430-D", "SUNGLASSES", "2250000",
                            "https://matkinhsaigon.com.vn/img/product/1721641258-IB22430_D_2.jpg",
                            "sun_invu,sun_women,sun_square,sun_red",
                            tabs("Thông tin chi tiết", "Thương hiệu: INVU\nXuất xứ: Thụy Sĩ", "Tư vấn sử dụng", "Công nghệ tròng: Polarized"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1721641258-IB22430_D_2.jpg")),

                    // 17. KÍNH MÁT BOLON BL7059 B30
                    buildProduct("KÍNH MÁT BOLON BL7059 B30", "SUN-BOLON-BL7059-B30", "SUNGLASSES", "2980000",
                            "https://matkinhsaigon.com.vn/img/product/1583567463_0_img.png",
                            "sun_bolon,sun_aviator,sun_titanium",
                            tabs("Thông tin chi tiết", "Thương hiệu: Bolon\nKiểu dáng: Aviator", "Tư vấn sử dụng", "Gọng hợp kim Titanium nhẹ và bền"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1583567463_0_img.png")),

                    // 18. DUNG DỊCH BẢO QUẢN LENS COOPER VISION 100ML
                    buildProduct("DUNG DỊCH BẢO QUẢN LENS COOPER VISION 100ML", "CL-COOPER-SOLUTION-100", "CONTACT_LENS", "100000",
                            "https://matkinhsaigon.com.vn/img/product/1732953000-Dung_Dich_All_In_One_Light_100ml_2.jpg",
                            "contact_accessory,contact_solution",
                            tabs("Thông tin chi tiết", "Dung tích: 100 ml dạng du lịch", "Tư vấn sử dụng", "Dùng để làm sạch, rửa, khử trùng và bảo quản kính áp tròng."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1732953000-Dung_Dich_All_In_One_Light_100ml_2.jpg")),

                    // 19. NƯỚC NHỎ MẮT NHAN TAO RENU 8ML
                    buildProduct("NƯỚC NHỎ MẮT NHAN TAO RENU 8ML", "CL-RENU-DROPS-8", "CONTACT_LENS", "130000",
                            "https://matkinhsaigon.com.vn/img/product/1732965721-Nuoc_Nho_Mat_RENU_8ml_1.jpg",
                            "contact_accessory,contact_drops",
                            tabs("Thông tin chi tiết", "Thể tích: 8 ml\nXuất xứ: USA", "Tư vấn sử dụng", "Tạo độ ẩm, giữ ẩm trực tiếp khi đang đeo lens."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1732965721-Nuoc_Nho_Mat_RENU_8ml_1.jpg")),

                    // 20. DUNG DỊCH BẢO QUẢN KÍNH ÁP TRÒNG RENU 120ML
                    buildProduct("DUNG DỊCH BẢO QUẢN KÍNH ÁP TRÒNG RENU 120ML", "CL-RENU-SOLUTION-120", "CONTACT_LENS", "120000",
                            "https://matkinhsaigon.com.vn/img/product/1732962643-Nuoc_ngam_kính-RENU_120ml_1.jpg",
                            "contact_accessory,contact_solution",
                            tabs("Thông tin chi tiết", "Thể tích: 120 ml\nXuất xứ: USA", "Tư vấn sử dụng", "Kết hợp 4 chức năng: rửa, tráng, ngâm va tẩy rửa kính áp trong."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1732962643-Nuoc_ngam_kính-RENU_120ml_1.jpg")),

                    // 21. KÍNH ÁP TRÒNG COOPERVISION BIOMEDICS 1 DAY
                    buildProduct("KÍNH ÁP TRÒNG COOPERVISION BIOMEDICS 1 DAY", "CL-COOPER-BIOMEDICS-1DAY", "CONTACT_LENS", "50000",
                            "https://matkinhsaigon.com.vn/img/product/1732929167-Biomedics1DayExtraToric.jpg",
                            "contact_clear,contact_daily",
                            tabs("Thông tin chi tiết", "Nhà sản xuất: Coopervision\nXuất xứ: Mỹ", "Hướng dẫn sử dụng", "Không cần ngâm lại qua đêm, dùng xong thay mới sau mỗi ngày."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1732929167-Biomedics1DayExtraToric.jpg")),

                    // 22. KÍNH ÁP TRÒNG COOPERVISION BIOMEDICS 55 EVOLUTION
                    buildProduct("KÍNH ÁP TRÒNG COOPERVISION BIOMEDICS 55 EVOLUTION", "CL-COOPER-BIOMEDICS-55", "CONTACT_LENS", "180000",
                            "https://matkinhsaigon.com.vn/img/product/1732934471-Coopervision_Biomedics55_Evolution_1.jpg",
                            "contact_clear,contact_3month",
                            tabs("Thông tin chi tiết", "Đóng gói: 2 lens\nThời gian sử dụng: 3 tháng kể từ lúcc mở", "Tư vấn sử dụng", "Thiết kế bờ tròn và mỏng hơn giúp đeo êm suốt cả ngày."),
                            gallery("https://matkinhsaigon.com.vn/img/product/1732934471-Coopervision_Biomedics55_Evolution_1.jpg")),

                    // 23. KÍNH ÁP TRÒNG COOPERVISION CLARITI ELITE 3 MONTH
                    buildProduct("KÍNH ÁP TRÒNG COOPERVISION CLARITI ELITE 3 MONTH", "CL-COOPER-CLARITI-3M", "CONTACT_LENS", "200000",
                            "https://matkinhsaigon.com.vn/img/product/1732930983-Coopervision_Clariti_Elite_1.jpg",
                            "contact_clear,contact_silicone_hydrogel,contact_3month",
                            tabs("Thông tin chi tiết", "Dòng lens: Clariti Elite\nXuất xứ: Mỹ", "Thông số kỹ thuật", "Hàm lượng nước: 56 phần trăm\nBảo vệ UV: Có"),
                            gallery("https://matkinhsaigon.com.vn/img/product/1732930983-Coopervision_Clariti_Elite_1.jpg"))
            );

            productRepository.saveAll(demoProducts);
            System.out.println("====== DA TAO XONG 23 SAN PHAM FULL ======");

            // Nạp kho 100 chiếc cho từng sản phẩm
            if (inventoryRepository.count() == 0) {
                for (Product p : demoProducts) {
                    inventoryRepository.save(new Inventory(null, p.getId(), 100));
                }
                System.out.println("====== DA NAP KHO (100) CHO 23 SAN PHAM ======");
            }
        }

        // Tạo 4 đơn hàng Test (Từ Bước C26 của TV3)
        if (orderRepository.count() == 0) {
            User customer = userRepository.findByUsername("customer").orElse(null);
            List<Product> allProducts = productRepository.findAll();

            if (customer != null && allProducts.size() >= 4) {
                Product p1 = allProducts.get(0);
                Order order1 = Order.builder().userId(customer.getId()).totalAmount(p1.getBasePrice()).status(OrderStatus.PENDING).orderType(OrderType.AVAILABLE).shippingAddress("123 Đường ABC, TP.HCM").build();
                OrderItem item1 = new OrderItem(); item1.setOrder(order1); item1.setProductId(p1.getId()); item1.setQuantity(1); item1.setPrice(p1.getBasePrice());
                order1.setOrderItems(List.of(item1));
                orderRepository.save(order1);

                Product p2 = allProducts.get(1);
                Order order2 = Order.builder().userId(customer.getId()).totalAmount(p2.getBasePrice().multiply(new BigDecimal("2"))).status(OrderStatus.PENDING).orderType(OrderType.PRE_ORDER).shippingAddress("123 Đường ABC, TP.HCM").build();
                OrderItem item2 = new OrderItem(); item2.setOrder(order2); item2.setProductId(p2.getId()); item2.setQuantity(2); item2.setPrice(p2.getBasePrice());
                order2.setOrderItems(List.of(item2));
                orderRepository.save(order2);

                Product p3 = allProducts.get(2);
                Order order3 = Order.builder().userId(customer.getId()).totalAmount(p3.getBasePrice()).status(OrderStatus.PENDING).orderType(OrderType.AVAILABLE).shippingAddress("123 Đường ABC, TP.HCM").build();
                OrderItem item3 = new OrderItem(); item3.setOrder(order3); item3.setProductId(p3.getId()); item3.setQuantity(1); item3.setPrice(p3.getBasePrice());
                order3.setOrderItems(List.of(item3));
                orderRepository.save(order3);

                Product p4 = allProducts.get(3);
                Order order4 = Order.builder().userId(customer.getId()).totalAmount(p4.getBasePrice()).status(OrderStatus.DELIVERED).orderType(OrderType.AVAILABLE).shippingAddress("123 Đường ABC, TP.HCM").build();
                OrderItem item4 = new OrderItem(); item4.setOrder(order4); item4.setProductId(p4.getId()); item4.setQuantity(1); item4.setPrice(p4.getBasePrice());
                order4.setOrderItems(List.of(item4));
                orderRepository.save(order4);

                System.out.println("====== ĐÃ TẠO 4 ĐƠN HÀNG TEST CHO SALES & OPS ======");
            }
        }
    }

    // Các hàm tiện ích hỗ trợ Build Sản Phẩm
    private Product buildProduct(String name, String sku, String type, String price, String imageUrl, String tags, String detailTabsJson, String galleryImagesJson) {
        return Product.builder()
                .name(name).sku(sku)
                .description("Sản phẩm chính hãng, hỗ trợ mua online, pre-order hoặc làm kính theo đơn. Bảo hành rõ ràng, tư vấn theo nhu cầu sử dụng.")
                .basePrice(new BigDecimal(price)).type(type).imageUrl(imageUrl).tags(tags)
                .detailTabsJson(detailTabsJson).galleryImagesJson(galleryImagesJson)
                .available(true).preOrder(false).allowPrescription("LENS".equalsIgnoreCase(type))
                .build();
    }

    private String tabs(String... titleAndContent) {
        StringBuilder json = new StringBuilder("[\n");
        int index = 0;
        for (int i = 0; i < titleAndContent.length; i += 2) {
            if (i > 0) json.append(",\n");
            json.append("  {\"key\":\"tab").append(++index).append("\",\"title\":\"")
                    .append(escapeJson(titleAndContent[i])).append("\",\"content\":\"")
                    .append(escapeJson(titleAndContent[i + 1])).append("\"}");
        }
        json.append(",\n  {\"key\":\"guide\",\"title\":\"Hướng dẫn mua hàng\",\"content\":\"1. Chọn sản phẩm -> Thêm vào giỏ hàng.\\n2. Nhập thông tin giao hàng.\\n3. Xác nhận đặt hàng.\"}");
        json.append(",\n  {\"key\":\"store\",\"title\":\"Địa chỉ mua hàng\",\"content\":\"📍 70 Đ. Tô Ký, Trung Mỹ Tây, Hồ Chí Minh, Việt Nam.\\n📞 Hotline: 02838992862\"}");
        json.append(",\n  {\"key\":\"hours\",\"title\":\"Thời gian mở cửa\",\"content\":\"⏰ Thứ 2 - Thứ 7: 08:00 - 20:00\\n⏰ Chủ Nhật: Đóng cửa\"}");
        json.append("\n]");
        return json.toString();
    }

    private String gallery(String... imageUrls) {
        StringBuilder json = new StringBuilder("[\n");
        for (int i = 0; i < imageUrls.length; i++) {
            if (i > 0) json.append(",\n");
            json.append("  \"").append(escapeJson(imageUrls[i])).append("\"");
        }
        json.append("\n]");
        return json.toString();
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
    }
}