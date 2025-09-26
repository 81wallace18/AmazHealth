import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

const dischargeSchema = z.object({
  discharge_date: z.date({
    required_error: "Data de alta é obrigatória",
  }),
  discharge_summary: z.string().min(1, "Resumo de alta é obrigatório"),
});

type DischargeFormData = z.infer<typeof dischargeSchema>;

interface DischargeFormProps {
  admission: any;
  onSubmit: (data: DischargeFormData) => Promise<void>;
  onCancel: () => void;
}

export function DischargeForm({ admission, onSubmit, onCancel }: DischargeFormProps) {
  const form = useForm<DischargeFormData>({
    resolver: zodResolver(dischargeSchema),
    defaultValues: {
      discharge_date: new Date(),
    },
  });

  const handleSubmit = async (data: DischargeFormData) => {
    try {
      await onSubmit({
        ...data,
        discharge_date: data.discharge_date.toISOString(),
      } as any);
    } catch (error) {
      console.error('Error submitting discharge:', error);
    }
  };

  return (
    <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <CardContent className="max-w-md w-full">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Alta Hospitalar</CardTitle>
          <CardDescription>
            Registrar alta para {admission.patient?.first_name} {admission.patient?.last_name}
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="discharge_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Alta</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="discharge_summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumo de Alta</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o resumo de alta, condições do paciente, medicações, cuidados..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Confirmar Alta
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}