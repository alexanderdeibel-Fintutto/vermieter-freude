import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  MessageSquare,
  FileText,
  Send,
  MailOpen,
  Reply,
  TrendingUp,
  Calendar,
  Download,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";
import { de } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

// Mock channel breakdown data
const channelData = [
  { name: "E-Mail", value: 65, color: "hsl(var(--primary))" },
  { name: "WhatsApp", value: 25, color: "#10b981" },
  { name: "Brief", value: 10, color: "#f59e0b" },
];

// Mock monthly send volume
const monthlyVolume = Array.from({ length: 6 }, (_, i) => ({
  month: format(subDays(new Date(), (5 - i) * 30), "MMM", { locale: de }),
  email: Math.floor(Math.random() * 40) + 20,
  whatsapp: Math.floor(Math.random() * 20) + 5,
  letter: Math.floor(Math.random() * 8) + 2,
}));

// Mock recent activity log
const recentActivity = [
  {
    id: "1",
    type: "email" as const,
    description: "Nebenkostenabrechnung an Familie Müller gesendet",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: "delivered",
  },
  {
    id: "2",
    type: "whatsapp" as const,
    description: "Wartungshinweis an Thomas Klein gelesen",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    status: "read",
  },
  {
    id: "3",
    type: "email" as const,
    description: "Mieterhöhung an Peter Fischer geöffnet",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    status: "opened",
  },
  {
    id: "4",
    type: "letter" as const,
    description: "Kündigung an Anna Weber generiert",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    status: "generated",
  },
  {
    id: "5",
    type: "email" as const,
    description: "Erinnerung Mietzahlung an Maria Bauer zugestellt",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    status: "delivered",
  },
  {
    id: "6",
    type: "whatsapp" as const,
    description: "Bestätigung Besichtigungstermin an Max Schmidt",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    status: "sent",
  },
  {
    id: "7",
    type: "email" as const,
    description: "Massenversand: Wartungsarbeiten Info fehlgeschlagen",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: "failed",
  },
  {
    id: "8",
    type: "email" as const,
    description: "Willkommensmail an neue Mieterin Lisa Wagner",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: "delivered",
  },
];

const TYPE_ICONS = {
  email: Mail,
  whatsapp: MessageSquare,
  letter: FileText,
};

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  sent: { label: "Gesendet", color: "bg-blue-100 text-blue-800" },
  delivered: { label: "Zugestellt", color: "bg-green-100 text-green-800" },
  opened: { label: "Geöffnet", color: "bg-purple-100 text-purple-800" },
  read: { label: "Gelesen", color: "bg-emerald-100 text-emerald-800" },
  generated: { label: "Erstellt", color: "bg-gray-100 text-gray-800" },
  failed: { label: "Fehlgeschlagen", color: "bg-red-100 text-red-800" },
};

export default function CommunicationAnalytics() {
  const [period, setPeriod] = useState("6m");

  // Mock KPI values
  const totalSent = 342;
  const openRate = 82;
  const responseRate = 45;
  const avgDeliveryTime = "1.2 Min";

  return (
    <MainLayout title="Kommunikationsanalyse">
      <div className="space-y-6">
        <PageHeader
          title="Kommunikationsanalyse"
          subtitle="Auswertung aller Kommunikationskanäle und Kampagnen"
          breadcrumbs={[
            { label: "Kommunikation", href: "/kommunikation" },
            { label: "Analytics" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-36">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Monat</SelectItem>
                  <SelectItem value="3m">3 Monate</SelectItem>
                  <SelectItem value="6m">6 Monate</SelectItem>
                  <SelectItem value="12m">12 Monate</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportieren
              </Button>
            </div>
          }
        />

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Nachrichten gesendet"
            value={totalSent}
            icon={Send}
            trend={{ value: 12, isPositive: true }}
            description="Im gewählten Zeitraum"
          />
          <StatCard
            title="Öffnungsrate"
            value={`${openRate}%`}
            icon={MailOpen}
            trend={{ value: 3.2, isPositive: true }}
            description="E-Mail-Kampagnen"
          />
          <StatCard
            title="Antwortrate"
            value={`${responseRate}%`}
            icon={Reply}
            trend={{ value: 1.5, isPositive: true }}
            description="Direkte Antworten"
          />
          <StatCard
            title="Zustellzeit"
            value={avgDeliveryTime}
            icon={Clock}
            description="Durchschnittlich"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Channel Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kanalverteilung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4 flex-1">
                  {channelData.map((item) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Send Volume */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Versandvolumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyVolume}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="email"
                      name="E-Mail"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="whatsapp"
                      name="WhatsApp"
                      fill="#10b981"
                      radius={[0, 0, 0, 0]}
                      stackId="a"
                    />
                    <Bar
                      dataKey="letter"
                      name="Brief"
                      fill="#f59e0b"
                      radius={[4, 4, 0, 0]}
                      stackId="a"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Letzte Aktivitäten
            </CardTitle>
            <CardDescription>Chronologische Übersicht aller Kommunikationsereignisse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                const TypeIcon = TYPE_ICONS[activity.type];
                const status = STATUS_STYLES[activity.status];
                const timeAgo = getTimeAgo(activity.timestamp);
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                      <TypeIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                    <Badge className={`${status.color} shrink-0`}>{status.label}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Vor ${minutes} Minuten`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vor ${hours} Stunden`;
  const days = Math.floor(hours / 24);
  return `Vor ${days} Tagen`;
}
