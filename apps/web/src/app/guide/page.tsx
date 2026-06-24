import { StaticPageLayout } from "@/components/storefront/PremiumChrome";

export default function GuidePage() {
  return (
    <StaticPageLayout
      title="Hướng dẫn mua hàng"
      subtitle="Quy trình mua và nhận dịch vụ số trên Cynex — đơn giản, minh bạch."
    >
      <section>
        <h2 className="text-lg font-semibold text-slate-900">1. Chọn sản phẩm</h2>
        <p>
          Truy cập trang Sản phẩm, chọn gói phù hợp (thời hạn, hình thức nhận hàng). Mỗi variant hiển thị giá,
          bảo hành và thời gian xử lý dự kiến.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">2. Đăng nhập & tạo đơn</h2>
        <p>
          Bấm Mua ngay — hệ thống yêu cầu đăng nhập. Nếu gói cần thông tin khách (email tài khoản, username…),
          điền đầy đủ trước khi tạo đơn.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">3. Thanh toán</h2>
        <p>
          Chọn SePay (chuyển khoản/QR) hoặc Ví Cynex. Sau khi thanh toán thành công, đơn chuyển sang trạng thái
          &quot;Đã thanh toán — chờ xử lý&quot;. Bạn nhận email xác nhận.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">4. Admin xử lý & nhận hàng</h2>
        <p>
          Admin gắn account/key hoặc kết quả nâng cấp, sau đó gửi email thông báo. Vào Lịch sử đơn hàng để xem
          thông tin sử dụng khi đơn ở trạng thái &quot;Đã giao hàng&quot;.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">5. Bảo hành</h2>
        <p>
          Nếu gặp lỗi, mở yêu cầu hỗ trợ từ chi tiết đơn đã giao hoặc trang Hỗ trợ. Đính kèm ảnh màn hình nếu cần.
        </p>
      </section>
    </StaticPageLayout>
  );
}
