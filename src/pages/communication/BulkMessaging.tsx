import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  MessageSquare,
  FileText,
  Send,
  Clock,
  Users,
  Building2,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  History,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

type Channel = "email" | "whatsapp" | "letter";
type RecipientType = "all" | "building" | "custom";

interface Campaign {
  id: string;
  name: string;
  channel: Channel;
  recipientCount: number;
  status: "draft" | "scheduled" | "sent" | "failed";
  sentAt: string | null;
  openRate: number | null;
}

const CHANNEL_CONFIG: Record<Channel, { label: string; icon: LucideIcon; color: string }> = {
  email: { label: "E-Mail", icon: Mail, color: "bg-blue-100 text-blue-800" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "bg-green-100 text-green-800" },
  letter: { label: "Brief", icon: FileText, color: "bg-orange-100 text-orange-800" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  draft: { label: "Entwurf", color: "bg-gray-100 text-gray-800", icon: FileText },
  scheduled: { label: "Geplant", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  sent: { label: "Gesendet", color: "bg-green-100 text-green-800", icon: CheckCircle },
  failed: { label: "Fehlgeschlagen", color: "bg-red-100 text-red-800", icon: AlertCircle },
};

// Mock past campaigns
const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Nebenkostenabrechnung 2024",
    channel: "email",
    recipientCount: 45,
    status: "sent",
    sentAt: "2025-03-15T10:00:00Z",
    openRate: 78,
  },
  {
    id: "2",
    name: "Wartungsarbeiten Heizung",
    channel: "email",
    recipientCount: 12,
    status: "sent",
    sentAt: "2025-03-10T14:30:00Z",
    openRate: 92,
  },
  {
    id: "3",
    name: "Einladung Hausfest",
    channel: "whatsapp",
    recipientCount: 30,
    status: "sent",
    sentAt: "2025-02-28T09:00:00Z",
    openRate: 95,
  },
  {
    id: "4",
    name: "Mieterhöhung Q2 2025",
    channel: "letter",
    recipientCount: 8,
    status: "scheduled",
    sentAt: null,
    openRate: null,
  },
  {
    id: "5",
    name: "Rauchmelder-Prüfung",
    channel: "email",
    recipientCount: 60,
    status: "draft",
    sentAt: null,
    openRate: null,
  },
];

export default function BulkMessaging() {
  const { toast } = useToast();
  const [channel, setChannel] = useState<Channel>("email");
  const [recipientType, setRecipientType] = useState<RecipientType>("all");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie Betreff und Nachricht aus",
        variant: "destructive",
      });
      return;
    }
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: isScheduled ? "Nachricht geplant" : "Nachricht gesendet",
        description: isScheduled
          ? "Die Nachricht wird zum geplanten Zeitpunkt versendet"
          : "Die Nachricht wurde erfolgreich an alle Empfänger gesendet",
      });
      setSubject("");
      setBody("");
    }, 2000);
  };

  return (
    <MainLayout title="Massenversand">
      <div className="space-y-6">
        <PageHeader
          title="Massenversand"
          subtitle="Nachrichten an mehrere Empfänger gleichzeitig senden"
          breadcrumbs={[
            { label: "Kommunikation", href: "/kommunikation" },
            { label: "Massenversand" },
          ]}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Message Composer */}
          <div className="space-y-4">
            {/* Channel Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kanal auswählen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {(Object.entries(CHANNEL_CONFIG) as [Channel, typeof CHANNEL_CONFIG.email][]).map(
                    ([key, cfg]) => {
                      const Icon = cfg.icon;
                      return (
                        <Button
                          key={key}
                          variant={channel === key ? "default" : "outline"}
                          className="h-auto py-4 flex-col gap-2"
                          onClick={() => setChannel(key)}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-sm">{cfg.label}</span>
                        </Button>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recipient Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Empfänger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant={recipientType === "all" ? "default" : "outline"}
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => setRecipientType("all")}
                  >
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Alle Mieter</span>
                  </Button>
                  <Button
                    variant={recipientType === "building" ? "default" : "outline"}
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => setRecipientType("building")}
                  >
                    <Building2 className="h-4 w-4" />
                    <span className="text-xs">Nach Gebäude</span>
                  </Button>
                  <Button
                    variant={recipientType === "custom" ? "default" : "outline"}
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => setRecipientType("custom")}
                  >
                    <UserCheck className="h-4 w-4" />
                    <span className="text-xs">Benutzerdefiniert</span>
                  </Button>
                </div>

                {recipientType === "building" && (
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gebäude auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="building-1">Hauptstraße 1</SelectItem>
                      <SelectItem value="building-2">Parkweg 5</SelectItem>
                      <SelectItem value="building-3">Seestraße 12</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {recipientType === "custom" && (
                  <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    <UserCheck className="h-4 w-4 inline mr-2" />
                    Wählen Sie einzelne Mieter aus der Mieterliste aus
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Content */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Nachricht</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Betreff</Label>
                  <Input
                    placeholder="Betreff der Nachricht"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nachricht</Label>
                  <Textarea
                    placeholder="Ihre Nachricht an die Mieter..."
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Platzhalter: {"{{vorname}}"}, {"{{nachname}}"}, {"{{einheit}}"}, {"{{gebaeude}}"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Send */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant={isScheduled ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsScheduled(!isScheduled)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Planen
                    </Button>
                    {isScheduled && (
                      <Input
                        type="datetime-local"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        className="w-auto"
                      />
                    )}
                  </div>
                  <Button onClick={handleSend} disabled={isSending}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isScheduled ? "Nachricht planen" : "Jetzt senden"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Campaign History */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <History className="h-4 w-4" />
                  Vergangene Kampagnen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockCampaigns.map((campaign) => {
                    const channelCfg = CHANNEL_CONFIG[campaign.channel];
                    const statusCfg = STATUS_CONFIG[campaign.status];
                    const ChannelIcon = channelCfg.icon;
                    return (
                      <div
                        key={campaign.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium leading-tight">
                            {campaign.name}
                          </p>
                          <Badge className={`${statusCfg.color} text-[10px] shrink-0 ml-2`}>
                            {statusCfg.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ChannelIcon className="h-3 w-3" />
                            {channelCfg.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {campaign.recipientCount}
                          </span>
                          {campaign.openRate !== null && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {campaign.openRate}% geöffnet
                            </span>
                          )}
                        </div>
                        {campaign.sentAt && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(campaign.sentAt).toLocaleDateString("de-DE", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Statistiken</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gesendet gesamt</span>
                    <span className="text-sm font-medium">
                      {mockCampaigns
                        .filter((c) => c.status === "sent")
                        .reduce((sum, c) => sum + c.recipientCount, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Durchschnittl. Öffnungsrate</span>
                    <span className="text-sm font-medium">
                      {Math.round(
                        mockCampaigns
                          .filter((c) => c.openRate !== null)
                          .reduce((sum, c) => sum + (c.openRate || 0), 0) /
                          Math.max(
                            1,
                            mockCampaigns.filter((c) => c.openRate !== null).length
                          )
                      )}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Kampagnen gesamt</span>
                    <span className="text-sm font-medium">{mockCampaigns.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
