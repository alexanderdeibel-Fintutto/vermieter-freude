import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useUnits } from "@/hooks/useUnits";
import type { Database } from "@/integrations/supabase/types";

type UnitRow = Database["public"]["Tables"]["units"]["Row"];

// Features available for selection
const FEATURES = [
  { id: "balkon", label: "Balkon" },
  { id: "keller", label: "Keller" },
  { id: "aufzug", label: "Aufzug" },
  { id: "stellplatz", label: "Stellplatz" },
  { id: "einbaukueche", label: "Einbauküche" },
] as const;

const unitFormSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  floor: z.coerce.number().int().optional().nullable(),
  size_sqm: z.coerce
    .number()
    .positive("Fläche muss größer als 0 sein")
    .optional()
    .nullable()
    .or(z.literal("")),
  rooms: z.coerce.number().positive().optional().nullable().or(z.literal("")),
  rent_cold: z.coerce.number().positive("Kaltmiete muss größer als 0 sein"),
  additional_costs: z.coerce.number().min(0).optional().nullable().or(z.literal("")),
  features: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

type UnitFormValues = z.infer<typeof unitFormSchema>;

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingId: string;
  unit?: UnitRow;
  onSuccess?: () => void;
}

export function UnitFormDialog({
  open,
  onOpenChange,
  buildingId,
  unit,
  onSuccess,
}: UnitFormDialogProps) {
  const { toast } = useToast();
  const { createUnit, updateUnit } = useUnits();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!unit;

  // Parse features from notes (stored as JSON string for now)
  const parseFeatures = (notes: string | null): string[] => {
    if (!notes) return [];
    try {
      const parsed = JSON.parse(notes);
      if (parsed.features && Array.isArray(parsed.features)) {
        return parsed.features;
      }
    } catch {
      // Not JSON, return empty
    }
    return [];
  };

  // Combine notes text with features for storage
  const combineNotesAndFeatures = (
    notesText: string | null | undefined,
    features: string[] | undefined
  ): string | null => {
    const hasFeatures = features && features.length > 0;
    const hasNotes = notesText && notesText.trim().length > 0;
    
    if (!hasFeatures && !hasNotes) return null;
    
    if (hasFeatures) {
      return JSON.stringify({
        text: notesText || "",
        features: features,
      });
    }
    
    return notesText || null;
  };

  // Parse notes text from stored value
  const parseNotesText = (notes: string | null): string => {
    if (!notes) return "";
    try {
      const parsed = JSON.parse(notes);
      return parsed.text || "";
    } catch {
      return notes;
    }
  };

  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      name: "",
      floor: null,
      size_sqm: "",
      rooms: "",
      rent_cold: 0,
      additional_costs: "",
      features: [],
      notes: "",
    },
  });

  // Reset form when unit changes or dialog opens
  useEffect(() => {
    if (open) {
      if (unit) {
        form.reset({
          name: unit.unit_number,
          floor: unit.floor,
          size_sqm: unit.area || "",
          rooms: unit.rooms || "",
          rent_cold: unit.rent_amount / 100, // Convert from cents to Euro
          additional_costs: unit.utility_advance ? unit.utility_advance / 100 : "",
          features: parseFeatures(unit.notes),
          notes: parseNotesText(unit.notes),
        });
      } else {
        form.reset({
          name: "",
          floor: null,
          size_sqm: "",
          rooms: "",
          rent_cold: 0,
          additional_costs: "",
          features: [],
          notes: "",
        });
      }
    }
  }, [open, unit, form]);

  const onSubmit = async (values: UnitFormValues) => {
    setIsSubmitting(true);
    try {
      const combinedNotes = combineNotesAndFeatures(values.notes, values.features);
      
      const unitData = {
        building_id: buildingId,
        unit_number: values.name,
        floor: values.floor || null,
        area: typeof values.size_sqm === "number" ? values.size_sqm : 0,
        rooms: typeof values.rooms === "number" ? values.rooms : 1,
        rent_amount: Math.round(values.rent_cold * 100), // Convert Euro to cents
        utility_advance: typeof values.additional_costs === "number" 
          ? Math.round(values.additional_costs * 100) 
          : 0,
        notes: combinedNotes,
        status: "vacant" as const,
      };

      if (isEditMode && unit) {
        await updateUnit.mutateAsync({ id: unit.id, data: unitData });
        toast({
          title: "Einheit aktualisiert",
          description: "Die Änderungen wurden erfolgreich gespeichert.",
        });
      } else {
        await createUnit.mutateAsync(unitData);
        toast({
          title: "Einheit erstellt",
          description: "Die neue Einheit wurde erfolgreich angelegt.",
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving unit:", error);
      toast({
        title: "Fehler",
        description: "Die Einheit konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Einheit bearbeiten" : "Neue Einheit erstellen"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name / Bezeichnung *</FormLabel>
                  <FormControl>
                    <Input placeholder="z.B. Wohnung 1.OG links" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="floor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etage</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="z.B. 1"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? null : parseInt(e.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size_sqm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fläche (m²)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="z.B. 75.5"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zimmer</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="z.B. 3"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rent_cold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kaltmiete (€) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="z.B. 850"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="additional_costs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nebenkosten-Vorauszahlung (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="z.B. 200"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="features"
              render={() => (
                <FormItem>
                  <FormLabel>Ausstattung</FormLabel>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {FEATURES.map((feature) => (
                      <FormField
                        key={feature.id}
                        control={form.control}
                        name="features"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(feature.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, feature.id]);
                                  } else {
                                    field.onChange(
                                      current.filter((val) => val !== feature.id)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {feature.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notizen</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Zusätzliche Informationen zur Einheit..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Speichere..." : "Speichern"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
