import { useState } from "react";
import { Pill, Plus, Search, Package, AlertTriangle, CheckCircle, Clock, TrendingUp, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Dados simulados de medicamentos
const medications = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    category: "Analgésico",
    manufacturer: "EMS",
    batch: "LOT001",
    expiryDate: "2025-12-31",
    stock: 250,
    minStock: 50,
    location: "Prateleira A1",
    price: 0.45,
    status: "Em estoque",
    lastMovement: "2024-01-10",
    prescription: false
  },
  {
    id: 2,
    name: "Amoxicilina 875mg",
    category: "Antibiótico",
    manufacturer: "Eurofarma",
    batch: "LOT002",
    expiryDate: "2024-06-30",
    stock: 15,
    minStock: 30,
    location: "Prateleira B2",
    price: 2.80,
    status: "Estoque baixo",
    lastMovement: "2024-01-12",
    prescription: true
  },
  {
    id: 3,
    name: "Dipirona 500mg",
    category: "Analgésico",
    manufacturer: "Sanofi",
    batch: "LOT003",
    expiryDate: "2024-03-15",
    stock: 0,
    minStock: 40,
    location: "Prateleira A2",
    price: 0.35,
    status: "Sem estoque",
    lastMovement: "2024-01-08",
    prescription: false
  },
  {
    id: 4,
    name: "Losartana 50mg",
    category: "Anti-hipertensivo",
    manufacturer: "Medley",
    batch: "LOT004",
    expiryDate: "2025-08-20",
    stock: 180,
    minStock: 60,
    location: "Prateleira C1",
    price: 1.25,
    status: "Em estoque",
    lastMovement: "2024-01-11",
    prescription: true
  },
  {
    id: 5,
    name: "Omeprazol 20mg",
    category: "Protetor gástrico",
    manufacturer: "Neo Química",
    batch: "LOT005",
    expiryDate: "2024-02-28",
    stock: 5,
    minStock: 25,
    location: "Prateleira D1",
    price: 0.90,
    status: "Vence em breve",
    lastMovement: "2024-01-13",
    prescription: true
  },
  {
    id: 6,
    name: "Ibuprofeno 600mg",
    category: "Anti-inflamatório",
    manufacturer: "Bayer",
    batch: "LOT006",
    expiryDate: "2025-11-10",
    stock: 95,
    minStock: 35,
    location: "Prateleira A3",
    price: 1.15,
    status: "Em estoque",
    lastMovement: "2024-01-09",
    prescription: false
  }
];

const statusColors = {
  "Em estoque": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "Estoque baixo": "bg-amber-500/10 text-amber-700 border-amber-200",
  "Sem estoque": "bg-red-500/10 text-red-700 border-red-200",
  "Vence em breve": "bg-orange-500/10 text-orange-700 border-orange-200"
};

export default function Pharmacy() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMedications = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         med.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || med.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || med.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: medications.length,
    emEstoque: medications.filter(m => m.status === "Em estoque").length,
    estoqueBaixo: medications.filter(m => m.status === "Estoque baixo").length,
    semEstoque: medications.filter(m => m.status === "Sem estoque").length,
    venceBrev: medications.filter(m => m.status === "Vence em breve").length,
    valorTotal: medications.reduce((sum, med) => sum + (med.stock * med.price), 0)
  };

  const uniqueCategories = [...new Set(medications.map(m => m.category))];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Farmácia</h1>
          <p className="text-muted-foreground">Gestão de medicamentos e estoque</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Medicamento
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medicamentos</CardTitle>
            <Pill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <p className="text-xs text-muted-foreground">medicamentos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Estoque</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.emEstoque}</div>
            <p className="text-xs text-muted-foreground">disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.estoqueBaixo}</div>
            <p className="text-xs text-muted-foreground">precisam reposição</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sem Estoque</CardTitle>
            <Package className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.semEstoque}</div>
            <p className="text-xs text-muted-foreground">indisponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vence em Breve</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.venceBrev}</div>
            <p className="text-xs text-muted-foreground">próximo vencimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.valorTotal)}</div>
            <p className="text-xs text-muted-foreground">em estoque</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por medicamento, fabricante ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Em estoque">Em estoque</SelectItem>
                <SelectItem value="Estoque baixo">Estoque baixo</SelectItem>
                <SelectItem value="Sem estoque">Sem estoque</SelectItem>
                <SelectItem value="Vence em breve">Vence em breve</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Medications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicamento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Fabricante</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Preço Unit.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedications.map((medication) => (
                  <TableRow key={medication.id}>
                    <TableCell>
                      <div>
                        <div className="font-semibold">{medication.name}</div>
                        {medication.prescription && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Receita obrigatória
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{medication.category}</Badge>
                    </TableCell>
                    <TableCell>{medication.manufacturer}</TableCell>
                    <TableCell className="font-mono text-sm">{medication.batch}</TableCell>
                    <TableCell>{formatDate(medication.expiryDate)}</TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-semibold">{medication.stock}</div>
                        <div className="text-xs text-muted-foreground">
                          Min: {medication.minStock}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{medication.location}</TableCell>
                    <TableCell>{formatCurrency(medication.price)}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={statusColors[medication.status as keyof typeof statusColors]}
                      >
                        {medication.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" title="Movimentar estoque">
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Comprar">
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}