export type DemoFixture<T> = {
  label: string;
  data: T;
  notes?: string[];
};

function suffix(runId: string) {
  return runId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase() || "DEMO";
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
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
}> {
  const id = suffix(runId);
  return {
    label: "Paciente ficticio para recepcao",
    data: {
      firstName: `Paciente`,
      lastName: `Demo ${id}`,
      birthDate: "1988-04-12",
      gender: "FEMALE",
      phone: "(94) 98888-0001",
      address: "Rua Exemplo, 100 - Serra Pelada",
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
  heartRate: string;
  respiratoryRate: string;
  temperature: string;
  oxygenSaturation: string;
  painScale: string;
  manchesterColor: string;
  notes: string;
}> {
  const id = suffix(runId);
  return {
    label: "Triagem ficticia para overview",
    data: {
      bloodPressure: "130/85",
      heartRate: "92",
      respiratoryRate: "18",
      temperature: "37.8",
      oxygenSaturation: "97",
      painScale: "5",
      manchesterColor: "YELLOW",
      notes: `Classificacao ficticia para demonstracao ${id}.`,
    },
  };
}

export function getDoctorCareExample(runId: string): DemoFixture<{
  evolution: string;
  conduct: string;
  prescriptionNotes: string;
}> {
  const id = suffix(runId);
  return {
    label: "Atendimento medico ficticio",
    data: {
      evolution: `Paciente demo ${id} avaliado, estavel, orientado e sem sinais de gravidade no momento.`,
      conduct: "Hidratacao oral, analgesia se necessario, retorno se piora ou novos sinais de alarme.",
      prescriptionNotes: "Medicacao de exemplo para demonstracao, revisar antes de prescrever.",
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
