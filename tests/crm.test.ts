import test from "node:test";
import assert from "node:assert/strict";
import { decode, moveLead, seed, upsertLead, validLead } from "../lib/crm.ts";
test("seed is valid and decodes", () => {
  const s = seed();
  assert.equal(s.leads.length, 8);
  assert.equal(decode(JSON.stringify(s)).tasks.length, 6);
});
test("lead validation catches bad fields", () => {
  const l = seed().leads[0];
  assert(validLead(l));
  assert(!validLead({ ...l, email: "bad" }));
  assert(!validLead({ ...l, value: -1 }));
  assert(!validLead({ ...l, next: "today" }));
});
test("upsert normalizes contact and updates in place", () => {
  const l = {
    ...seed().leads[0],
    name: "  Maya Chen ",
    email: "MAYA@EXAMPLE.COM",
  };
  const out = upsertLead([], l);
  assert.equal(out[0].name, "Maya Chen");
  assert.equal(out[0].email, "maya@example.com");
  assert.equal(upsertLead(out, { ...out[0], value: 99 }).length, 1);
});
test("stage move preserves lead and rejects missing", () => {
  const leads = seed().leads;
  const moved = moveLead(leads, leads[0].id, "won");
  assert.equal(moved[0].stage, "won");
  assert.throws(() => moveLead(leads, "missing", "won"), /missing/);
});
test("decoder rejects malformed, duplicate and orphan records", () => {
  const s = seed();
  assert.throws(() => decode("{"));
  assert.throws(() => decode(JSON.stringify({ ...s, version: 2 })), /corrupt/);
  assert.throws(
    () => decode(JSON.stringify({ ...s, leads: [s.leads[0], s.leads[0]] })),
    /corrupt/,
  );
  assert.throws(
    () =>
      decode(
        JSON.stringify({ ...s, tasks: [{ ...s.tasks[0], leadId: "none" }] }),
      ),
    /corrupt/,
  );
});
