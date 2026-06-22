import { StaticPageLayout } from "@/components/storefront/PremiumChrome";

export default function TermsPage() {
  return (
    <StaticPageLayout title="Điều khoản dịch vụ" subtitle="Phiên bản MVP — cập nhật theo thời gian vận hành thực tế.">
      <p>
        Khi sử dụng Cynex, bạn đồng ý cung cấp thông tin chính xác khi mua hàng, không chia sẻ thông tin tài khoản
        đã mua cho bên thứ ba trái phép, và tuân thủ điều khoản của từng dịch vụ bản quyền (Spotify, Netflix…).
      </p>
      <p>
        Cynex cung cấp dịch vụ số theo mô hình shop vận hành thủ công: sau thanh toán, đơn được xử lý bởi admin trong
        khung thời gian ước tính trên từng gói. Hoàn tiền (nếu có) được thực hiện vào Ví Cynex theo chính sách shop.
      </p>
      <p>
        Chúng tôi có quyền từ chối phục vụ tài khoản vi phạm, gian lận thanh toán, hoặc lạm dụng chính sách bảo hành.
      </p>
    </StaticPageLayout>
  );
}
