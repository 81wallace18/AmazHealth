export const statusColors = {
  "active": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  "inactive": "bg-red-500/10 text-red-700 border-red-200",
  "deceased": "bg-gray-500/10 text-gray-700 border-gray-200"
};

export const statusLabels = {
  "active": "Ativo",
  "inactive": "Inativo", 
  "deceased": "Falecido"
};

export const genderLabels = {
  "M": "Masculino",
  "F": "Feminino",
  "Other": "Outro"
};

export const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};