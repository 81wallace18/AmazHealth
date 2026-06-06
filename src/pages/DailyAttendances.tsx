import { useCallback, useEffect, useState } from "react";
import { format, addDays, subDays, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  Phone,
  Search,
  X,
  Printer,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface DailyAttendance {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  visitCode: string;
  chiefComplaint: string;
  status: string;
  visitType: string;
  triageColor: string | null;
  outcome: string | null;
  entryTime: string;
  triageTime: string | null;
  triageStaffName: string | null;
  doctorName: string | null;
  createdByName: string | null;
  waitingTimeMinutes: number | null;
  emergencyBypass: boolean;
  phone: string | null;
}

interface DailySummary {
  total: number;
  awaiting: number;
  inProgress: number;
  completed: number;
  attendances: DailyAttendance[];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  CREATED: { label: "Aguardando triagem", bg: "bg-gray-100", text: "text-gray-700" },
  WAITING_DOCTOR: { label: "Aguardando médico", bg: "bg-yellow-100", text: "text-yellow-800" },
  IN_PROGRESS: { label: "Em atendimento", bg: "bg-blue-100", text: "text-blue-800" },
  WAITING_EXAM: { label: "Aguardando exame", bg: "bg-purple-100", text: "text-purple-800" },
  EXAM_COMPLETED: { label: "Exame concluído", bg: "bg-purple-100", text: "text-purple-800" },
  DISCHARGED: { label: "Atendimento realizado", bg: "bg-green-100", text: "text-green-800" },
  ADMITTED: { label: "Internado", bg: "bg-red-100", text: "text-red-800" },
  TRANSFERRED: { label: "Transferido", bg: "bg-orange-100", text: "text-orange-800" },
  CANCELLED: { label: "Cancelado", bg: "bg-gray-100", text: "text-gray-500" },
};

const TRIAGE_COLORS: Record<string, { bg: string; tone: string; label: string }> = {
  RED: { bg: "bg-red-500", tone: "border-red-200 bg-red-50 text-red-900", label: "Emergência" },
  ORANGE: { bg: "bg-orange-500", tone: "border-orange-200 bg-orange-50 text-orange-900", label: "Muito Urgente" },
  YELLOW: { bg: "bg-yellow-400", tone: "border-yellow-200 bg-yellow-50 text-yellow-900", label: "Urgente" },
  GREEN: { bg: "bg-green-500", tone: "border-green-200 bg-green-50 text-green-900", label: "Pouco Urgente" },
  BLUE: { bg: "bg-blue-500", tone: "border-blue-200 bg-blue-50 text-blue-900", label: "Não Urgente" },
};

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function MiniCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="Mês anterior"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          aria-label="Próximo mês"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="flex h-7 items-center justify-center font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {weeks.flat().map((d) => {
          const selected = isSameDay(d, selectedDate);
          const today = isToday(d);
          const inMonth = isSameMonth(d, viewMonth);
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelect(d)}
              aria-label={format(d, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              aria-pressed={selected}
              className={`flex h-10 min-w-0 items-center justify-center rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                ${selected ? "bg-primary text-primary-foreground font-bold" : ""}
                ${today && !selected ? "border border-primary text-primary font-bold" : ""}
                ${!inMonth ? "text-muted-foreground/40" : ""}
                ${inMonth && !selected ? "hover:bg-muted" : ""}
              `}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-10 w-full text-xs"
        onClick={() => { onSelect(new Date()); setViewMonth(startOfMonth(new Date())); }}
      >
        Hoje
      </Button>
    </div>
  );
}

export default function DailyAttendances() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [data, setData] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const myName = user?.fullName || user?.username || "";

  // Carrega equipe completa
  useEffect(() => {
    api.get<StaffMember[]>("/staff/active-all")
      .then((res) => {
        const names = res.data.map((s) => `${s.firstName} ${s.lastName}`).sort();
        setTeamMembers(names);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const response = await api.get<DailySummary>(`/attendances/daily-summary`, {
        params: { date: dateStr },
      });
      setData(response.data);
    } catch {
      setData({ total: 0, awaiting: 0, inProgress: 0, completed: 0, attendances: [] });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeName = selectedProfessional || "";
  const filtered = activeName
    ? (data?.attendances ?? []).filter((a) => {
        // Se nenhum profissional associado ainda, mostra pra todos
        const hasAnyStaff = a.createdByName || a.triageStaffName || a.doctorName;
        if (!hasAnyStaff) return true;
        return (
          a.createdByName?.toLowerCase().includes(activeName.toLowerCase()) ||
          a.triageStaffName?.toLowerCase().includes(activeName.toLowerCase()) ||
          a.doctorName?.toLowerCase().includes(activeName.toLowerCase())
        );
      })
    : data?.attendances ?? [];

  // Lista de profissionais: equipe da unidade (do endpoint) + usuario logado
  const professionalOptions = teamMembers.includes(myName)
    ? teamMembers
    : [myName, ...teamMembers].filter(Boolean);

  const filteredProfessionals = searchText.length > 0
    ? professionalOptions.filter((name) =>
        name.toLowerCase().includes(searchText.toLowerCase())
      )
    : professionalOptions;

  const dayLabel = format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Coluna esquerda */}
        <div className="w-full flex-shrink-0 space-y-4 lg:w-80">
          <Card>
            <CardContent className="pt-4">
              <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
            </CardContent>
          </Card>

          {data && (
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold">{data.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Aguardando</span>
                  <span className="font-bold">{data.awaiting}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-600">Em atendimento</span>
                  <span className="font-bold">{data.inProgress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-600">Concluídos</span>
                  <span className="font-bold">{data.completed}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna direita */}
        <div className="flex-1 space-y-0">
          {/* Header do dia (setas) */}
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate((d) => subDays(d, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-bold capitalize flex-1">{dayLabel}</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={loadData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Barra de profissional (estilo e-SUS: fundo azul) */}
          <div className="bg-primary text-primary-foreground rounded-t-lg p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60 z-10" />
                <Input
                  placeholder="Busque um profissional pelo nome..."
                  className="pl-10 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50"
                  value={dropdownOpen ? searchText : (selectedProfessional || "")}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onClick={() => {
                    setSearchText("");
                    setDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setSearchText("");
                    setDropdownOpen(true);
                  }}
                  onBlur={() => {
                    setTimeout(() => setDropdownOpen(false), 200);
                  }}
                />
                {selectedProfessional && (
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-foreground/60 hover:text-primary-foreground z-10"
                    onClick={() => { setSelectedProfessional(""); setSearchText(""); }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                {/* Dropdown de profissionais */}
                {dropdownOpen && filteredProfessionals.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                    {filteredProfessionals.map((name) => (
                      <button
                        key={name}
                        className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-foreground"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setSelectedProfessional(name);
                          setSearchText("");
                          setDropdownOpen(false);
                        }}
                      >
                        <span className="font-medium">{name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
                title="Imprimir agendamentos"
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 text-xs text-primary-foreground/80">
              <span>Profissional: <strong className="text-primary-foreground">{selectedProfessional || "Todos"}</strong></span>
              <span className="text-primary-foreground/40">|</span>
              <span>Equipe: <strong className="text-primary-foreground">UBS Serra Pelada</strong></span>
            </div>
          </div>

          {/* Lista de pacientes */}
          <div className="border border-t-0 rounded-b-lg overflow-hidden">
            {loading ? (
              <p className="text-muted-foreground py-12 text-center">Carregando atendimentos...</p>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                {selectedProfessional
                  ? `Nenhum atendimento de "${selectedProfessional}" neste dia.`
                  : "Nenhum atendimento registrado neste dia."}
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((att) => {
                  const statusCfg = STATUS_CONFIG[att.status] ?? { label: att.status, bg: "bg-gray-100", text: "text-gray-700" };
                  const triageCfg = att.triageColor ? TRIAGE_COLORS[att.triageColor] : null;

                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 border-b p-3 transition-colors hover:bg-muted/30 last:border-b-0"
                    >
                      {/* Info do paciente */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{att.patientName}</span>
                          <span className={`text-sm ${statusCfg.text}`}>| {statusCfg.label}</span>
                          {triageCfg && (
                            <Badge variant="outline" className={`gap-1 text-xs ${triageCfg.tone}`}>
                              <span className={`h-2 w-2 rounded-full ${triageCfg.bg}`} aria-hidden="true" />
                              Prioridade: {triageCfg.label}
                            </Badge>
                          )}
                          {att.emergencyBypass && (
                            <Badge variant="destructive" className="text-xs">EMERGÊNCIA</Badge>
                          )}
                          {att.outcome && (
                            <Badge variant="outline" className="text-xs">{att.outcome}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          {att.phone && (
                            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                              <Phone className="h-3 w-3" />
                              {att.phone}
                            </span>
                          )}
                          {att.chiefComplaint && (
                            <span className="truncate max-w-[250px]">{att.chiefComplaint}</span>
                          )}
                        </div>
                        {(att.triageStaffName || att.doctorName) && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            {att.triageStaffName && <span>Triagem: <strong>{att.triageStaffName}</strong></span>}
                            {att.doctorName && <span>Médico: <strong>{att.doctorName}</strong></span>}
                          </div>
                        )}
                      </div>

                      {/* Hora */}
                      <div className="flex-shrink-0 flex items-center gap-1 text-sm font-mono text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(att.entryTime), "HH:mm")}
                      </div>

                      {/* Acoes (estilo e-SUS: icones circulares) */}
                      <div className="flex-shrink-0 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-muted"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
