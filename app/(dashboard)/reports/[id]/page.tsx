"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Send,
  Calendar,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";

import { cn, getAvatarUrl } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchReportById,
  sendMessageAction,
  deleteMessageAction,
} from "../actions";
import { type ReportWithMessages, type Message } from "@/types/report";
import { useTranslation } from "@/lib/i18n";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReportDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [report, setReport] = useState<ReportWithMessages | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportId, setReportId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadReport() {
      const { id } = await params;
      setReportId(id);
      const { data, error } = await fetchReportById(id);
      if (error || !data) {
        toast({
          title: t("msg.error"),
          description: t("reports.not_found"),
          variant: "destructive",
        });
        router.push("/reports");
        return;
      }
      setReport(data);
      setLoading(false);
    }
    loadReport();
  }, [params, router, toast]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [report?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    const { error, message: newMessage } = await sendMessageAction(
      reportId,
      message.trim()
    );

    if (error) {
      toast({
        title: t("msg.error"),
        description: t("reports.send_error"),
        variant: "destructive",
      });
    } else {
      setMessage("");
      if (report && newMessage) {
        setReport({
          ...report,
          messages: [...(report.messages || []), newMessage],
        });
      }
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    senderType: "admin" | "user"
  ) => {
    const { error } = await deleteMessageAction(
      reportId,
      messageId,
      senderType
    );

    if (error) {
      toast({
        title: t("msg.error"),
        description: error,
        variant: "destructive",
      });
    } else {
      if (report) {
        setReport({
          ...report,
          messages: (report.messages || []).filter((m) => m.id !== messageId),
        });
      }
      toast({
        title: t("msg.success"),
        description: t("reports.delete_message_success"),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t("msg.loading")}</div>
      </div>
    );
  }

  if (!report) return null;

  const messages = report.messages || [];

  return (
    <div className="space-y-6">
      {/* Header with Breadcrumb */}
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/reports">{t("reports.title")}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage title="Report Detail">
                Report Detail
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left - Chat Section */}
        <div className="lg:col-span-2">
          <Card className="h-full min-h-[400px] flex flex-col">
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">
                      {t("reports.no_messages")}
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      {t("reports.start_conversation")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex gap-3 group",
                          msg.sender_type === "admin"
                            ? "flex-row-reverse"
                            : "flex-row"
                        )}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          {msg.sender_type === "admin" ? (
                            <>
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                AD
                              </AvatarFallback>
                            </>
                          ) : (
                            <>
                              <AvatarImage
                                src={getAvatarUrl(report.reporter?.avatar_url)}
                              />
                              <AvatarFallback>
                                {report.reporter?.fullname?.[0] || "U"}
                              </AvatarFallback>
                            </>
                          )}
                        </Avatar>
                        <div
                          className={cn(
                            "flex items-start gap-1",
                            msg.sender_type === "admin"
                              ? "flex-row-reverse"
                              : "flex-row"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-lg px-3 py-2",
                              msg.sender_type === "admin"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={cn(
                                "text-xs mt-1",
                                msg.sender_type === "admin"
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(msg.created_at), "HH:mm")}
                            </p>
                          </div>
                          {msg.sender_type === "admin" && (
                            <button
                              onClick={() =>
                                handleDeleteMessage(msg.id, msg.sender_type)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
                              title="Hapus pesan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={t("reports.type_message")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sending}
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Report Information */}
        <div className="space-y-6">
          {/* Report Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("reports.report_info")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  {t("table.title")}
                </p>
                <p className="font-medium truncate" title={report.title || "-"}>{report.title || "-"}</p>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {t("reports.description")}
                </p>
                <p className="text-sm line-clamp-3" title={report.description || "-"}>{report.description || "-"}</p>
              </div>

              <Separator />

              {/* Type */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  {t("reports.type")}
                </p>
                <p className="font-medium capitalize">
                  {report.reported_content_type || "-"}
                </p>
              </div>

              <Separator />

              {/* Created Date */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("quiz.created_at")}
                </p>
                <p className="font-medium">
                  {report.created_at
                    ? format(new Date(report.created_at), "dd MMM yyyy, HH:mm")
                    : "-"}
                </p>
              </div>

              {report.resolved_at && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t("reports.resolved")}
                    </p>
                    <p className="font-medium">
                      {format(
                        new Date(report.resolved_at),
                        "dd MMM yyyy, HH:mm"
                      )}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Admin Notes */}
          {report.admin_notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("reports.admin_notes")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm bg-muted p-3 rounded-lg">
                  {report.admin_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
