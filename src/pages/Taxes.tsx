import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, FileText, Download, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Taxes() {
  return (
    <MainLayout title="Steuern">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Steuern</h1>
            <p className="text-muted-foreground">
              Vorbereitung für Anlage V und Steuererklärung
            </p>
          </div>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Daten exportieren
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Hinweis</AlertTitle>
          <AlertDescription>
            Die hier bereitgestellten Daten dienen der Vorbereitung Ihrer Steuererklärung. 
            Bitte konsultieren Sie Ihren Steuerberater für verbindliche Auskünfte.
          </AlertDescription>
        </Alert>

        {/* Tax Categories */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Anlage V
              </CardTitle>
              <CardDescription>
                Einkünfte aus Vermietung und Verpachtung
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Mieteinnahmen (gesamt)</span>
                  <span className="font-medium">€ 0,00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">Werbungskosten</span>
                  <span className="font-medium">€ 0,00</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm">AfA (Abschreibung)</span>
                  <span className="font-medium">€ 0,00</span>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <span className="font-medium">Einkünfte V+V</span>
                  <span className="font-bold">€ 0,00</span>
                </div>
                <Button variant="outline" className="w-full">
                  Details anzeigen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Steuerschätzung
              </CardTitle>
              <CardDescription>
                Voraussichtliche Steuerlast
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Keine Daten vorhanden
                </h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Erfassen Sie Einnahmen und Ausgaben, um eine Steuerschätzung zu erhalten
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export-Optionen</CardTitle>
            <CardDescription>
              Exportieren Sie Ihre Daten für den Steuerberater
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Anlage V (PDF)</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Einnahmen (Excel)</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span>Komplett (ZIP)</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
