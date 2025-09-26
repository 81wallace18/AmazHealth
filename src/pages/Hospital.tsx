import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BedDouble,
  Users,
  UserPlus,
  UserMinus,
  ArrowUpDown,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Building
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Tipos de dados baseados no OpenHospital
interface Ward {
  id: string;
  code: string;
  description: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maleSlots: number;
  femaleSlots: number;
  isActive: boolean;
}

interface Bed {
  id: string;
  code: string;
  wardCode: string;
  wardDescription: string;
  occupied: boolean;
  patientId?: string;
  patientName?: string;
  admissionDate?: string;
  diagnosis?: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
}

interface Admission {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  wardCode: string;
  wardDescription: string;
  bedCode: string;
  admissionDate: string;
  admissionType: 'emergency' | 'routine' | 'transfer';
  diagnosis: string;
  doctorName: string;
  status: 'active' | 'discharged' | 'transferred';
  expectedDischarge?: string;
}

export default function Hospital() {
  // Dados simulados baseados no OpenHospital
  const [wards] = useState<Ward[]>([
    {
      id: "1",
      code: "MED",
      description: "Medicina Interna",
      totalBeds: 30,
      occupiedBeds: 23,
      availableBeds: 7,
      maleSlots: 15,
      femaleSlots: 15,
      isActive: true
    },
    {
      id: "2", 
      code: "CIR",
      description: "Cirurgia Geral",
      totalBeds: 25,
      occupiedBeds: 18,
      availableBeds: 7,
      maleSlots: 12,
      femaleSlots: 13,
      isActive: true
    },
    {
      id: "3",
      code: "UTI",
      description: "UTI Adulto",
      totalBeds: 12,
      occupiedBeds: 10,
      availableBeds: 2,
      maleSlots: 6,
      femaleSlots: 6,
      isActive: true
    },
    {
      id: "4",
      code: "PED",
      description: "Pediatria",
      totalBeds: 20,
      occupiedBeds: 12,
      availableBeds: 8,
      maleSlots: 10,
      femaleSlots: 10,
      isActive: true
    }
  ]);

  const [beds] = useState<Bed[]>([
    {
      id: "1",
      code: "MED-001",
      wardCode: "MED",
      wardDescription: "Medicina Interna", 
      occupied: true,
      patientId: "P001",
      patientName: "Maria Silva Santos",
      admissionDate: "2024-01-15",
      diagnosis: "Pneumonia",
      status: 'occupied'
    },
    {
      id: "2",
      code: "MED-002",
      wardCode: "MED",
      wardDescription: "Medicina Interna",
      occupied: false,
      status: 'available'
    },
    {
      id: "3",
      code: "UTI-001",
      wardCode: "UTI",
      wardDescription: "UTI Adulto",
      occupied: true,
      patientId: "P002", 
      patientName: "João Carlos Oliveira",
      admissionDate: "2024-01-20",
      diagnosis: "Insuficiência Respiratória",
      status: 'occupied'
    },
    {
      id: "4",
      code: "CIR-001",
      wardCode: "CIR",
      wardDescription: "Cirurgia Geral",
      occupied: false,
      status: 'maintenance'
    }
  ]);

  const [admissions] = useState<Admission[]>([
    {
      id: "ADM001",
      patientId: "P001",
      patientName: "Maria Silva Santos",
      patientAge: 65,
      patientGender: 'F',
      wardCode: "MED",
      wardDescription: "Medicina Interna",
      bedCode: "MED-001",
      admissionDate: "2024-01-15T08:30:00",
      admissionType: 'emergency',
      diagnosis: "Pneumonia adquirida na comunidade",
      doctorName: "Dr. Roberto Silva",
      status: 'active',
      expectedDischarge: "2024-01-25"
    },
    {
      id: "ADM002", 
      patientId: "P002",
      patientName: "João Carlos Oliveira",
      patientAge: 45,
      patientGender: 'M',
      wardCode: "UTI",
      wardDescription: "UTI Adulto",
      bedCode: "UTI-001",
      admissionDate: "2024-01-20T14:15:00",
      admissionType: 'transfer',
      diagnosis: "Insuficiência Respiratória Aguda",
      doctorName: "Dra. Ana Costa",
      status: 'active'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWard, setSelectedWard] = useState<string>("all");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Disponível</Badge>;
      case 'occupied':
        return <Badge variant="destructive">Ocupado</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Manutenção</Badge>;
      case 'reserved':
        return <Badge variant="outline">Reservado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOccupancyRate = (ward: Ward) => {
    return Math.round((ward.occupiedBeds / ward.totalBeds) * 100);
  };

  const getTotalStats = () => {
    const total = wards.reduce((acc, ward) => ({
      totalBeds: acc.totalBeds + ward.totalBeds,
      occupiedBeds: acc.occupiedBeds + ward.occupiedBeds,
      availableBeds: acc.availableBeds + ward.availableBeds
    }), { totalBeds: 0, occupiedBeds: 0, availableBeds: 0 });
    
    return {
      ...total,
      occupancyRate: Math.round((total.occupiedBeds / total.totalBeds) * 100)
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão Hospitalar</h1>
          <p className="text-muted-foreground">Controle de enfermarias, leitos e internações</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Transferir Paciente
          </Button>
          <Button className="bg-gradient-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            Nova Internação
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Leitos
            </CardTitle>
            <BedDouble className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalBeds}</div>
            <p className="text-xs text-muted-foreground">Capacidade total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leitos Ocupados
            </CardTitle>
            <Users className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.occupiedBeds}</div>
            <p className="text-xs text-muted-foreground">Pacientes internados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leitos Disponíveis
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.availableBeds}</div>
            <p className="text-xs text-muted-foreground">Prontos para uso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Ocupação
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">Ocupação geral</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wards">Enfermarias</TabsTrigger>
          <TabsTrigger value="beds">Leitos</TabsTrigger>
          <TabsTrigger value="admissions">Internações</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
        </TabsList>

        {/* Enfermarias Tab */}
        <TabsContent value="wards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wards.map((ward) => (
              <Card key={ward.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{ward.description}</CardTitle>
                    <Badge variant="outline">{ward.code}</Badge>
                  </div>
                  <CardDescription>
                    {getOccupancyRate(ward)}% de ocupação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-medium">{ward.totalBeds} leitos</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ocupados:</span>
                    <span className="font-medium text-destructive">{ward.occupiedBeds}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Disponíveis:</span>
                    <span className="font-medium text-green-600">{ward.availableBeds}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all"
                      style={{ width: `${getOccupancyRate(ward)}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Ver Leitos
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Leitos Tab */}
        <TabsContent value="beds" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Controle de Leitos</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar leito..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedWard} onValueChange={setSelectedWard}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtrar por enfermaria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as enfermarias</SelectItem>
                      {wards.map((ward) => (
                        <SelectItem key={ward.id} value={ward.code}>
                          {ward.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código do Leito</TableHead>
                    <TableHead>Enfermaria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data Internação</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {beds.map((bed) => (
                    <TableRow key={bed.id}>
                      <TableCell className="font-medium">{bed.code}</TableCell>
                      <TableCell>{bed.wardDescription}</TableCell>
                      <TableCell>{getStatusBadge(bed.status)}</TableCell>
                      <TableCell>
                        {bed.patientName || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {bed.admissionDate ? 
                          new Date(bed.admissionDate).toLocaleDateString('pt-BR') : 
                          <span className="text-muted-foreground">-</span>
                        }
                      </TableCell>
                      <TableCell>
                        {bed.diagnosis || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            {bed.occupied && (
                              <>
                                <DropdownMenuItem>Transferir Paciente</DropdownMenuItem>
                                <DropdownMenuItem>Dar Alta</DropdownMenuItem>
                              </>
                            )}
                            {!bed.occupied && (
                              <DropdownMenuItem>Internar Paciente</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Internações Tab */}
        <TabsContent value="admissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Internações Ativas</CardTitle>
              <CardDescription>
                Lista de todos os pacientes internados atualmente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Idade/Sexo</TableHead>
                    <TableHead>Enfermaria</TableHead>
                    <TableHead>Leito</TableHead>
                    <TableHead>Data Internação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admissions.filter(adm => adm.status === 'active').map((admission) => (
                    <TableRow key={admission.id}>
                      <TableCell className="font-medium">{admission.patientName}</TableCell>
                      <TableCell>{admission.patientAge}a / {admission.patientGender}</TableCell>
                      <TableCell>{admission.wardDescription}</TableCell>
                      <TableCell>{admission.bedCode}</TableCell>
                      <TableCell>
                        {new Date(admission.admissionDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          admission.admissionType === 'emergency' ? 'destructive' :
                          admission.admissionType === 'transfer' ? 'default' : 'secondary'
                        }>
                          {admission.admissionType === 'emergency' ? 'Emergência' :
                           admission.admissionType === 'transfer' ? 'Transferência' : 'Rotina'}
                        </Badge>
                      </TableCell>
                      <TableCell>{admission.doctorName}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>Ver Prontuário</DropdownMenuItem>
                            <DropdownMenuItem>Transferir</DropdownMenuItem>
                            <DropdownMenuItem>Dar Alta</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movimentações Tab */}
        <TabsContent value="movements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações do Dia</CardTitle>
              <CardDescription>
                Internações, altas e transferências de hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="p-2 bg-green-100 text-green-600 rounded-full">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Nova internação</p>
                    <p className="text-sm text-muted-foreground">
                      João Carlos Oliveira - UTI Adulto (UTI-001) - 14:15
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-full">
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Transferência</p>
                    <p className="text-sm text-muted-foreground">
                      Ana Santos - Medicina → UTI - 10:30
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                    <UserMinus className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Alta médica</p>
                    <p className="text-sm text-muted-foreground">
                      Carlos Silva - Cirurgia Geral - 08:45
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}