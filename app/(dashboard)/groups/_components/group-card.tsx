import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import Link from "next/link";
import Image from "next/image";
import {
  MoreVertical,
  Calendar,
  Eye,
  Trash2,
  Users,
} from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Group } from "@/types/group";
function formatDate(dateString?: string | null, locale?: string): string {
  if (!dateString) return "-";
  return format(new Date(dateString), "d MMMM yyyy", {
    locale: locale === "id" ? idLocale : undefined,
  });
}

function getGroupStatus(group: Group): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  const settings = group.settings as { status?: string } | null;

  if (settings?.status === "private") {
    return { label: "PRIVATE", variant: "outline" };
  }
  return { label: "PUBLIC", variant: "secondary" };
}

function getLocation(group: Group): string {
  const creator = group.creator;
  if (creator?.state?.name || creator?.city?.name) {
    const parts = [creator.state?.name, creator.city?.name].filter(Boolean);
    return parts.join(", ");
  }

  const settings = group.settings as { location?: string } | null;
  return settings?.location || "-";
}

interface GroupCardProps {
  group: Group & { member_count: number };
  onDelete: (id: string, name: string) => void;
}

export function GroupCard({ group, onDelete }: GroupCardProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const name = group.name || "Unknown Group";
  const avatarUrl = group.avatar_url;
  const coverUrl = getAvatarUrl(group.cover_url);
  const status = getGroupStatus(group);
  const location = getLocation(group);
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const creator = group.creator;
  const creatorName = creator?.fullname || "Unknown";
  const creatorInitials = creatorName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleCardClick = () => {
    router.push(`/groups/${group.id}`);
  };

  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:border-primary/50 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative p-4 bg-muted overflow-hidden h-32">
        {coverUrl ? (
          <>
            <Image
              src={coverUrl}
              alt={name}
              fill
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />
        )}

        <div className="relative z-10 flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={status.variant}
              className={`text-[10px] font-semibold px-2 py-0.5 ${
                status.variant === "secondary"
                  ? "bg-green-500/90 text-white border-green-500"
                  : "bg-black/50 border-white/30 text-white"
              }`}
            >
              {status.label === "PUBLIC"
                ? t("groups.public")
                : t("groups.private")}
            </Badge>
            {group.category && (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold px-2 py-0.5 bg-black/50 border-white/30 text-white uppercase"
              >
                {(() => {
                  if (locale === "id") return group.category;

                  const translations: Record<string, string> = {
                    kampus: "Campus",
                    kantor: "Office",
                    keluarga: "Family",
                    komunitas: "Community",
                    "masjid/musholla": "Mosque",
                    pesantren: "Islamic Boarding School",
                    sekolah: "School",
                    "tpa/tpq": "TPA/TPQ",
                    umum: "General",
                    lainnya: "Other",
                    campus: "Campus",
                    office: "Office",
                    family: "Family",
                    community: "Community",
                    mosque: "Mosque",
                    "islamic boarding school": "Islamic Boarding School",
                    school: "School",
                    general: "General",
                    other: "Other",
                  };
                  const key = group.category ? group.category.toLowerCase() : "";
                  return translations[key] || group.category;
                })()}
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                  coverUrl ? "text-white hover:bg-white/20" : ""
                }`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={`/groups/${group.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("action.view_details")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group.id, name);
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("action.move_to_trash")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-white/50 shadow-md ring-2 ring-background">
            <AvatarImage
              src={getAvatarUrl(avatarUrl)}
              alt={name}
              className="object-cover"
            />
            <AvatarFallback className="bg-muted text-muted-foreground font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-bold text-base truncate leading-tight ${
                coverUrl ? "text-white" : "text-foreground"
              }`}
              title={name}
            >
              {name}
            </h3>
            <p
              className={`text-xs truncate mt-0.5 ${
                coverUrl ? "text-white/80" : "text-muted-foreground"
              }`}
              title={location}
            >
              {location}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 pt-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
          {t("groups.created_by")}
        </p>
        <Link
          href={`/users/${group.creator_id}`}
          className="flex items-center gap-2 hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage
              src={getAvatarUrl(creator?.avatar_url)}
              alt={creatorName}
            />
            <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
              {creatorInitials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p
              className="text-sm font-medium text-foreground truncate hover:text-primary transition-colors"
              title={creatorName}
            >
              {creatorName}
            </p>
            <p
              className="text-xs text-muted-foreground truncate"
              title={`@${creator?.username || "-"}`}
            >
              @{creator?.username || "-"}
            </p>
          </div>
        </Link>
      </div>

      <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(group.created_at, locale)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>
              {group.member_count} {t("table.members")}
            </span>
          </div>
        </div>

        <Button
          className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          size="sm"
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/groups/${group.id}`}>
            <Eye className="h-4 w-4" />
            {t("action.view_details")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
