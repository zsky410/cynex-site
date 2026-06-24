import { StaticPageLayout } from "@/components/storefront/PremiumChrome";

export default function PrivacyPage() {
  return (
    <StaticPageLayout title="Chính sách bảo mật" subtitle="Cam kết bảo vệ dữ liệu cá nhân và thông tin giao dịch.">
      <p>
        Cynex lưu email, lịch sử đơn hàng, giao dịch ví và thông tin bạn cung cấp khi mua (ví dụ email tài khoản cần
        nâng cấp) để xử lý đơn và hỗ trợ bảo hành. Mật khẩu được băm; credential giao hàng được mã hóa khi lưu trữ.
      </p>
      <p>
        Chúng tôi không bán dữ liệu cá nhân. Thông tin thanh toán qua SePay tuân theo bảo mật của đối tác thanh toán.
        Email giao dịch gửi qua Resend; file đính kèm bảo hành lưu trên Cloudflare R2 (metadata trong PostgreSQL).
      </p>
      <p>
        Bạn có thể yêu cầu hỗ trợ cập nhật hoặc xóa tài khoản qua trang Hỗ trợ. Cookie/token phiên đăng nhập lưu trên
        trình duyệt của bạn (localStorage).
      </p>
    </StaticPageLayout>
  );
}
