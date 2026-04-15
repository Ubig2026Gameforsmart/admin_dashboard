"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { ActionCard } from "@/components/dashboard/action-card";
import { SectionHeader } from "@/components/dashboard/section-header";
import {
  User,
  Shield,
  CheckCircle,
  AlertTriangle,
  Settings,
  Palette,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { SystemStatusCard } from "./_components/system-status-card";

export default function SettingsDashboardPage() {
  const { t } = useTranslation();

  const systemStatus = [
    { name: t("settings.service_email"), status: "Active", icon: CheckCircle },
    {
      name: t("settings.service_payment"),
      status: "Active",
      icon: CheckCircle,
    },
    {
      name: t("settings.service_storage"),
      status: "Active",
      icon: CheckCircle,
    },
    { name: t("settings.service_api"), status: "Warning", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          {t("settings.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t("settings.description")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title={t("settings.profile_completion")}
          value="85%"
          change={t("settings.update_profile")}
          changeType="neutral"
          icon={User}
        />
        <StatCard
          title={t("settings.security_score")}
          value="Good"
          change={t("settings.2fa_enabled")}
          changeType="increase"
          icon={Shield}
        />
        <StatCard
          title={t("settings.system_health")}
          value="98%"
          change={t("settings.all_operational")}
          changeType="increase"
          icon={Settings}
        />
      </div>

      {/* System Status */}
      <SystemStatusCard
        items={systemStatus}
        title={t("settings.system_status")}
        t={t}
      />

      {/* Quick Access */}
      <div>
        <SectionHeader
          title={t("settings.modules_title")}
          description={t("settings.modules_desc")}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title={t("settings.profile")}
            description={t("settings.profile_desc")}
            href="/settings/profile"
            icon={User}
          />
          <ActionCard
            title={t("settings.appearance")}
            description={t("settings.appearance_desc")}
            href="/appearance"
            icon={Palette}
          />
          <ActionCard
            title={t("settings.security")}
            description={t("settings.security_desc")}
            href="/settings/security"
            icon={Shield}
          />
        </div>
      </div>
    </div>
  );
}
