import {
  Calculator, TrendingUp, Shield, Landmark, BarChart3, Receipt, PiggyBank,
  FileText, ClipboardCheck, UserCheck, FileSpreadsheet, PenTool,
  Scale, AlertTriangle, Search, ClipboardList, XCircle, Lock,
  MinusCircle, Home, Hammer, Paintbrush,
  type LucideIcon,
} from "lucide-react";

export interface PortalTool {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: "rechner" | "formular" | "checker";
  creditCost: number;
  portalPath: string;
  /** Vermietify pages where this tool should be promoted */
  contextPages: string[];
}

const PORTAL_BASE = "https://portal.fintutto.cloud";

export const PORTAL_TOOLS: PortalTool[] = [
  // ─── Rechner (7) ───────────────────────────────────────
  {
    slug: "kaution-rechner",
    name: "Kautionsrechner",
    description: "Kaution nach §551 BGB berechnen",
    icon: Shield,
    category: "rechner",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/rechner/kaution`,
    contextPages: ["/vertraege/neu", "/vertraege"],
  },
  {
    slug: "mieterhoehung-rechner",
    name: "Mieterhöhungsrechner",
    description: "Zulässige Erhöhung nach §558 BGB",
    icon: TrendingUp,
    category: "rechner",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/rechner/mieterhoehung`,
    contextPages: ["/miete/anpassungen"],
  },
  {
    slug: "kaufnebenkosten-rechner",
    name: "Kaufnebenkostenrechner",
    description: "Grunderwerbsteuer, Notar & Makler",
    icon: Calculator,
    category: "rechner",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/rechner/kaufnebenkosten`,
    contextPages: ["/properties"],
  },
  {
    slug: "eigenkapital-rechner",
    name: "Eigenkapitalrechner",
    description: "Finanzierung & Eigenkapitalbedarf",
    icon: PiggyBank,
    category: "rechner",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/rechner/eigenkapital`,
    contextPages: ["/properties"],
  },
  {
    slug: "grundsteuer-rechner",
    name: "Grundsteuerrechner",
    description: "Neue Grundsteuer berechnen",
    icon: Landmark,
    category: "rechner",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/rechner/grundsteuer`,
    contextPages: ["/taxes", "/betriebskosten"],
  },
  {
    slug: "rendite-rechner",
    name: "Renditerechner",
    description: "Brutto-/Nettorendite & Cashflow",
    icon: BarChart3,
    category: "rechner",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/rechner/rendite`,
    contextPages: ["/properties", "/dashboard"],
  },
  {
    slug: "nebenkosten-rechner",
    name: "Nebenkostenrechner",
    description: "Umlagefähige Betriebskosten berechnen",
    icon: Receipt,
    category: "rechner",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/rechner/nebenkosten`,
    contextPages: ["/betriebskosten", "/betriebskosten/neu"],
  },

  // ─── Formulare (5) ────────────────────────────────────
  {
    slug: "formular-mietvertrag",
    name: "Mietvertrag erstellen",
    description: "Rechtssicherer Vertrag in 5 Schritten",
    icon: FileText,
    category: "formular",
    creditCost: 3,
    portalPath: `${PORTAL_BASE}/formulare/mietvertrag`,
    contextPages: ["/vertraege", "/vertraege/neu"],
  },
  {
    slug: "formular-uebergabe",
    name: "Übergabeprotokoll",
    description: "Digitales Wohnungsübergabeprotokoll",
    icon: ClipboardCheck,
    category: "formular",
    creditCost: 2,
    portalPath: `${PORTAL_BASE}/formulare/uebergabeprotokoll`,
    contextPages: ["/uebergaben", "/uebergaben/neu"],
  },
  {
    slug: "formular-selbstauskunft",
    name: "Selbstauskunft",
    description: "DSGVO-konforme Mieterselbstauskunft",
    icon: UserCheck,
    category: "formular",
    creditCost: 2,
    portalPath: `${PORTAL_BASE}/formulare/selbstauskunft`,
    contextPages: ["/angebote", "/angebote/neu"],
  },
  {
    slug: "formular-betriebskosten",
    name: "BK-Abrechnung",
    description: "Abrechnung mit 11 Kostenarten",
    icon: FileSpreadsheet,
    category: "formular",
    creditCost: 3,
    portalPath: `${PORTAL_BASE}/formulare/betriebskosten`,
    contextPages: ["/betriebskosten", "/betriebskosten/neu"],
  },
  {
    slug: "formular-mieterhoehung",
    name: "Mieterhöhungsschreiben",
    description: "Brief nach §558 BGB generieren",
    icon: PenTool,
    category: "formular",
    creditCost: 3,
    portalPath: `${PORTAL_BASE}/formulare/mieterhoehung`,
    contextPages: ["/miete/anpassungen"],
  },

  // ─── Checker (10) ─────────────────────────────────────
  {
    slug: "checker-mietpreisbremse",
    name: "Mietpreisbremse-Check",
    description: "Hält Ihre Miete die Bremse ein?",
    icon: Scale,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/mietpreisbremse`,
    contextPages: ["/miete/anpassungen", "/vertraege/neu"],
  },
  {
    slug: "checker-mieterhoehung",
    name: "Mieterhöhungs-Check",
    description: "Ist die Erhöhung rechtmäßig?",
    icon: AlertTriangle,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/mieterhoehung`,
    contextPages: ["/miete/anpassungen"],
  },
  {
    slug: "checker-nebenkosten",
    name: "Nebenkosten-Check",
    description: "Abrechnung korrekt?",
    icon: Search,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/nebenkosten`,
    contextPages: ["/betriebskosten"],
  },
  {
    slug: "checker-betriebskosten",
    name: "Betriebskosten-Check",
    description: "Formelle & inhaltliche Prüfung",
    icon: ClipboardList,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/betriebskosten`,
    contextPages: ["/betriebskosten"],
  },
  {
    slug: "checker-kuendigung",
    name: "Kündigungs-Check",
    description: "Ist die Kündigung wirksam?",
    icon: XCircle,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/kuendigung`,
    contextPages: ["/vertraege"],
  },
  {
    slug: "checker-kaution",
    name: "Kautions-Check",
    description: "Kaution nach §551 BGB prüfen",
    icon: Lock,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/kaution`,
    contextPages: ["/vertraege", "/vertraege/neu"],
  },
  {
    slug: "checker-mietminderung",
    name: "Mietminderungs-Check",
    description: "Anspruch auf Mietminderung?",
    icon: MinusCircle,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/mietminderung`,
    contextPages: ["/aufgaben"],
  },
  {
    slug: "checker-eigenbedarf",
    name: "Eigenbedarfs-Check",
    description: "Eigenbedarfskündigung rechtmäßig?",
    icon: Home,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/eigenbedarf`,
    contextPages: ["/vertraege"],
  },
  {
    slug: "checker-modernisierung",
    name: "Modernisierungs-Check",
    description: "Modernisierungsumlage prüfen",
    icon: Hammer,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/modernisierung`,
    contextPages: ["/miete/anpassungen"],
  },
  {
    slug: "checker-schoenheitsrep",
    name: "Schönheitsreparatur-Check",
    description: "Müssen Sie renovieren?",
    icon: Paintbrush,
    category: "checker",
    creditCost: 1,
    portalPath: `${PORTAL_BASE}/checker/schoenheitsreparaturen`,
    contextPages: ["/uebergaben"],
  },
];

export const RECHNER = PORTAL_TOOLS.filter(t => t.category === "rechner");
export const FORMULARE = PORTAL_TOOLS.filter(t => t.category === "formular");
export const CHECKER = PORTAL_TOOLS.filter(t => t.category === "checker");

export function getToolsForPage(pathname: string): PortalTool[] {
  return PORTAL_TOOLS.filter(t =>
    t.contextPages.some(p => pathname === p || pathname.startsWith(p + "/"))
  );
}
