import { useEffect, useState } from "react";
import { Card, CardContent, Grid, Typography } from "@mui/material";
import { useLogout } from "react-admin";
import { API_URL } from "./config";
import { getToken } from "./authProvider";
import { getDashboardRecoveryAction } from "./dashboardRecovery";

interface DashboardData {
  pending: number;
  processing: number;
  deliveredToday: number;
  revenue: number;
  revenue7Days: number;
  newUsersToday: number;
  openWarrantyCases: number;
  stalePendingOrders: number;
  stock: {
    accountsAvailable: number;
    keysAvailable: number;
    totalAvailable: number;
    sharedWithSlots: number;
  };
}

function money(v: number): string {
  return new Intl.NumberFormat("vi-VN").format(v) + "đ";
}

function StatCard(props: { title: string; value: string | number; note?: string }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {props.title}
        </Typography>
        <Typography variant="h4" sx={{ mt: 1 }}>
          {props.value}
        </Typography>
        {props.note ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {props.note}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const logout = useLogout();

  useEffect(() => {
    const token = getToken();
    if (getDashboardRecoveryAction({ hasToken: Boolean(token) }) === "logout") {
      logout();
      return;
    }

    fetch(`${API_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const err = new Error(body.message ?? res.statusText) as Error & { status?: number };
          err.status = res.status;
          throw err;
        }
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err: Error & { status?: number }) => {
        if (getDashboardRecoveryAction({ hasToken: true, status: err.status }) === "logout") {
          localStorage.removeItem("cynex_admin_token");
          localStorage.removeItem("cynex_admin_identity");
          logout();
          return;
        }
        setError(err.message);
      });
  }, [logout]);

  if (error) {
    return <Typography color="error">Dashboard load failed: {error}</Typography>;
  }
  if (!data) {
    return <Typography>Loading dashboard…</Typography>;
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Pending" value={data.pending} note="Đơn đã thanh toán, chờ admin xử lý" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Processing" value={data.processing} note="Đơn đang xử lý hoặc đã gán" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={2}>
        <StatCard title="Delivered Today" value={data.deliveredToday} note="Đơn giao thành công hôm nay" />
      </Grid>
      <Grid item xs={12} sm={6} md={6} lg={2}>
        <StatCard title="Revenue (paid)" value={money(data.revenue)} note="Tổng đơn trạng thái paid" />
      </Grid>
      <Grid item xs={12} sm={6} md={6} lg={2}>
        <StatCard title="Revenue 7d" value={money(data.revenue7Days)} note="Doanh thu 7 ngày gần nhất" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="New users today" value={data.newUsersToday} note="User đăng ký hôm nay" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard title="Open warranty" value={data.openWarrantyCases} note="Case bảo hành đang mở" />
      </Grid>
      <Grid item xs={12} sm={6} md={4} lg={3}>
        <StatCard
          title="Stale pending"
          value={data.stalePendingOrders}
          note="Đơn chờ admin > 24h"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={6} lg={3}>
        <StatCard
          title="Stock"
          value={data.stock.totalAvailable}
          note={`Acc: ${data.stock.accountsAvailable} · Keys: ${data.stock.keysAvailable} · Shared slots: ${data.stock.sharedWithSlots}`}
        />
      </Grid>
    </Grid>
  );
}
