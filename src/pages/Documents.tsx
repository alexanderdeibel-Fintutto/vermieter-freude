import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Folder, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Documents() {
  return (
    <MainLayout title="Dokumente">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dokumente</h1>
            <p className="text-muted-foreground">
              Verwalten Sie alle wichtigen Dokumente
            </p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Dokument hochladen
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Dokumente suchen..." className="pl-9" />
        </div>

        {/* Categories */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Mietverträge", icon: FileText, count: 0 },
            { name: "Übergabeprotokolle", icon: FileText, count: 0 },
            { name: "Rechnungen", icon: FileText, count: 0 },
            { name: "Versicherungen", icon: FileText, count: 0 },
          ].map((category) => (
            <Card key={category.name} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Folder className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.count} Dateien</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Dokumente</CardTitle>
            <CardDescription>
              Ihre hochgeladenen Dokumente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Noch keine Dokumente
              </h3>
              <p className="text-muted-foreground mb-4">
                Laden Sie Ihr erstes Dokument hoch, um zu beginnen
              </p>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Dokument hochladen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
