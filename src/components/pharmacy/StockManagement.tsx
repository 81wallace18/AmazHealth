import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pharmacyService } from "@/services/pharmacyService";
import type { Medicine, MedicineStock } from "@/types/pharmacy";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PlusCircle } from "lucide-react";

type StockView = "AVAILABLE" | "NEAR" | "LOW" | "EXPIRED";

export function StockManagement() {
  const [view, setView] = useState<StockView>("AVAILABLE");
  const [stocks, setStocks] = useState<MedicineStock[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStock, setShowAddStock] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      if (view === "AVAILABLE") {
        const page = await pharmacyService.getStock({ page: 0, size: 50 });
        setStocks(page.content);
      } else if (view === "NEAR") {
        const data = await pharmacyService.getNearExpiryStock(30);
        setStocks(data);
      } else if (view === "LOW") {
        const data = await pharmacyService.getLowStock();
        setStocks(data);
      } else if (view === "EXPIRED") {
        const data = await pharmacyService.getExpiredStock();
        setStocks(data);
      }
    } catch (err: any) {
      toast({
        title: "Erro ao carregar estoque",
        description: err.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [view]);

  useEffect(() => {
    const loadMedicines = async () => {
      const page = await pharmacyService.getMedicines({ page: 0, size: 50 });
      setMedicines(page.content);
    };
    void loadMedicines();
  }, []);

  const handleAddStock = async () => {
    if (!selectedMedicine || !quantity || !batchNumber || !expirationDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o medicamento, lote, validade e quantidade.",
        variant: "destructive"
      });
      return;
    }

    try {
      await pharmacyService.addToStock({
        medicineId: selectedMedicine,
        quantityInStock: quantity,
        batchNumber,
        expiryDate: expirationDate
      });

      toast({
        title: "Estoque atualizado",
        description: "Entrada registrada com sucesso."
      });
      setShowAddStock(false);
      setSelectedMedicine("");
      setQuantity(0);
      setBatchNumber("");
      setExpirationDate("");
      await loadData();
    } catch (err: any) {
      toast({
        title: "Erro ao adicionar estoque",
        description: err.message || "Verifique os dados informados.",
        variant: "destructive"
      });
    }
  };

  const renderedStocks = useMemo(() => stocks, [stocks]);

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Gestão de Estoque</CardTitle>
          <p className="text-sm text-muted-foreground">Controle de lotes, validade e quantidade.</p>
        </div>
        <Button onClick={() => setShowAddStock(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar ao estoque
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={view} onValueChange={(value) => setView(value as StockView)}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="AVAILABLE">Disponível</TabsTrigger>
            <TabsTrigger value="NEAR">Próx. vencimento</TabsTrigger>
            <TabsTrigger value="LOW">Estoque baixo</TabsTrigger>
            <TabsTrigger value="EXPIRED">Vencidos</TabsTrigger>
          </TabsList>
          <TabsContent value={view}>
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando estoque...
              </div>
            ) : renderedStocks.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum item encontrado para o filtro selecionado.
              </div>
            ) : (
              <ScrollArea className="mt-4 h-[360px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicamento</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderedStocks.map((stock) => (
                      <TableRow key={`${stock.id}-${stock.batchNumber}`}>
                        <TableCell>
                          <div className="font-semibold">{stock.medicineName}</div>
                          <div className="text-xs text-muted-foreground">{stock.medicineCode}</div>
                        </TableCell>
                        <TableCell>{stock.batchNumber}</TableCell>
                        <TableCell>{stock.quantityInStock}</TableCell>
                        <TableCell>{stock.expiryDate ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant={stock.isExpired ? "destructive" : stock.isNearExpiry ? "secondary" : "outline"}>
                            {stock.status ?? (stock.isExpired ? "Vencido" : stock.isNearExpiry ? "Próx. Vencimento" : "Disponível")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={showAddStock} onOpenChange={setShowAddStock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar ao estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Medicamento</Label>
              <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine.id} value={medicine.id}>
                      {medicine.medicineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Lote</Label>
                <Input value={batchNumber} onChange={(event) => setBatchNumber(event.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Validade</Label>
                <Input type="date" value={expirationDate} onChange={(event) => setExpirationDate(event.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddStock(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddStock}>
              Salvar entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
