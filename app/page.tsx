"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  decode,
  moveLead,
  seed,
  stages,
  upsertLead,
  type Lead,
  type Stage,
  type Store,
} from "../lib/crm";
const KEY = "northstar.crm.v1";
export default function Page() {
  const [lang, setLang] = useState<"en" | "ru">("en"),
    [data, setData] = useState<Store>({ version: 1, leads: [], tasks: [] }),
    [ready, setReady] = useState(false),
    [view, setView] = useState(0),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(false),
    [edit, setEdit] = useState<Lead | null>(null),
    [error, setError] = useState("");
  const dlg = useRef<HTMLDialogElement>(null);
  const t = (a: string, b: string) => (lang === "en" ? a : b);
  const stageName = (s: Stage) =>
    ({
      inbox: t("Inbox", "Новые"),
      qualified: t("Qualified", "В работе"),
      proposal: t("Proposal", "Предложение"),
      won: t("Won", "Сделка"),
    })[s];
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const x = raw ? decode(raw) : seed();
      if (!raw) localStorage.setItem(KEY, JSON.stringify(x));
      setData(x);
      setLang(localStorage.getItem(KEY + ".lang") === "ru" ? "ru" : "en");
    } catch {
      setError(
        t(
          "Stored data is invalid and was preserved.",
          "Сохранённые данные повреждены и оставлены без изменений.",
        ),
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    if (ready) localStorage.setItem(KEY + ".lang", lang);
  }, [lang, ready]);
  useEffect(() => {
    modal ? dlg.current?.showModal() : dlg.current?.close();
  }, [modal]);
  const save = (next: Store) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      setData(next);
      setModal(false);
    } catch {
      setError(
        t(
          "Could not save in this browser.",
          "Не удалось сохранить в браузере.",
        ),
      );
    }
  };
  const open = (lead?: Lead) => {
    setEdit(
      lead
        ? { ...lead }
        : {
            id: crypto.randomUUID(),
            name: "",
            company: "",
            email: "",
            value: 0,
            stage: "inbox",
            priority: "medium",
            next: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            note: "",
            created: new Date().toISOString().slice(0, 10),
          },
    );
    setModal(true);
  };
  const filtered = useMemo(
    () =>
      data.leads.filter((l) =>
        `${l.name} ${l.company} ${l.email}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [data, query],
  );
  const total = data.leads
      .filter((l) => l.stage !== "won")
      .reduce((n, l) => n + l.value, 0),
    won = data.leads
      .filter((l) => l.stage === "won")
      .reduce((n, l) => n + l.value, 0),
    pending = data.tasks.filter((x) => !x.done).length;
  if (!ready) return <main className="loading">Northstar CRM…</main>;
  return (
    <div className="app">
      <aside>
        <div className="brand">
          <i>✦</i>
          <span>
            Northstar<small>CRM</small>
          </span>
        </div>
        <div className="space">
          <b>{t("Pine & Co. Studio", "Студия Pine & Co.")}</b>
          <small>{t("Portfolio workspace", "Демо-пространство")}</small>
        </div>
        <p className="label">{t("WORKSPACE", "РАБОЧЕЕ МЕСТО")}</p>
        <nav>
          {[
            t("Pipeline", "Воронка"),
            t("Contacts", "Контакты"),
            t("Tasks", "Задачи"),
          ].map((x, i) => (
            <button
              key={x}
              className={view === i ? "active" : ""}
              onClick={() => setView(i)}
            >
              <span>{["⌘", "○", "✓"][i]}</span>
              {x}
              {i === 2 && <em>{pending}</em>}
            </button>
          ))}
        </nav>
        <div className="quote">
          “
          {t(
            "Good work grows from clear conversations.",
            "Хорошая работа начинается с ясного общения.",
          )}
          ”
        </div>
        <div className="langs">
          <button
            className={lang === "en" ? "on" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            className={lang === "ru" ? "on" : ""}
            onClick={() => setLang("ru")}
          >
            RU
          </button>
        </div>
      </aside>
      <main>
        <div className="top">
          <span>
            {t("Fictional portfolio demo", "Вымышленное демо для портфолио")}
          </span>
          <div>
            <button className="ghost">⌕</button>
            <span className="user">AK</span>
          </div>
        </div>
        <header>
          <div>
            <p className="label">
              {t("RELATIONSHIPS, MADE CLEAR", "ОТНОШЕНИЯ БЕЗ ХАОСА")}
            </p>
            <h1>
              {
                [
                  t(
                    "Keep every opportunity moving.",
                    "Каждая возможность — в движении.",
                  ),
                  t("People behind the projects.", "Люди за каждым проектом."),
                  t("A thoughtful next step.", "Следующий шаг — вовремя."),
                ][view]
              }
            </h1>
            <p>
              {t(
                "A calm place for leads, follow-ups and the work ahead.",
                "Спокойное место для заявок, задач и будущей работы.",
              )}
            </p>
          </div>
          <button className="primary" onClick={() => open()}>
            ＋ {t("Add opportunity", "Добавить заявку")}
          </button>
        </header>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <section className="metrics">
          <article>
            <span>{t("Open pipeline", "Открытая воронка")}</span>
            <b>${total.toLocaleString()}</b>
            <small>{t("Illustrative values", "Примерные суммы")}</small>
          </article>
          <article>
            <span>{t("Won work", "Выиграно")}</span>
            <b>${won.toLocaleString()}</b>
            <small>
              {data.leads.filter((l) => l.stage === "won").length}{" "}
              {t("projects", "проекта")}
            </small>
          </article>
          <article>
            <span>{t("Next actions", "Ближайшие задачи")}</span>
            <b>{String(pending).padStart(2, "0")}</b>
            <small>{t("Stay gently on track", "Ничего не потеряется")}</small>
          </article>
        </section>
        <div className="tools">
          <input
            aria-label={t("Search", "Поиск")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              "Search people, companies, email…",
              "Поиск по имени, компании, email…",
            )}
          />
          <span>
            {filtered.length} {t("opportunities", "заявок")}
          </span>
        </div>
        {view === 0 && (
          <section className="board">
            {stages.map((stage) => (
              <div className="column" key={stage}>
                <div className="column-head">
                  <h2>
                    <i className={stage} />
                    {stageName(stage)}
                  </h2>
                  <span>
                    {filtered.filter((l) => l.stage === stage).length}
                  </span>
                </div>
                <div className="column-total">
                  $
                  {filtered
                    .filter((l) => l.stage === stage)
                    .reduce((n, l) => n + l.value, 0)
                    .toLocaleString()}
                </div>
                {filtered
                  .filter((l) => l.stage === stage)
                  .map((l) => (
                    <article className="card" key={l.id}>
                      <button className="card-main" onClick={() => open(l)}>
                        <div>
                          <span className={`priority ${l.priority}`}>
                            {l.priority}
                          </span>
                          <small>{l.company}</small>
                        </div>
                        <h3>{l.name}</h3>
                        <p>
                          {l.note || t("No note yet.", "Заметок пока нет.")}
                        </p>
                        <div className="card-foot">
                          <b>${l.value.toLocaleString()}</b>
                          <span>
                            {t("Next", "Далее")}: {l.next.slice(5)}
                          </span>
                        </div>
                      </button>
                      <div className="move">
                        {stages
                          .filter((s) => s !== stage)
                          .map((s) => (
                            <button
                              title={`${t("Move to", "Переместить в")} ${stageName(s)}`}
                              key={s}
                              onClick={() =>
                                save({
                                  ...data,
                                  leads: moveLead(data.leads, l.id, s),
                                })
                              }
                            >
                              → {stageName(s)}
                            </button>
                          ))}
                      </div>
                    </article>
                  ))}
              </div>
            ))}
          </section>
        )}
        {view === 1 && (
          <section className="tablebox">
            <table>
              <thead>
                <tr>
                  <th>{t("Contact", "Контакт")}</th>
                  <th>{t("Company", "Компания")}</th>
                  <th>Email</th>
                  <th>{t("Stage", "Этап")}</th>
                  <th>{t("Value", "Сумма")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id} onClick={() => open(l)}>
                    <td>
                      <span className="avatar">
                        {l.name
                          .split(" ")
                          .map((x) => x[0])
                          .join("")}
                      </span>
                      <b>{l.name}</b>
                    </td>
                    <td>{l.company}</td>
                    <td>{l.email}</td>
                    <td>
                      <span className="stage">{stageName(l.stage)}</span>
                    </td>
                    <td>${l.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        {view === 2 && (
          <section className="tasklist">
            {data.tasks
              .sort((a, b) => a.due.localeCompare(b.due))
              .map((task) => {
                const lead = data.leads.find((l) => l.id === task.leadId)!;
                return (
                  <label className={task.done ? "done" : ""} key={task.id}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() =>
                        save({
                          ...data,
                          tasks: data.tasks.map((x) =>
                            x.id === task.id ? { ...x, done: !x.done } : x,
                          ),
                        })
                      }
                    />
                    <span>
                      <b>{task.title}</b>
                      <small>
                        {lead.name} · {lead.company}
                      </small>
                    </span>
                    <time>{task.due}</time>
                  </label>
                );
              })}
          </section>
        )}
        <footer>
          Northstar CRM ·{" "}
          {t(
            "Local data · no messages or payments are sent",
            "Локальные данные · письма и платежи не отправляются",
          )}
        </footer>
      </main>
      <dialog
        ref={dlg}
        aria-label={t("Opportunity form", "Форма заявки")}
        onCancel={() => setModal(false)}
      >
        {edit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                save({ ...data, leads: upsertLead(data.leads, edit) });
              } catch {
                setError(t("Check all fields.", "Проверьте все поля."));
              }
            }}
          >
            <div className="dialog-head">
              <div>
                <p className="label">{t("OPPORTUNITY", "ЗАЯВКА")}</p>
                <h2>
                  {data.leads.some((l) => l.id === edit.id)
                    ? t("Edit the details", "Изменить данные")
                    : t("A new conversation", "Новый контакт")}
                </h2>
              </div>
              <button type="button" onClick={() => setModal(false)}>
                ×
              </button>
            </div>
            <div className="row">
              <label>
                {t("Name", "Имя")}
                <input
                  required
                  minLength={2}
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                />
              </label>
              <label>
                {t("Company", "Компания")}
                <input
                  required
                  minLength={2}
                  value={edit.company}
                  onChange={(e) =>
                    setEdit({ ...edit, company: e.target.value })
                  }
                />
              </label>
            </div>
            <label>
              Email
              <input
                required
                type="email"
                value={edit.email}
                onChange={(e) => setEdit({ ...edit, email: e.target.value })}
              />
            </label>
            <div className="row">
              <label>
                {t("Stage", "Этап")}
                <select
                  value={edit.stage}
                  onChange={(e) =>
                    setEdit({ ...edit, stage: e.target.value as Stage })
                  }
                >
                  {stages.map((s) => (
                    <option value={s} key={s}>
                      {stageName(s)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t("Priority", "Приоритет")}
                <select
                  value={edit.priority}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      priority: e.target.value as Lead["priority"],
                    })
                  }
                >
                  <option value="low">Low / Низкий</option>
                  <option value="medium">Medium / Средний</option>
                  <option value="high">High / Высокий</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label>
                {t("Illustrative value, $", "Примерная сумма, $")}
                <input
                  type="number"
                  min="0"
                  required
                  value={edit.value}
                  onChange={(e) =>
                    setEdit({ ...edit, value: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                {t("Next action", "Следующее действие")}
                <input
                  type="date"
                  required
                  value={edit.next}
                  onChange={(e) => setEdit({ ...edit, next: e.target.value })}
                />
              </label>
            </div>
            <label>
              {t("Note", "Заметка")}
              <textarea
                maxLength={500}
                value={edit.note}
                onChange={(e) => setEdit({ ...edit, note: e.target.value })}
              />
            </label>
            <p className="hint">
              {t(
                "Demo only. Use fictional contact details.",
                "Учебное демо. Используйте вымышленные контакты.",
              )}
            </p>
            <button className="primary">
              {t("Save opportunity", "Сохранить заявку")}
            </button>
          </form>
        )}
      </dialog>
    </div>
  );
}
