import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Scale,
  Receipt,
  Home,
  Calculator,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  tags: string[];
}

interface KnowledgeCategory {
  id: string;
  label: string;
  icon: typeof BookOpen;
  color: string;
}

const CATEGORIES: KnowledgeCategory[] = [
  { id: "all", label: "Alle Artikel", icon: BookOpen, color: "text-primary" },
  { id: "mietrecht", label: "Mietrecht", icon: Scale, color: "text-blue-600" },
  { id: "steuern", label: "Steuern", icon: Calculator, color: "text-green-600" },
  { id: "betriebskosten", label: "Betriebskosten", icon: Receipt, color: "text-orange-600" },
  { id: "hausverwaltung", label: "Hausverwaltung", icon: Home, color: "text-purple-600" },
  { id: "faq", label: "FAQ", icon: HelpCircle, color: "text-cyan-600" },
];

const ARTICLES: KnowledgeArticle[] = [
  {
    id: "1",
    title: "Kündigungsfristen im Mietrecht",
    category: "mietrecht",
    excerpt: "Übersicht über die gesetzlichen Kündigungsfristen für Mieter und Vermieter nach BGB.",
    content: `Die Kündigungsfristen im deutschen Mietrecht sind in § 573c BGB geregelt.\n\n**Mieter:**\nDer Mieter kann mit einer Frist von 3 Monaten zum Monatsende kündigen, unabhängig von der Mietdauer.\n\n**Vermieter:**\nDie Kündigungsfrist des Vermieters staffelt sich nach der Mietdauer:\n- Bis 5 Jahre: 3 Monate zum Monatsende\n- 5 bis 8 Jahre: 6 Monate zum Monatsende\n- Über 8 Jahre: 9 Monate zum Monatsende\n\n**Sonderkündigungsrecht:**\nBei Mieterhöhungen hat der Mieter ein Sonderkündigungsrecht mit einer Frist von 2 Monaten zum Ende des übernächsten Monats.`,
    tags: ["Kündigung", "Fristen", "BGB", "§573c"],
  },
  {
    id: "2",
    title: "Mietpreisbremse - Regelungen und Ausnahmen",
    category: "mietrecht",
    excerpt: "Wann gilt die Mietpreisbremse und welche Ausnahmen gibt es?",
    content: `Die Mietpreisbremse (§ 556d BGB) begrenzt die Miete bei Wiedervermietung auf maximal 10% über der ortsüblichen Vergleichsmiete.\n\n**Gilt in:**\nGebieten mit angespanntem Wohnungsmarkt, die von der Landesregierung per Verordnung bestimmt wurden.\n\n**Ausnahmen:**\n- Neubauwohnungen (erstmalige Vermietung nach 01.10.2014)\n- Umfassend modernisierte Wohnungen\n- Vormiete war bereits höher als die zulässige Miete\n\n**Voraussetzung:**\nDer Vermieter muss vor Vertragsabschluss über die Vormiete oder Modernisierungsmaßnahmen informieren.`,
    tags: ["Mietpreisbremse", "Wiedervermietung", "§556d"],
  },
  {
    id: "3",
    title: "Abschreibung von Immobilien (AfA)",
    category: "steuern",
    excerpt: "Steuerliche Abschreibung von Wohngebäuden nach § 7 EStG.",
    content: `Die Absetzung für Abnutzung (AfA) ermöglicht es Vermietern, die Anschaffungs- oder Herstellungskosten eines Gebäudes steuerlich geltend zu machen.\n\n**Lineare AfA (§ 7 Abs. 4 EStG):**\n- Gebäude nach 31.12.1924: 2% pro Jahr (50 Jahre Nutzungsdauer)\n- Gebäude vor 01.01.1925: 2,5% pro Jahr (40 Jahre Nutzungsdauer)\n\n**Sonder-AfA (§ 7b EStG):**\n- 5% pro Jahr zusätzlich in den ersten 4 Jahren\n- Gilt für Neubauwohnungen unter bestimmten Bedingungen\n\n**Wichtig:**\nNur das Gebäude wird abgeschrieben, nicht der Grundstücksanteil. Der Gebäudeanteil wird typischerweise mit 70-80% der Gesamtkosten angesetzt.`,
    tags: ["AfA", "Abschreibung", "Steuer", "§7 EStG"],
  },
  {
    id: "4",
    title: "Werbungskosten bei Vermietung und Verpachtung",
    category: "steuern",
    excerpt: "Welche Kosten können Vermieter steuerlich absetzen?",
    content: `Werbungskosten sind alle Aufwendungen, die der Erzielung von Mieteinnahmen dienen.\n\n**Typische Werbungskosten:**\n- Darlehenszinsen (nicht Tilgung!)\n- Grundsteuer\n- Versicherungsprämien\n- Hausverwaltungskosten\n- Reparatur- und Instandhaltungskosten\n- Fahrtkosten zum Mietobjekt\n- Abschreibung (AfA)\n- Kontoführungsgebühren\n\n**Sofortabzug vs. Abschreibung:**\nReparaturen unter 4.000 € netto können sofort abgesetzt werden. Größere Maßnahmen müssen über die Nutzungsdauer abgeschrieben werden.\n\n**Erhaltungsaufwand:**\nKann auf 2-5 Jahre verteilt werden (§ 82b EStDV).`,
    tags: ["Werbungskosten", "Steuererklärung", "Anlage V"],
  },
  {
    id: "5",
    title: "Betriebskostenabrechnung erstellen",
    category: "betriebskosten",
    excerpt: "Schritt-für-Schritt-Anleitung zur korrekten Nebenkostenabrechnung.",
    content: `Die Betriebskostenabrechnung muss innerhalb von 12 Monaten nach Ende des Abrechnungszeitraums erstellt werden (§ 556 Abs. 3 BGB).\n\n**Formelle Anforderungen:**\n1. Angabe des Abrechnungszeitraums\n2. Zusammenstellung der Gesamtkosten\n3. Angabe und Erläuterung des Verteilerschlüssels\n4. Berechnung des Mieteranteils\n5. Abzug der Vorauszahlungen\n\n**Umlageschlüssel:**\n- Wohnfläche (am häufigsten)\n- Personenanzahl\n- Verbrauch (z.B. bei Heizung)\n- Einheitenschlüssel\n\n**Frist:**\nNach Ablauf der 12-Monats-Frist kann der Vermieter keine Nachforderungen mehr stellen, wohl aber ein Guthaben auszahlen.`,
    tags: ["Betriebskosten", "Nebenkostenabrechnung", "§556"],
  },
  {
    id: "6",
    title: "Umlagefähige Betriebskosten nach BetrKV",
    category: "betriebskosten",
    excerpt: "Vollständige Liste aller umlagefähigen Betriebskosten nach der Betriebskostenverordnung.",
    content: `Die Betriebskostenverordnung (BetrKV) definiert 17 umlagefähige Kostenarten:\n\n1. Grundsteuer\n2. Wasserversorgung\n3. Entwässerung\n4. Heizung\n5. Warmwasser\n6. Aufzug\n7. Straßenreinigung\n8. Müllbeseitigung\n9. Gebäudereinigung\n10. Gartenpflege\n11. Beleuchtung (Allgemeinstrom)\n12. Schornsteinreinigung\n13. Versicherungen\n14. Hausmeister\n15. Gemeinschaftsantenne/Kabel\n16. Wäschepflege\n17. Sonstige Betriebskosten\n\n**Nicht umlagefähig:**\n- Verwaltungskosten\n- Instandhaltungsrücklagen\n- Reparaturkosten\n- Bankgebühren`,
    tags: ["BetrKV", "Umlagefähig", "Kostenarten"],
  },
  {
    id: "7",
    title: "WEG-Verwaltung: Pflichten und Aufgaben",
    category: "hausverwaltung",
    excerpt: "Aufgaben der Wohnungseigentumsverwaltung nach dem WEG.",
    content: `Die WEG-Verwaltung hat nach der Reform 2020 folgende Kernaufgaben:\n\n**Laufende Verwaltung:**\n- Durchführung der Beschlüsse der Eigentümerversammlung\n- Verwaltung der gemeinschaftlichen Gelder\n- Ordnungsmäßige Instandhaltung und Instandsetzung\n- Erstellung des Wirtschaftsplans und der Jahresabrechnung\n\n**Eigentümerversammlung:**\n- Einberufung mindestens einmal jährlich\n- Protokollierung der Beschlüsse\n- Führung der Beschlusssammlung\n\n**Seit WEG-Reform 2020:**\n- Verwaltungsbeirat kann aus einer Person bestehen\n- Online-Teilnahme an Versammlungen möglich\n- Zertifizierter Verwalter ab 2024 vorgeschrieben`,
    tags: ["WEG", "Verwaltung", "Eigentümer"],
  },
  {
    id: "8",
    title: "Häufige Fragen zur Kaution",
    category: "faq",
    excerpt: "Antworten auf die häufigsten Fragen rund um die Mietkaution.",
    content: `**Wie hoch darf die Kaution sein?**\nMaximal 3 Nettokaltmieten (§ 551 BGB).\n\n**Muss der Vermieter die Kaution anlegen?**\nJa, getrennt vom eigenen Vermögen mit üblicher Verzinsung.\n\n**Kann die Kaution in Raten gezahlt werden?**\nJa, in 3 gleichen Monatsraten, die erste zu Beginn des Mietverhältnisses.\n\n**Wann muss die Kaution zurückgezahlt werden?**\nNach Ende des Mietverhältnisses, sobald alle Ansprüche des Vermieters geklärt sind. In der Regel 3-6 Monate, in Ausnahmefällen bis zur nächsten Betriebskostenabrechnung.\n\n**Darf der Vermieter die Kaution für laufende Miete verwenden?**\nNein, nur nach Beendigung des Mietverhältnisses.`,
    tags: ["Kaution", "FAQ", "§551 BGB"],
  },
  {
    id: "9",
    title: "Häufige Fragen zur Mieterhöhung",
    category: "faq",
    excerpt: "Wann und wie darf die Miete erhöht werden?",
    content: `**Mieterhöhung auf Vergleichsmiete (§ 558 BGB):**\n- Maximal bis zur ortsüblichen Vergleichsmiete\n- Kappungsgrenze: max. 20% in 3 Jahren (15% in angespannten Märkten)\n- Wartefrist: 15 Monate nach Einzug oder letzter Erhöhung\n\n**Mieterhöhung nach Modernisierung (§ 559 BGB):**\n- 8% der Modernisierungskosten pro Jahr\n- Maximal 3 €/m² in 6 Jahren (2 €/m² bei Mieten unter 7 €/m²)\n\n**Staffelmiete (§ 557a BGB):**\n- Festgelegte Mietsteigerungen in bestimmten Zeitabständen\n- Mindestens 1 Jahr zwischen den Stufen\n\n**Indexmiete (§ 557b BGB):**\n- Anpassung an den Verbraucherpreisindex\n- Höchstens einmal pro Jahr`,
    tags: ["Mieterhöhung", "Vergleichsmiete", "§558"],
  },
];

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter((article) => {
      // Category filter
      if (activeCategory !== "all" && article.category !== activeCategory) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.content.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [searchQuery, activeCategory]);

  const getCategoryConfig = (categoryId: string) => {
    return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0];
  };

  return (
    <MainLayout title="Wissensdatenbank" breadcrumbs={[{ label: "Wissensdatenbank" }]}>
      <div className="space-y-6">
        <PageHeader
          title="Wissensdatenbank"
          subtitle="Finden Sie Antworten zu Mietrecht, Steuern und Hausverwaltung."
        />

        {/* Search */}
        <Card>
          <CardContent className="py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Artikel durchsuchen (z.B. Kündigungsfrist, AfA, Betriebskosten)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          {/* Category Sidebar */}
          <div className="space-y-1">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const count = cat.id === "all"
                ? ARTICLES.length
                : ARTICLES.filter((a) => a.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-muted-foreground"
                  )}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <Icon className={cn("h-4 w-4", activeCategory === cat.id ? "text-primary" : cat.color)} />
                  <span className="text-sm font-medium flex-1">{cat.label}</span>
                  <Badge variant="secondary" className="h-5 text-xs">
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>

          {/* Articles */}
          <div className="space-y-4">
            {filteredArticles.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <h3 className="font-semibold">Keine Artikel gefunden</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Versuchen Sie einen anderen Suchbegriff oder wählen Sie eine andere Kategorie.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredArticles.map((article) => {
                const isExpanded = expandedArticle === article.id;
                const catConfig = getCategoryConfig(article.category);
                const CatIcon = catConfig.icon;

                return (
                  <Card key={article.id}>
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              <CatIcon className={cn("h-3 w-3 mr-1", catConfig.color)} />
                              {catConfig.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {article.excerpt}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0 ml-2">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="border-t pt-4">
                          <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                            {article.content}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t">
                            {article.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSearchQuery(tag);
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
