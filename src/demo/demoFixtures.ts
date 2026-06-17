import type {
  AdministrationRouteCode,
  DoseType,
  MedicationType,
} from "@/types/prescription";

export type DemoFixture<T> = {
  label: string;
  data: T;
  notes?: string[];
};

function suffix(runId: string) {
  return runId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "DEMO";
}

function numericSeed(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10000000000000;
  }
  return hash.toString().padStart(13, "0").slice(-13);
}

function validProvisionalCns(runId: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const base = `7${numericSeed(`${runId}-${attempt}`)}`;
    const sum = base
      .split("")
      .reduce((total, digit, index) => total + Number(digit) * (15 - index), 0);
    const checkDigit = (11 - (sum % 11)) % 11;
    if (checkDigit < 10) {
      return `${base}${checkDigit}`;
    }
  }

  return "700000000000008";
}

function nextBusinessDateTimeLocal() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 30, 0, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getReceptionPatientExample(runId: string): DemoFixture<{
  fullName: string;
  dateOfBirth: string;
  gender: "M" | "F" | "O" | "UNKNOWN";
  motherName: string;
  cns: string;
  phone: string;
  address: string;
  birthCity: string;
  maritalStatus: "solteiro" | "casado" | "viuvo" | "divorciado" | "separado_judicialmente" | "ignorado";
  raceColor: "branca" | "preta" | "parda" | "amarela" | "indigena" | "ignorado";
  educationLevel: "nenhuma" | "fundamental_incompleto" | "fundamental_completo" | "medio_incompleto" | "medio_completo" | "superior_incompleto" | "superior_completo" | "ignorado";
  allergies: string;
}> {
  const id = suffix(runId);
  return {
    label: "Paciente ficticio para recepcao",
    data: {
      fullName: `Paciente Demo ${id}`,
      dateOfBirth: "1988-04-12",
      gender: "F",
      motherName: `Maria Demo ${id}`,
      cns: validProvisionalCns(runId),
      phone: "(94) 98888-0001",
      address: "Rua Exemplo, 100 - Serra Pelada",
      birthCity: "Curionopolis",
      maritalStatus: "solteiro",
      raceColor: "parda",
      educationLevel: "medio_completo",
      allergies: "Sem alergias conhecidas no exemplo.",
    },
  };
}

export function getReceptionAttendanceExample(runId: string): DemoFixture<{
  chiefComplaint: string;
  visitType: string;
  notes: string;
}> {
  const id = suffix(runId);
  return {
    label: "Abertura de atendimento ficticia",
    data: {
      chiefComplaint: `Dor abdominal e nausea - demo ${id}`,
      visitType: "URGENCIA",
      notes: "Entrada ficticia para overview. Revisar antes de abrir atendimento.",
    },
  };
}

export function getTriageExample(runId: string): DemoFixture<{
  bloodPressure: string;
  bloodPressureSys: string;
  bloodPressureDia: string;
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  bloodGlucose: string;
  weight: string;
  height: string;
  glasgow: string;
  complaintCategory: "CHEST_PAIN" | "DYSPNEA" | "FEVER" | "TRAUMA" | "NEURO" | "ABDOMINAL" | "OTHER";
  complaintText: string;
  painScale: string;
  manchesterColor: "BLUE" | "GREEN" | "YELLOW" | "ORANGE" | "RED";
  notes: string;
  overrideReason: string;
}> {
  const id = suffix(runId);
  return {
    label: "Triagem ficticia para overview",
    data: {
      bloodPressure: "130/85",
      bloodPressureSys: "130",
      bloodPressureDia: "85",
      heartRate: "92",
      respiratoryRate: "18",
      temperature: "37.8",
      oxygenSaturation: "97",
      bloodGlucose: "104",
      weight: "68",
      height: "165",
      glasgow: "15",
      complaintCategory: "ABDOMINAL",
      complaintText: "Dor abdominal moderada e nausea desde ontem.",
      painScale: "5",
      manchesterColor: "YELLOW",
      notes: `Classificacao ficticia para demonstracao ${id}.`,
      overrideReason: "Classificacao mantida para demonstracao narrada.",
    },
  };
}

export function getDoctorCareExample(runId: string): DemoFixture<{
  chiefComplaint: string;
  historyOfPresentIllness: string;
  physicalExamination: string;
  diagnosis: string;
  evolution: string;
  conduct: string;
  prescriptionNotes: string;
}> {
  const id = suffix(runId);
  return {
    label: "Atendimento medico ficticio",
    data: {
      chiefComplaint: "Dor abdominal e nausea.",
      historyOfPresentIllness: "Paciente relata dor abdominal moderada iniciada ontem, sem vomitos persistentes e sem sinais de alarme no momento.",
      physicalExamination: "Paciente em bom estado geral, hidratado, afebril, abdome flacido com dor leve a palpacao difusa.",
      diagnosis: "Dor abdominal inespecifica em observacao.",
      evolution: `Paciente demo ${id} avaliado, estavel, orientado e sem sinais de gravidade no momento.`,
      conduct: "Hidratacao oral, analgesia se necessario, retorno se piora ou novos sinais de alarme.",
      prescriptionNotes: "Medicacao de exemplo para demonstracao, revisar antes de prescrever.",
    },
  };
}

export function getPrescriptionExample(runId: string): DemoFixture<{
  notes: string;
  items: {
    medicineId: string;
    medicineName: string;
    medicineDescription: string;
    medicationType: MedicationType;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    route: string;
    administrationRouteCode: AdministrationRouteCode;
    doseType: DoseType;
    instructions: string;
  }[];
}> {
  const id = suffix(runId);
  return {
    label: "Prescrição médica ficticia",
    data: {
      notes: `Prescrição de exemplo para fluxo de atendimento ${id}. Revisar antes de usar.`,
      items: [
        {
          medicineId: "",
          medicineName: "Dipirona 500mg",
          medicineDescription: "Analgésico e antipirético",
          medicationType: "COMMON",
          dosage: "1 comprimido",
          frequency: "8/8 horas",
          duration: "3 dias",
          quantity: 9,
          route: "VO",
          administrationRouteCode: "ORAL",
          doseType: "COMMON",
          instructions: "Tomar após as refeições. Retornar em caso de piora.",
        },
      ],
    },
  };
}

export function getPharmacyExample(runId: string): DemoFixture<{
  notes: string;
  dispensationQuantity: string;
}> {
  const id = suffix(runId);
  return {
    label: "Farmacia ficticia para overview",
    data: {
      notes: `Dispensacao ficticia para demonstracao ${id}. Conferir prescricao antes de confirmar.`,
      dispensationQuantity: "1",
    },
  };
}

export function getAdminAppointmentExample(runId: string): DemoFixture<{
  type: string;
  scheduledDate: string;
  durationMinutes: string;
  reason: string;
  notes: string;
}> {
  const id = suffix(runId);
  return {
    label: "Agendamento administrativo de exemplo",
    data: {
      type: "Consulta",
      scheduledDate: nextBusinessDateTimeLocal(),
      durationMinutes: "30",
      reason: `Consulta de acompanhamento - demo ${id}`,
      notes: "Exemplo ficticio para overview narrado. Conferir paciente e medico antes de agendar.",
    },
    notes: [
      "Nao salva automaticamente.",
      "Paciente e medico sao selecionados a partir das listas carregadas da tela.",
    ],
  };
}

export function getAdminExample(runId: string): DemoFixture<{
  fullName: string;
  email: string;
  cpf: string;
  role: "receptionist" | "nurse" | "nurse_technician" | "doctor" | "pharmacist" | "hospital_manager";
}> {
  const id = suffix(runId).toLowerCase();
  return {
    label: "Usuario administrativo de exemplo",
    data: {
      fullName: `Profissional Demo ${id.toUpperCase()}`,
      email: `profissional.demo.${id}@example.test`,
      cpf: "",
      role: "receptionist",
    },
    notes: ["CPF fica vazio para evitar documento real em video."],
  };
}

export const getAdminUserExample = getAdminExample;
