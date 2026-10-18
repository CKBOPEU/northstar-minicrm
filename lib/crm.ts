export type Stage = "inbox" | "qualified" | "proposal" | "won";
export type Priority = "low" | "medium" | "high";
export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  value: number;
  stage: Stage;
  priority: Priority;
  next: string;
  note: string;
  created: string;
};
export type Task = {
  id: string;
  leadId: string;
  title: string;
  due: string;
  done: boolean;
};
export type Store = { version: 1; leads: Lead[]; tasks: Task[] };
export const stages: Stage[] = ["inbox", "qualified", "proposal", "won"];
export function validLead(l: Lead) {
  return (
    !!l.id &&
    l.name.trim().length >= 2 &&
    l.company.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(l.email) &&
    Number.isFinite(l.value) &&
    l.value >= 0 &&
    stages.includes(l.stage) &&
    ["low", "medium", "high"].includes(l.priority) &&
    /^\d{4}-\d{2}-\d{2}$/.test(l.next) &&
    l.note.length <= 500
  );
}
export function moveLead(leads: Lead[], id: string, stage: Stage) {
  if (!stages.includes(stage)) throw Error("stage");
  if (!leads.some((l) => l.id === id)) throw Error("missing");
  return leads.map((l) => (l.id === id ? { ...l, stage } : l));
}
export function upsertLead(leads: Lead[], lead: Lead) {
  if (!validLead(lead)) throw Error("invalid");
  return leads.some((l) => l.id === lead.id)
    ? leads.map((l) =>
        l.id === lead.id
          ? {
              ...lead,
              name: lead.name.trim(),
              company: lead.company.trim(),
              email: lead.email.trim().toLowerCase(),
              note: lead.note.trim(),
            }
          : l,
      )
    : [
        ...leads,
        {
          ...lead,
          name: lead.name.trim(),
          company: lead.company.trim(),
          email: lead.email.trim().toLowerCase(),
          note: lead.note.trim(),
        },
      ];
}
export function decode(raw: string): Store {
  const v = JSON.parse(raw);
  if (
    !v ||
    v.version !== 1 ||
    !Array.isArray(v.leads) ||
    !Array.isArray(v.tasks) ||
    v.leads.length > 1000 ||
    v.tasks.length > 5000
  )
    throw Error("corrupt");
  const ids = new Set<string>();
  for (const l of v.leads) {
    if (!validLead(l) || ids.has(l.id)) throw Error("corrupt");
    ids.add(l.id);
  }
  for (const t of v.tasks)
    if (
      !t ||
      typeof t.id !== "string" ||
      !ids.has(t.leadId) ||
      typeof t.title !== "string" ||
      t.title.length < 2 ||
      t.title.length > 160 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(t.due) ||
      typeof t.done !== "boolean"
    )
      throw Error("corrupt");
  return v;
}
export function seed(): Store {
  const d = (n: number) => {
    const x = new Date();
    x.setUTCDate(x.getUTCDate() + n);
    return x.toISOString().slice(0, 10);
  };
  const rows: [
    string,
    string,
    string,
    number,
    Stage,
    Priority,
    number,
    string,
  ][] = [
    [
      "Maya Chen",
      "Lumen Studio",
      "maya@example.com",
      3200,
      "proposal",
      "high",
      1,
      "Waiting for feedback on the project outline.",
    ],
    [
      "Noah Williams",
      "Field Notes",
      "noah@example.com",
      1400,
      "qualified",
      "medium",
      3,
      "Discovery call completed.",
    ],
    [
      "Sofia Rossi",
      "Orchard & Co",
      "sofia@example.com",
      4800,
      "proposal",
      "high",
      2,
      "Website refresh and content system.",
    ],
    [
      "Elias Berg",
      "Morrow Goods",
      "elias@example.com",
      900,
      "inbox",
      "low",
      5,
      "New enquiry from portfolio.",
    ],
    [
      "Amara Okafor",
      "Kindred Labs",
      "amara@example.com",
      2600,
      "qualified",
      "medium",
      4,
      "Needs a phased estimate.",
    ],
    [
      "Lucas Martin",
      "Studio Ciel",
      "lucas@example.com",
      5200,
      "won",
      "high",
      7,
      "Kickoff scheduled.",
    ],
    [
      "Aiko Tanaka",
      "Paper Moon",
      "aiko@example.com",
      1800,
      "inbox",
      "medium",
      2,
      "Asked about a compact brand site.",
    ],
    [
      "Mateo Silva",
      "North Goods",
      "mateo@example.com",
      3600,
      "won",
      "medium",
      6,
      "Deposit is fictional; demo only.",
    ],
  ];
  const leads = rows.map((r, i) => ({
    id: `demo-${i}`,
    name: r[0],
    company: r[1],
    email: r[2],
    value: r[3],
    stage: r[4],
    priority: r[5],
    next: d(r[6]),
    note: r[7],
    created: d(-i - 1),
  }));
  return {
    version: 1,
    leads,
    tasks: leads
      .slice(0, 6)
      .map((l, i) => ({
        id: `task-${i}`,
        leadId: l.id,
        title: [
          "Send revised scope",
          "Prepare call notes",
          "Review proposal",
          "Reply to enquiry",
          "Draft phased estimate",
          "Share kickoff agenda",
        ][i],
        due: l.next,
        done: i === 1,
      })),
  };
}
