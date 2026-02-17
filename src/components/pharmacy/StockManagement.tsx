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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { pharmacyService } from "@/services/pharmacyService";
import type { Medicine, MedicineRequest, MedicineStock } from "@/types/pharmacy";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCapabilities } from "@/auth/useCapabilities";
import { Loader2, PlusCircle, Pencil } from "lucide-react";

type StockView = "AVAILABLE" | "NEAR" | "LOW" | "EXPIRED";

const DOSAGE_FORMS = [
  { value: "TABLET", label: "Comprimido" },
  { value: "CAPSULE", label: "Cápsula" },
  { value: "SYRUP", label: "Xarope" },
  { value: "SOLUTION", label: "Solução" },
  { value: "INJECTION", label: "Injetável" },
  { value: "OINTMENT", label: "Pomada" },
  { value: "CREAM", label: "Creme" },
  { value: "GEL", label: "Gel" },
  { value: "SPRAY", label: "Spray" },
  { value: "DROPS", label: "Gotas" },
  { value: "INHALER", label: "Inalador" },
  { value: "PATCH", label: "Adesivo" },
  { value: "SUPPOSITORY", label: "Supositório" },
  { value: "POWDER", label: "Pó" },
  { value: "GRANULES", label: "Granulados" },
  { value: "SUSPENSION", label: "Suspensão" },
  { value: "EMULSION", label: "Emulsão" },
  { value: "LOTION", label: "Loção" }
];

const MEDICINE_CATEGORIES = [
  { value: "ANALGESIC", label: "Analgésico" },
  { value: "ANTIBIOTIC", label: "Antibiótico" },
  { value: "ANTI_INFLAMMATORY", label: "Anti-inflamatório" },
  { value: "ANTIPYRETIC", label: "Antitérmico" },
  { value: "ANTIHYPERTENSIVE", label: "Anti-hipertensivo" },
  { value: "DIURETIC", label: "Diurético" },
  { value: "CARDIAC", label: "Cardíaco" },
  { value: "VITAMIN", label: "Vitamina" },
  { value: "CONTROLLED", label: "Controlado" },
  { value: "BLOOD_COMPONENT", label: "Hemocomponente" },
  { value: "CONTRAST_MEDIA", label: "Meio de Contraste" },
  { value: "VACCINE", label: "Vacina" },
  { value: "SERUM", label: "Soro" },
  { value: "ANESTHETIC", label: "Anestésico" },
  { value: "ANTIDIABETIC", label: "Antidiabético" },
  { value: "ANTICOAGULANT", label: "Anticoagulante" },
  { value: "ANTIALLERGIC", label: "Antialérgico" },
  { value: "GASTROPROTECTOR", label: "Gastroprotetor" },
  { value: "OTHER", label: "Outro" }
];

interface StockManagementProps {
  canManageStock?: boolean;
}

export function StockManagement({ canManageStock = true }: StockManagementProps) {
  const capabilities = useCapabilities();
  const canManageInventory = canManageStock && capabilities.canManageStock;
  const [view, setView] = useState<StockView>("AVAILABLE");
  const [stocks, setStocks] = useState<MedicineStock[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showCreateMedicine, setShowCreateMedicine] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(0);
  const [batchNumber, setBatchNumber] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [medicineForm, setMedicineForm] = useState<MedicineRequest | null>(null);
  const [createForm, setCreateForm] = useState<MedicineRequest | null>(null);
  const [savingMedicine, setSavingMedicine] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [loadingMedicineDetails, setLoadingMedicineDetails] = useState(false);
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

  const openEditMedicine = async (medicineId: string) => {
    if (!canManageInventory) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para editar medicamentos.",
        variant: "destructive",
      });
      return;
    }

    setLoadingMedicineDetails(true);
    try {
      let medicine = medicines.find((item) => item.id === medicineId);
      if (!medicine) {
        const fetched = await pharmacyService.getMedicineById(medicineId);
        setMedicines((prev) => [...prev, fetched]);
        medicine = fetched;
      }

      const form: MedicineRequest = {
        medicineCode: medicine.medicineCode,
        medicineName: medicine.medicineName,
        genericName: medicine.genericName,
        strength: medicine.strength,
        dosageForm: medicine.dosageForm,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        unitPrice: medicine.unitPrice,
        reorderLevel: medicine.reorderLevel,
        isActive: medicine.isActive ?? true,
        status: medicine.status,
        description: medicine.description,
        requiresPrescription: medicine.requiresPrescription ?? true,
        isControlled: medicine.isControlled ?? false,
        maxDispenseQuantity: medicine.maxDispenseQuantity,
        minDispenseQuantity: medicine.minDispenseQuantity,
        barcode: medicine.barcode
      };

      if (medicine) {
        setMedicineForm(form);
        setEditingMedicineId(medicine.id);
        setIsEditOpen(true);
      }
    } catch (err: any) {
      toast({
        title: "Erro ao carregar medicamento",
        description: err?.message || "Não foi possível carregar os dados do medicamento selecionado.",
        variant: "destructive"
      });
    } finally {
      setLoadingMedicineDetails(false);
    }
  };

  const handleMedicineChange = (field: keyof MedicineRequest, value: MedicineRequest[typeof field]) => {
    setMedicineForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const openCreateMedicine = () => {
    setCreateForm({
      medicineCode: "",
      medicineName: "",
      dosageForm: "",
      category: "",
      requiresPrescription: true,
      isControlled: false,
      isActive: true,
      minDispenseQuantity: 1
    });
    setShowCreateMedicine(true);
  };

  const handleCreateMedicineChange = (field: keyof MedicineRequest, value: MedicineRequest[typeof field]) => {
    setCreateForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleCreateMedicine = async () => {
    if (!createForm) {
      return;
    }

    if (!createForm.medicineCode || !createForm.medicineName) {
      toast({
        title: "Campos obrigatórios",
        description: "Informe código e nome do medicamento.",
        variant: "destructive"
      });
      return;
    }

    if (!createForm.dosageForm || !createForm.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a forma farmacêutica e a categoria.",
        variant: "destructive"
      });
      return;
    }

    setSavingCreate(true);
    try {
      const payload: MedicineRequest = {
        ...createForm,
        minDispenseQuantity: createForm.minDispenseQuantity ?? 1
      };
      const created = await pharmacyService.createMedicine(payload);
      setMedicines((prev) => [created, ...prev]);
      toast({
        title: "Medicamento criado",
        description: "O medicamento foi cadastrado com sucesso."
      });
      setShowCreateMedicine(false);
      setCreateForm(null);
      await loadData();
    } catch (err: any) {
      toast({
        title: "Erro ao criar medicamento",
        description: err?.message || "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSavingCreate(false);
    }
  };

  const handleSaveMedicine = async () => {
    if (!medicineForm || !editingMedicineId) {
      return;
    }
    if (!canManageInventory) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para salvar alterações de medicamentos.",
        variant: "destructive",
      });
      return;
    }

    if (!medicineForm.dosageForm || !medicineForm.category) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione a forma farmacêutica e a categoria.",
        variant: "destructive"
      });
      return;
    }

    setSavingMedicine(true);
    try {
      const updated = await pharmacyService.updateMedicine(editingMedicineId, medicineForm);
      setMedicines((prev) => prev.map((medicine) => (medicine.id === updated.id ? updated : medicine)));
      toast({
        title: "Medicamento atualizado",
        description: "As informações do medicamento foram salvas com sucesso."
      });
      setIsEditOpen(false);
      await loadData();
    } catch (err: any) {
      toast({
        title: "Erro ao atualizar medicamento",
        description: err?.message || "Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSavingMedicine(false);
    }
  };

  const handleAddStock = async () => {
    if (!selectedMedicine || !quantity || !batchNumber || !expirationDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o medicamento, lote, validade e quantidade.",
        variant: "destructive"
      });
      return;
    }

    if (!canManageInventory) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para registrar entrada de estoque.",
        variant: "destructive",
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={openCreateMedicine}
            disabled={!canManageInventory}
            title={!canManageInventory ? "Você não tem permissão para cadastrar medicamentos" : ""}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo medicamento
          </Button>
          <Button
            onClick={() => setShowAddStock(true)}
            disabled={!canManageInventory}
            title={!canManageInventory ? "Você não tem permissão para gerenciar estoque" : ""}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar ao estoque
          </Button>
        </div>
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
                      <TableHead className="text-right">Ações</TableHead>
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditMedicine(stock.medicineId)}
                            disabled={!canManageInventory || (loadingMedicineDetails && editingMedicineId === stock.medicineId)}
                            title={!canManageInventory ? "Sem permissão para editar medicamentos" : ""}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar medicamento</span>
                          </Button>
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
            <Button onClick={handleAddStock} disabled={!canManageInventory}>
              Salvar entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateMedicine} onOpenChange={setShowCreateMedicine}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo medicamento</DialogTitle>
          </DialogHeader>
          {createForm ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Código *</Label>
                  <Input
                    value={createForm.medicineCode}
                    onChange={(event) => handleCreateMedicineChange("medicineCode", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nome *</Label>
                  <Input
                    value={createForm.medicineName}
                    onChange={(event) => handleCreateMedicineChange("medicineName", event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Forma farmacêutica *</Label>
                  <Select
                    value={createForm.dosageForm ?? ""}
                    onValueChange={(value) => handleCreateMedicineChange("dosageForm", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSAGE_FORMS.map((form) => (
                        <SelectItem key={form.value} value={form.value}>
                          {form.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Categoria *</Label>
                  <Select
                    value={createForm.category ?? ""}
                    onValueChange={(value) => handleCreateMedicineChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDICINE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nome genérico</Label>
                  <Input
                    value={createForm.genericName ?? ""}
                    onChange={(event) => handleCreateMedicineChange("genericName", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Concentração</Label>
                  <Input
                    value={createForm.strength ?? ""}
                    onChange={(event) => handleCreateMedicineChange("strength", event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Fabricante</Label>
                  <Input
                    value={createForm.manufacturer ?? ""}
                    onChange={(event) => handleCreateMedicineChange("manufacturer", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Classe terapêutica</Label>
                  <Input
                    value={createForm.therapeuticClass ?? ""}
                    onChange={(event) => handleCreateMedicineChange("therapeuticClass", event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Preço unitário</Label>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.unitPrice ?? ""}
                    onChange={(event) => handleCreateMedicineChange("unitPrice", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nível de reposição</Label>
                  <Input
                    type="number"
                    min={0}
                    value={createForm.reorderLevel ?? ""}
                    onChange={(event) => handleCreateMedicineChange("reorderLevel", Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Requer prescrição</p>
                    <p className="text-xs text-muted-foreground">Exigir receita para dispensação.</p>
                  </div>
                  <Switch
                    checked={createForm.requiresPrescription ?? true}
                    onCheckedChange={(checked) => handleCreateMedicineChange("requiresPrescription", checked)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Medicamento controlado</p>
                    <p className="text-xs text-muted-foreground">Requer ficha de controle especial.</p>
                  </div>
                  <Switch
                    checked={createForm.isControlled ?? false}
                    onCheckedChange={(checked) => handleCreateMedicineChange("isControlled", checked)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Medicamento ativo</p>
                  <p className="text-xs text-muted-foreground">Disponível para prescrição e estoque.</p>
                </div>
                <Switch
                  checked={createForm.isActive ?? true}
                  onCheckedChange={(checked) => handleCreateMedicineChange("isActive", checked)}
                />
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={createForm.description ?? ""}
                  onChange={(event) => handleCreateMedicineChange("description", event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Preparando formulário...
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateMedicine(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMedicine} disabled={savingCreate || !createForm}>
              {savingCreate && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar medicamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar medicamento</DialogTitle>
          </DialogHeader>
          {medicineForm ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Código</Label>
                  <Input value={medicineForm.medicineCode} disabled />
                </div>
                <div className="space-y-1">
                  <Label>Nome</Label>
                  <Input
                    value={medicineForm.medicineName}
                    onChange={(event) => handleMedicineChange("medicineName", event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Nome genérico</Label>
                  <Input
                    value={medicineForm.genericName ?? ""}
                    onChange={(event) => handleMedicineChange("genericName", event.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Fabricante</Label>
                  <Input
                    value={medicineForm.manufacturer ?? ""}
                    onChange={(event) => handleMedicineChange("manufacturer", event.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Forma farmacêutica</Label>
                  <Select
                    value={medicineForm.dosageForm ?? ""}
                    onValueChange={(value) => handleMedicineChange("dosageForm", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOSAGE_FORMS.map((form) => (
                        <SelectItem key={form.value} value={form.value}>
                          {form.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Categoria</Label>
                  <Select
                    value={medicineForm.category ?? ""}
                    onValueChange={(value) => handleMedicineChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDICINE_CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Classe terapêutica</Label>
                <Input
                  value={medicineForm.therapeuticClass ?? ""}
                  onChange={(event) => handleMedicineChange("therapeuticClass", event.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Preço unitário</Label>
                  <Input
                    type="number"
                    min={0}
                    value={medicineForm.unitPrice ?? ""}
                    onChange={(event) => handleMedicineChange("unitPrice", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nível de reposição</Label>
                  <Input
                    type="number"
                    min={0}
                    value={medicineForm.reorderLevel ?? ""}
                    onChange={(event) => handleMedicineChange("reorderLevel", Number(event.target.value))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Requer prescrição</p>
                    <p className="text-xs text-muted-foreground">
                      Exigir receita para dispensação.
                    </p>
                  </div>
                  <Switch
                    checked={medicineForm.requiresPrescription ?? true}
                    onCheckedChange={(checked) => handleMedicineChange("requiresPrescription", checked)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">Medicamento controlado</p>
                    <p className="text-xs text-muted-foreground">
                      Requer ficha de controle especial.
                    </p>
                  </div>
                  <Switch
                    checked={medicineForm.isControlled ?? false}
                    onCheckedChange={(checked) => handleMedicineChange("isControlled", checked)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">Medicamento ativo</p>
                  <p className="text-xs text-muted-foreground">
                    Controla a disponibilidade na listagem.
                  </p>
                </div>
                <Switch
                  checked={medicineForm.isActive ?? true}
                  onCheckedChange={(checked) => handleMedicineChange("isActive", checked)}
                />
              </div>
              <div className="space-y-1">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={medicineForm.description ?? ""}
                  onChange={(event) => handleMedicineChange("description", event.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              Selecionando medicamento...
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveMedicine}
              disabled={savingMedicine || !medicineForm || !canManageInventory}
            >
              {savingMedicine && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
