import { usePatientsSpring } from "@/hooks/usePatientsSpring";
import { Gender, PatientStatus, type PatientCreateRequest, type PatientUpdateRequest } from "@/types/patient";

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  cpf?: string;
  cns?: string;
  rg?: string;
  phone?: string;
  email?: string;
  address?: string;
  addressNumber?: string;
  addressComplement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
  status?: PatientStatus;
  motherName?: string;
  fatherName?: string;
  birthCity?: string;
  birthState?: string;
  birthCountry?: string;
  raceColor?: string;
  maritalStatus?: string;
  educationLevel?: string;
  occupation?: string;
  occupationCboCode?: string;
}

const mapGender = (value?: string): Gender => {
  if (value === Gender.MALE || value === Gender.FEMALE || value === Gender.OTHER || value === Gender.UNKNOWN) {
    return value;
  }
  if (value === "M" || value === "F" || value === "O") {
    return value as Gender;
  }
  if (value === "Other") {
    return Gender.OTHER;
  }
  return Gender.UNKNOWN;
};

const normalizeDigits = (value?: string) => {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, '');
  return digits.length > 0 ? digits : undefined;
};

const toCreatePayload = (data: PatientFormData): PatientCreateRequest & { status?: PatientStatus } => {
  const payload: PatientCreateRequest & { status?: PatientStatus } = {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: mapGender(data.gender),
    cpf: normalizeDigits(data.cpf),
    cns: normalizeDigits(data.cns) ?? data.cns,
    rg: data.rg,
    phone: normalizeDigits(data.phone) ?? data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: normalizeDigits(data.zipCode) ?? data.zipCode,
    addressNumber: data.addressNumber,
    addressComplement: data.addressComplement,
    neighborhood: data.neighborhood,
    bloodType: data.bloodType,
    allergies: data.allergies,
    medicalHistory: data.medicalHistory,
    motherName: data.motherName,
    fatherName: data.fatherName,
    birthCity: data.birthCity,
    birthState: data.birthState,
    birthCountry: data.birthCountry,
    raceColor: data.raceColor,
    maritalStatus: data.maritalStatus,
    educationLevel: data.educationLevel,
    occupation: data.occupation,
    occupationCboCode: data.occupationCboCode,
  };

  if (data.status) {
    payload.status = data.status;
  }

  return payload;
};

const toUpdatePayload = (data: PatientFormData): PatientUpdateRequest & { status?: PatientStatus } => {
  const payload: PatientUpdateRequest & { status?: PatientStatus } = {
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    gender: mapGender(data.gender),
    cpf: normalizeDigits(data.cpf),
    cns: normalizeDigits(data.cns) ?? data.cns,
    rg: data.rg,
    phone: normalizeDigits(data.phone) ?? data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    zipCode: normalizeDigits(data.zipCode) ?? data.zipCode,
    addressNumber: data.addressNumber,
    addressComplement: data.addressComplement,
    neighborhood: data.neighborhood,
    bloodType: data.bloodType,
    allergies: data.allergies,
    medicalHistory: data.medicalHistory,
    motherName: data.motherName,
    fatherName: data.fatherName,
    birthCity: data.birthCity,
    birthState: data.birthState,
    birthCountry: data.birthCountry,
    raceColor: data.raceColor,
    maritalStatus: data.maritalStatus,
    educationLevel: data.educationLevel,
    occupation: data.occupation,
    occupationCboCode: data.occupationCboCode,
  };

  if (data.status) {
    payload.status = data.status;
  }

  return payload;
};

export function usePatients() {
  const { patients, loading, addPatient, updatePatient, deletePatient, refetch } = usePatientsSpring();

  const handleAddPatient = (data: PatientFormData) => addPatient(toCreatePayload(data));
  const handleUpdatePatient = (id: string, data: PatientFormData) => updatePatient(id, toUpdatePayload(data));

  return {
    patients,
    loading,
    addPatient: handleAddPatient,
    updatePatient: handleUpdatePatient,
    deletePatient,
    refetch,
  };
}
