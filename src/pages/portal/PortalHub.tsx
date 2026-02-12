import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, ExternalLink, Calculator, FileText, Scale } from "lucide-react";
import { RECHNER, FORMULARE, CHECKER, type PortalTool } from "@/config/portalTools";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

function ToolCard({ tool }: { tool: PortalTool }) {
  const handleOpen = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const url = token
      ? `${tool.portalPath}?access_token=${token}`
      : tool.portalPath;
    window.open(url, "_blank");
  };

  return (
    <Card className="group hover:shadow-lg transition-all hover:border-primary/30">
      <CardContent className="p-4 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <tool.icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{tool.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{tool.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs gap-1">
              <Coins className="h-3 w-3" />
              {tool.creditCost} {tool.creditCost === 1 ? "Credit" : "Credits"}
            </Badge>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handleOpen} className="shrink-0 gap-1">
          <ExternalLink className="h-3.5 w-3.5" />
          Öffnen
        </Button>
      </CardContent>
    </Card>
  );
}

function ToolGrid({ tools }: { tools: PortalTool[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {tools.map(tool => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}

export default function PortalHub() {
  const { plan } = useSubscription();
  const credits = plan?.portalCredits ?? 3;
  const creditsLabel = credits === -1 ? "Unbegrenzt" : `${credits}/Monat`;

  return (
    <MainLayout
      title="Fintutto Portal"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Portal" },
      ]}
    >
      <div className="space-y-6">
        {/* Credits Info */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Ihre Portal-Credits: {creditsLabel}</p>
                <p className="text-sm text-muted-foreground">
                  Rechner = 1 Credit · Formulare = 2-3 Credits · PDF-Export = +1 Credit
                </p>
              </div>
            </div>
            {credits !== -1 && (
              <Button variant="outline" size="sm" asChild>
                <a href="/pricing">Mehr Credits</a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Tools Tabs */}
        <Tabs defaultValue="rechner">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rechner" className="gap-1.5">
              <Calculator className="h-4 w-4" />
              Rechner ({RECHNER.length})
            </TabsTrigger>
            <TabsTrigger value="formulare" className="gap-1.5">
              <FileText className="h-4 w-4" />
              Formulare ({FORMULARE.length})
            </TabsTrigger>
            <TabsTrigger value="checker" className="gap-1.5">
              <Scale className="h-4 w-4" />
              Checker ({CHECKER.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rechner" className="mt-4">
            <ToolGrid tools={RECHNER} />
          </TabsContent>
          <TabsContent value="formulare" className="mt-4">
            <ToolGrid tools={FORMULARE} />
          </TabsContent>
          <TabsContent value="checker" className="mt-4">
            <ToolGrid tools={CHECKER} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
