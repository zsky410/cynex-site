"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Shield } from "lucide-react";
import {
  AccountCard,
  AccountPageLayout,
  AccountSectionHeader,
  InfoField,
  LogoutCard,
  OutlineButton,
  ProfileAvatar,
  QuickAccessCard,
  SecurityRow,
} from "@/components/account/AccountUi";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { formatVnd } from "@/lib/utils";

interface MeProfile {
  id: string;
  email: string;
  name?: string | null;
  walletBalance: number;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/profile");
      return;
    }
    apiFetch<MeProfile>("/me")
      .then(setProfile)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.push("/login?next=/profile");
        else setError(e instanceof ApiError ? e.message : "Không tải được hồ sơ");
      });
  }, [router]);

  if (error) {
    return (
      <AccountPageLayout title="Tài khoản cá nhân">
        <p className="text-red-600">{error}</p>
      </AccountPageLayout>
    );
  }

  if (!profile) {
    return (
      <AccountPageLayout title="Tài khoản cá nhân" subtitle="Đang tải...">
        <div className="h-64 animate-pulse rounded-[20px] bg-white/60" />
      </AccountPageLayout>
    );
  }

  const memberSince = new Date(profile.createdAt).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AccountPageLayout
      title="Tài khoản cá nhân"
      subtitle="Quản lý thông tin và bảo mật tài khoản Cynex của bạn."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <AccountCard>
            <AccountSectionHeader
              title="Thông tin cá nhân"
              description="Thông tin liên kết với tài khoản đăng nhập của bạn."
            />
            <div className="flex flex-col gap-8 sm:flex-row">
              <ProfileAvatar name={profile.name} email={profile.email} />
              <div className="grid flex-1 gap-5 sm:grid-cols-2">
                <InfoField label="Họ và tên" value={profile.name?.trim() || "—"} />
                <InfoField label="Email" value={profile.email} />
                <InfoField label="Thành viên từ" value={memberSince} />
                <InfoField
                  label="Số dư ví"
                  value={
                    <Link href="/wallet" className="text-sky-700 hover:underline">
                      {formatVnd(profile.walletBalance)}
                    </Link>
                  }
                />
              </div>
            </div>
          </AccountCard>

          <AccountCard>
            <AccountSectionHeader
              title="Bảo mật"
              description="Quản lý mật khẩu và bảo vệ tài khoản."
            />
            <SecurityRow
              icon={KeyRound}
              title="Mật khẩu"
              description="Đổi mật khẩu khi đã đăng nhập hoặc đặt lại qua email."
              action={<OutlineButton href="/forgot-password">Quên mật khẩu</OutlineButton>}
            />
            <ChangePasswordForm />
            <SecurityRow
              icon={Shield}
              title="Xác thực hai yếu tố"
              description="Tính năng đang được phát triển."
              action={
                <span className="inline-flex rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-400">
                  Sắp ra mắt
                </span>
              }
            />
          </AccountCard>
        </div>

        <aside className="space-y-6">
          <QuickAccessCard />
          <LogoutCard />
        </aside>
      </div>
    </AccountPageLayout>
  );
}
