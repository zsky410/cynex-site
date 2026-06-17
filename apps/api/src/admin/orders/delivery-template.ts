// ponytail: the delivery notification email is a generic "your order is ready"
// message (NO secrets — those are revealed on the website). It's duplicated here
// for the admin preview to avoid importing worker code across the app boundary.
// The worker's apps/worker/src/email/templates.ts deliveryEmail must stay in sync;
// if these templates grow, move them into @cynex/shared.
const WEB_BASE_URL = process.env.WEB_BASE_URL ?? "http://localhost:3000";

export function deliveryEmail(d: { orderCode: string }): { subject: string; html: string } {
  const subject = `Đơn hàng #${d.orderCode} đã sẵn sàng`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:12px;padding:32px">
    <h1 style="color:#4f46e5;font-size:20px;margin:0 0 16px">Cynex</h1>
    <h2 style="font-size:18px;margin:0 0 12px">Đơn hàng đã sẵn sàng</h2>
    <p>Đơn hàng <strong>#${d.orderCode}</strong> của bạn đã sẵn sàng.</p>
    <p>Vui lòng đăng nhập website để xem thông tin sử dụng.</p>
    <p><a href="${WEB_BASE_URL}/orders/${d.orderCode}" style="color:#4f46e5">Xem thông tin</a></p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#94a3b8;font-size:12px">Email tự động từ Cynex. Vui lòng không trả lời email này.</p>
  </div></body></html>`;
  return { subject, html };
}
