# ANÁLISE DETALHADA COM EXEMPLOS E CAMINHOS

## PARTE 1: ESTRUTURA DETALHADA DE ARQUIVOS

### Árvore de Componentes

**Diretório: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/components/**

```
components/
├── admin/
│   └── UserRoleManagement.tsx               # Gestão de roles de usuários
│
├── admissions/
│   ├── AdmissionStats.tsx                   # Estatísticas de admissão
│   ├── AdmissionTable.tsx                   # Tabela de admissões com props: admissions: any[]
│   └── DischargeForm.tsx                    # Formulário de alta (PROBLEMA: admission: any)
│
├── attendance/
│   └── NewAttendanceDialog.tsx              # Dialog para novo atendimento
│
├── common/
│   └── PlaceholderPage.tsx                  # Componente placeholder genérico
│
├── forms/
│   ├── AdmissionForm.tsx (12.4KB)          # Formulário admissão (PROBLEMA: wards: any[], beds: any[])
│   ├── AppointmentForm.tsx (8.4KB)         # Formulário agendamento
│   ├── PatientForm.tsx (9.6KB)             # Formulário anterior de pacientes
│   ├── PatientFormNew.tsx (24KB)           # NOVO Formulário pacientes (React Hook Form + Zod)
│   └── StaffForm.tsx (7.6KB)               # Formulário cadastro staff
│
├── layout/
│   ├── AppHeader.tsx                        # Cabeçalho com perfil/logout
│   ├── AppLayout.tsx                        # Layout principal (sidebar + outlet)
│   └── AppSidebar.tsx                       # Navegação 14 itens
│
├── patients/
│   ├── DuplicatePatientAlert.tsx            # Alerta duplicatas
│   ├── PatientDetails.tsx                   # Visualização detalhada
│   ├── PatientFilters.tsx                   # Filtros (nome, status, gênero, data)
│   ├── PatientIdentification.tsx            # Identificação com QR code
│   ├── PatientsEmptyState.tsx               # Estado vazio
│   ├── PatientStats.tsx                     # Card estatísticas
│   ├── PatientTable.tsx                     # Tabela 50+ linhas
│   └── patientUtils.ts                      # Funções: getInitials, calculateAge, labels
│
├── reception/
│   └── PatientRegistrationForm.tsx          # (PROBLEMA: duplicates?: any[])
│
├── triage/
│   ├── TriageBoard.tsx                      # Painel Manchester 5 colunas
│   ├── TriageForm.tsx                       # Formulário sinais vitais
│   └── TriageQueue.tsx                      # Fila pacientes aguardando
│
└── ui/ (45 componentes base)
    ├── accordion.tsx, alert-dialog.tsx, alert.tsx
    ├── avatar.tsx, badge.tsx, breadcrumb.tsx
    ├── button.tsx, calendar.tsx, card.tsx, carousel.tsx
    ├── chart.tsx, checkbox.tsx, collapsible.tsx, command.tsx
    ├── context-menu.tsx, dialog.tsx, drawer.tsx, dropdown-menu.tsx
    ├── form.tsx, hover-card.tsx, input-otp.tsx, input.tsx
    ├── label.tsx, masked-input.tsx, menubar.tsx
    ├── navigation-menu.tsx, pagination.tsx, popover.tsx
    ├── progress.tsx, radio-group.tsx, resizable.tsx
    ├── scroll-area.tsx, select.tsx, separator.tsx, sheet.tsx
    ├── sidebar.tsx, skeleton.tsx, slider.tsx, sonner.tsx
    ├── switch.tsx, table.tsx, tabs.tsx, textarea.tsx
    ├── toast.tsx, toggle-group.tsx, toggle.tsx, tooltip.tsx
    └── use-toast.ts                         # Hook de notificações
```

### Diretório Pages

**Localização: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/pages/**

```
pages/
├── Admissions.tsx (573 bytes)               # Placeholder
├── Appointments.tsx (594 bytes)             # Placeholder
├── Auth.tsx (10KB)                          # Login/Register com Zod
├── Billing.tsx (541 bytes)                  # Placeholder
├── Consultations.tsx (551 bytes)            # Placeholder
├── Dashboard.tsx (4.4KB)                    # PROBLEMA: TODO, dados mockados
├── Hospital.tsx (584 bytes)                 # Placeholder
├── Index.tsx (469 bytes)                    # Redirecionador
├── Laboratory.tsx (545 bytes)               # Placeholder
├── MedicalRecords.tsx (585 bytes)           # Placeholder
├── NotFound.tsx (739 bytes)                 # 404 page
├── Patients.tsx (12KB)                      # PRINCIPAL - Recepção com muitos 'any'
├── Pharmacy.tsx (548 bytes)                 # Placeholder
├── Reports.tsx (543 bytes)                  # Placeholder
├── Staff.tsx (564 bytes)                    # Placeholder
├── Triage.tsx (10.5KB)                      # PRINCIPAL - Triagem Manchester
└── UserManagement.tsx (535 bytes)           # Placeholder
```

### Diretório Services

**Localização: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/**

```
services/
├── attendanceService.ts (94 linhas)         # Classe com 6 métodos CRUD
├── authService.ts (74 linhas)               # 4 endpoints auth
├── patientService.ts (180 linhas)           # 9 endpoints patients
├── sectorService.ts (12 linhas)             # Simples: GET /sectors
└── triageService.ts (80 linhas)             # 3 endpoints triage
```

### Diretório Types

**Localização: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/types/**

```
types/
├── patient.ts (255 linhas)                  # 4 enums + 5 interfaces
├── sector.ts (6 linhas)                     # 1 interface simples
└── triage.ts (211 linhas)                   # 2 types + 6 interfaces + helpers
```

### Diretório Schemas

**Localização: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/schemas/**

```
schemas/
└── patientSchema.ts (274 linhas)            # Zod schema completo com defaults
```

### Diretório Hooks

**Localização: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/hooks/**

```
hooks/
├── useAuth.ts (130 linhas)                  # useState + localStorage
├── usePatientsSpring.ts (157 linhas)        # CRUD com patientService
├── use-mobile.tsx (?)                       # Detectar mobile
└── use-toast.ts (?)                         # Wrapper de notificações
```

### Diretório Utils

**Localização: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/utils/**

```
utils/
└── validators.ts (226 linhas)               # 6 validadores + 4 formatadores
```

### Diretório Lib

**Localização: /home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/lib/**

```
lib/
├── api.ts (81 linhas)                       # Axios + interceptors
└── utils.ts (6 linhas)                      # Função cn() para Tailwind
```

---

## PARTE 2: EXEMPLOS DE CÓDIGO PROBLEMÁTICO

### Problema 1: Uso Excessivo de 'any'

**Arquivo:** `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/components/forms/PatientFormNew.tsx:32`

```typescript
// PROBLEMA
interface PatientFormProps {
  onSubmit: (data: any) => Promise<void>;  // ❌ any
  loading?: boolean;
  initialData?: Partial<Patient>;
}

// SOLUÇÃO
import { PatientFormData } from "@/schemas/patientSchema";

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => Promise<void>;  // ✅ tipado
  loading?: boolean;
  initialData?: Partial<Patient>;
}
```

**Arquivo:** `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/components/admissions/AdmissionTable.tsx:11`

```typescript
// PROBLEMA
interface AdmissionTableProps {
  admissions: any[];                         // ❌ any
  onDischarge: (admissionId: string, dischargeData: any) => Promise<void>;  // ❌ any
}

// SOLUÇÃO
import { Attendance } from "@/services/attendanceService";

interface AdmissionTableProps {
  admissions: Attendance[];                  // ✅ tipado
  onDischarge: (admissionId: string, dischargeData: Partial<Attendance>) => Promise<void>;  // ✅ tipado
}
```

### Problema 2: console.log/error em Produção

**Arquivo:** `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/pages/Triage.tsx:56`

```typescript
// PROBLEMA
const loadTriageBoard = useCallback(async () => {
  setIsRefreshing(true);
  try {
    setError(null);
    const data = await triageService.getTriageBoard();
    setPatients(data);
  } catch (err: any) {
    console.error('Error loading triage board:', err);  // ❌ console em produção
    setError(err.message || 'Erro ao carregar painel de triagem');
  }
}, []);

// SOLUÇÃO
const loadTriageBoard = useCallback(async () => {
  setIsRefreshing(true);
  try {
    setError(null);
    const data = await triageService.getTriageBoard();
    setPatients(data);
  } catch (err: any) {
    // ✅ Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading triage board:', err);
    }
    setError(err.message || 'Erro ao carregar painel de triagem');
  }
}, []);
```

**Arquivo:** `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/hooks/usePatientsSpring.ts:43`

```typescript
// PROBLEMA
catch (error: any) {
  console.error('Error fetching patients:', error);  // ❌ console
  toast({
    title: "Erro ao carregar pacientes",
    description: error.response?.data?.message || error.message,
    variant: "destructive",
  });
  setPatients([]);
}

// SOLUÇÃO
catch (error: any) {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error fetching patients:', error);  // ✅ apenas dev
  }
  toast({
    title: "Erro ao carregar pacientes",
    description: error.response?.data?.message || error.message,
    variant: "destructive",
  });
  setPatients([]);
}
```

### Problema 3: Dashboard não Funcional

**Arquivo:** `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/pages/Dashboard.tsx:15`

```typescript
// PROBLEMA
export default function Dashboard() {
  // TODO: Integrar com backend quando endpoints estiverem prontos  // ❌ TODO
  const stats = {
    activePatients: 0,                    // ❌ mockado
    todayAppointments: 0,                 // ❌ mockado
    availableBeds: 0,                     // ❌ mockado
    ongoingConsultations: 0,              // ❌ mockado
  };

  // Renderiza estatísticas com valores 0
  return (
    <div className="p-6 space-y-6">
      {/* ... cards renderizando 0 */}
    </div>
  );
}

// SOLUÇÃO
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  activePatients: number;
  todayAppointments: number;
  availableBeds: number;
  ongoingConsultations: number;
}

export default function Dashboard() {
  const { data: stats = {
    activePatients: 0,
    todayAppointments: 0,
    availableBeds: 0,
    ongoingConsultations: 0,
  }, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardService.getStats(),  // ✅ endpoint real
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div className="p-6 space-y-6">
      {/* ... renderiza dados reais */}
    </div>
  );
}
```

### Problema 4: TypeScript Muito Permissivo

**Arquivo:** `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/tsconfig.json`

```json
// PROBLEMA
{
  "compilerOptions": {
    "noImplicitAny": false,         // ❌ Permite 'any' implícito
    "strictNullChecks": false,      // ❌ Permite null/undefined
    "noUnusedLocals": false,        // ❌ Permite variáveis não usadas
    "noUnusedParameters": false     // ❌ Permite parâmetros não usados
  }
}

// SOLUÇÃO
{
  "compilerOptions": {
    "strict": true,                 // ✅ Ativa todas as checks estritas
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitThis": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## PARTE 3: CAMINHOS COMPLETOS DE ARQUIVOS

### Services Completos

**authService:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/authService.ts`
- Endpoints: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout

**patientService:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/patientService.ts`
- Endpoints: GET/POST/PUT/DELETE /patients, GET /patients/search/duplicates, POST/GET /patients/{id}/identification

**triageService:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/triageService.ts`
- Endpoints: POST /triage/visits/{id}, GET /triage/board, PUT /triage/visits/{id}/sector

**attendanceService:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/attendanceService.ts`
- Endpoints: POST/GET/PATCH /attendances, GET /attendances?patientId/status

**sectorService:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/sectorService.ts`
- Endpoints: GET /sectors

### Tipos Completos

**Patient Types:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/types/patient.ts`
- Enums: Gender, RaceColor, MaritalStatus, EducationLevel, PatientStatus
- Interfaces: Patient, PatientCreateRequest, PatientUpdateRequest, PatientSearchParams, PatientIdentification

**Triage Types:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/types/triage.ts`
- Types: ManchesterColor, VisitStatus
- Interfaces: VitalSigns, TriageRegisterRequest, TriageBoardItem, SectorAssignRequest, ManchesterColorInfo
- Constants: MANCHESTER_COLORS (mapping colors to UI info)
- Helpers: getManchesterColorInfo, isWaitingTimeExceeded, formatWaitingTime, validateVitalSigns

**Sector Types:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/types/sector.ts`
- Interface: Sector { id, name, type }

### Schemas

**Patient Schema:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/schemas/patientSchema.ts`
- Validadores: CPF, CNS, CEP, Phone, Email, DateOfBirth
- Campos: 23 campos com validações customizadas
- Regra crítica: CPF OR CNS obrigatório

### Hooks

**useAuth Hook:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/hooks/useAuth.ts`
- State: user, loading
- Methods: signIn, signUp, signOut
- Storage: localStorage (accessToken, refreshToken, user)

**usePatientsSpring Hook:**
- Arquivo: `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/hooks/usePatientsSpring.ts`
- State: patients[], loading, totalCount, currentPage, totalPages
- Methods: addPatient, updatePatient, deletePatient, searchPatients, filterByStatus, fetchPatients

---

## PARTE 4: DEPENDÊNCIAS PRINCIPAIS

### Production Dependencies

```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "react-hook-form": "^7.53.0",
  "@hookform/resolvers": "^3.9.0",
  "zod": "^3.23.8",
  
  // UI Components
  "@radix-ui/*": "^1.x.x",                    // 20 packages
  "tailwindcss": "^3.4.11",
  "tailwindcss-animate": "^1.0.7",
  "class-variance-authority": "^0.7.1",
  
  // API & State
  "axios": "^1.12.2",
  "@tanstack/react-query": "^5.56.2",
  
  // Utilities
  "date-fns": "^3.6.0",
  "lucide-react": "^0.462.0",
  "recharts": "^2.12.7",
  "qrcode.react": "^4.2.0",
  "sonner": "^1.5.0",
  "next-themes": "^0.3.0"
}
```

### Dev Dependencies

```json
{
  "typescript": "^5.5.3",
  "vite": "^5.4.1",
  "@vitejs/plugin-react-swc": "^3.5.0",
  
  "eslint": "^9.9.0",
  "@eslint/js": "^9.9.0",
  "typescript-eslint": "^8.0.1",
  "eslint-plugin-react-hooks": "^5.1.0-rc.0",
  "eslint-plugin-react-refresh": "^0.4.9",
  
  "tailwindcss": "^3.4.11",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.4.47"
}
```

---

## PARTE 5: FLUXOS DE DADOS PRINCIPAIS

### Fluxo de Autenticação

```
User submits login form (Auth.tsx)
  ↓
useAuth.signIn() hook called
  ↓
authService.login() → POST /auth/login
  ↓
Backend returns { accessToken, refreshToken, user }
  ↓
tokens + user stored in localStorage
  ↓
ProtectedRoute allows navigation
  ↓
api.interceptors.request adds Bearer token to all requests
```

### Fluxo de Cadastro de Pacientes

```
PatientForm component
  ↓
React Hook Form + Zod validation
  ↓
patientService.checkDuplicates() → GET /patients/search/duplicates
  ↓
If duplicates found → DuplicatePatientAlert shown
  ↓
User confirms/ignores
  ↓
patientService.create() → POST /patients
  ↓
usePatientsSpring hook updates state
  ↓
toast notification
  ↓
PatientTable re-renders with new patient
```

### Fluxo de Triagem (Manchester)

```
Triage.tsx page loads
  ↓
TriageQueue component
  - Shows patients awaiting triage
  - triageService.getTriageBoard()
  
TriageBoard component
  - Shows 5 color columns
  - Auto-refresh every 30s
  - Group patients by color

When "Iniciar Triagem" clicked
  ↓
TriageForm opens (modal)
  ↓
User enters vital signs (PA, FC, Glasgow)
  ↓
Frontend validates via validateVitalSigns()
  ↓
User selects Manchester color + justification
  ↓
triageService.registerTriage() → POST /triage/visits/{visitId}
  ↓
Backend processes + assigns color
  ↓
TriageBoard refreshes showing new color
  ↓
Optional: User assigns sector
     → triageService.assignSector() → PUT /triage/visits/{visitId}/sector
```

---

## PARTE 6: LISTA DE PROBLEMAS POR ARQUIVO

### Arquivo: pages/Patients.tsx (11.9KB)

- Linha 81: `console.error('Error adding patient:', error);`
- Linha 76: `const handleAddPatient = async (data: any) => {` (PROBLEMA: any)
- Linha 95: `const handleUpdatePatient = async (data: any) => {` (PROBLEMA: any)
- Linha 121: `const handleCreateAttendance = async (data: any) => {` (PROBLEMA: any)
- Linha 150+: Múltiplas ocorrências de `error: any` em catch blocks

### Arquivo: pages/Triage.tsx (10.5KB)

- Linha 56: `console.error('Error loading triage board:', err);`
- Linha 75: `console.error('Error loading sectors:', err);`
- Múltiplos `catch (err: any)` sem type

### Arquivo: pages/Dashboard.tsx (4.4KB)

- Linha 15: `// TODO: Integrar com backend quando endpoints estiverem prontos`
- Stats mockados com valores 0

### Arquivo: components/forms/PatientFormNew.tsx (24KB)

- Linha 32: `onSubmit: (data: any) => Promise<void>;`
- Linha 89: `console.error('Erro ao verificar duplicatas:', error);`

### Arquivo: components/forms/AdmissionForm.tsx (12.4KB)

- `wards: any[];` (PROBLEMA)
- `beds: any[];` (PROBLEMA)

### Arquivo: components/admissions/AdmissionTable.tsx

- Linha 11: `admissions: any[];` (PROBLEMA)
- `onDischarge: (admissionId: string, dischargeData: any)`

### Arquivo: components/admissions/DischargeForm.tsx

- `admission: any;` (PROBLEMA)

### Arquivo: hooks/usePatientsSpring.ts (157 linhas)

- Linha 43: `console.error('Error fetching patients:', error);`
- Linha 69: `console.error('Error adding patient:', error);`
- Linha 93: `console.error('Error updating patient:', error);`
- Linha 115: `console.error('Error deleting patient:', error);`

### Arquivo: services/triageService.ts

- Linha 54: `console.error('Erro ao carregar painel de triagem:', error);`

### Arquivo: components/reception/PatientRegistrationForm.tsx

- `duplicates?: any[];` (PROBLEMA)

---

## RESUMO DE CAMINHOS ABSOLUTAS

**Arquivo Principal:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/ANALISE_FRONTEND.md`

**Configuração:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/package.json`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/tsconfig.json`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/vite.config.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/tailwind.config.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/.env`

**Entrada:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/main.tsx`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/App.tsx`

**Componentes Críticos:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/components/forms/PatientFormNew.tsx`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/pages/Triage.tsx`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/pages/Patients.tsx`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/pages/Dashboard.tsx`

**Services:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/authService.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/patientService.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/triageService.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/services/attendanceService.ts`

**Types:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/types/patient.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/types/triage.ts`

**Validação:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/schemas/patientSchema.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/utils/validators.ts`

**Hooks:**
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/hooks/useAuth.ts`
- `/home/wallace/Projetcs/Projeto Pr Lucas/frontend/src/hooks/usePatientsSpring.ts`

