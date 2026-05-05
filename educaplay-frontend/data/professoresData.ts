// =============================================================
//  professoresData.ts
//  Dados mock de professores.
//  Quando o backend estiver pronto, substitua por chamadas à API.
// =============================================================

export type Professor = {
  id: string;
  nome: string;
  materias: string[]; // matérias que o professor pode lecionar
};

export type AulaOcupada = {
  professorId: string;
  turno: string;
  horarioId: string; // id do slot de horário
};

// Lista de professores disponíveis no sistema
export const PROFESSORES_MOCK: Professor[] = [
  { id: "p1",  nome: "Prof. Ricardo",  materias: ["Matemática", "Física"] },
  { id: "p2",  nome: "Prof. Ana",      materias: ["História", "Geografia"] },
  { id: "p3",  nome: "Prof. Carlos",   materias: ["Português", "Literatura"] },
  { id: "p4",  nome: "Prof. Beatriz",  materias: ["Ciências", "Biologia"] },
  { id: "p5",  nome: "Prof. Marcos",   materias: ["Geografia", "História"] },
  { id: "p6",  nome: "Prof. Luiz",     materias: ["Física", "Matemática"] },
  { id: "p7",  nome: "Prof. Fernanda", materias: ["Química", "Ciências"] },
  { id: "p8",  nome: "Prof. Paula",    materias: ["Biologia", "Ciências"] },
  { id: "p9",  nome: "Prof. Sandra",   materias: ["Inglês", "Literatura"] },
  { id: "p10", nome: "Prof. João",     materias: ["Educação Física"] },
  { id: "p11", nome: "Prof. Roberto",  materias: ["Matemática", "Física"] },
  { id: "p12", nome: "Prof. Lúcia",    materias: ["Português", "Literatura"] },
  { id: "p13", nome: "Prof. Tiago",    materias: ["História", "Filosofia"] },
  { id: "p14", nome: "Prof. Cláudia",  materias: ["Geografia", "Sociologia"] },
];

// Aulas já ocupadas por turno/horário (mock)
// Quando o backend existir: GET /api/aulas-ocupadas?turno=X&horarioId=Y
export const AULAS_OCUPADAS_MOCK: AulaOcupada[] = [
  { professorId: "p1",  turno: "matutino",   horarioId: "m1" },
  { professorId: "p2",  turno: "matutino",   horarioId: "m2" },
  { professorId: "p3",  turno: "matutino",   horarioId: "m3" },
  { professorId: "p4",  turno: "matutino",   horarioId: "m4" },
  { professorId: "p5",  turno: "matutino",   horarioId: "m5" },
  { professorId: "p6",  turno: "vespertino", horarioId: "v1" },
  { professorId: "p7",  turno: "vespertino", horarioId: "v2" },
  { professorId: "p8",  turno: "vespertino", horarioId: "v3" },
  { professorId: "p9",  turno: "vespertino", horarioId: "v4" },
  { professorId: "p10", turno: "vespertino", horarioId: "v5" },
  { professorId: "p11", turno: "noturno",    horarioId: "n1" },
  { professorId: "p12", turno: "noturno",    horarioId: "n2" },
  { professorId: "p13", turno: "noturno",    horarioId: "n3" },
  { professorId: "p14", turno: "noturno",    horarioId: "n4" },
];

// Retorna professores que NÃO estão ocupados no mesmo turno/horário
// Futuramente: GET /api/professores/disponiveis?turno=X&horarioId=Y
export function getProfessoresDisponiveis(
  turno: string,
  horarioId: string,
  professorAtualId?: string
): Professor[] {
  const ocupadosNoMesmoHorario = AULAS_OCUPADAS_MOCK
    .filter((a) => a.turno === turno && a.horarioId === horarioId)
    .map((a) => a.professorId);

  return PROFESSORES_MOCK.filter(
    (p) =>
      !ocupadosNoMesmoHorario.includes(p.id) ||
      p.id === professorAtualId // professor atual sempre aparece
  );
}
