import { PEAK, familyColor, top5 } from "../../utils/theme.js";
import { Alert, Bi, Note, Step, Tag } from "../../utils/ui.jsx";

export const MONTH_NAME = { 6: "June", 7: "July", 8: "August", 9: "September", 10: "October" };
export const byMonth = (m) => top5.filter((t) => t.month === m).sort((a, b) => a.rank - b.rank);

export function RankBars({ month, active, onPick, compact }) {
  const rows = byMonth(month);
  const max = Math.max(...rows.map((r) => r.records));
  return (
    <ol className={`rank-bars${compact ? " compact" : ""}`}>
      {rows.map((r, i) => (
        <li
          key={r.family}
          className={active === i ? "on" : ""}
          onClick={onPick ? () => onPick(i) : undefined}
          style={onPick ? { cursor: "pointer" } : undefined}
        >
          <span className="rk">{r.rank}</span>
          <span className="rk-name">
            {r.family}
          </span>
          <span className="rk-bar">
            <i style={{ width: `${(r.records / max) * 100}%`, background: familyColor(r.family) }} />
          </span>
          <span className="rk-n">{r.records}</span>
        </li>
      ))}
    </ol>
  );
}

export default function Top5() {
  return (
    <Step
      id="top5"
      en="Top 5 families by month"
      desc="Edible-range records only (199 records), counted by family with all years combined. This is a ranking of record counts, not of places."
      wide
    >
      <div className="tm-grid">
        {PEAK.map((m) => {
          const rows = byMonth(m);
          return (
            <div className="panel" key={m}>
              <div className="panel-label">
                <Bi en={MONTH_NAME[m]} /> <span className="n-badge">n = {rows[0].monthTotal}</span>
              </div>
              <RankBars month={m} />
            </div>
          );
        })}
      </div>
      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              {[1, 2, 3, 4, 5].map((r) => (
                <th key={r}>#{r}</th>
              ))}
              <th>n</th>
            </tr>
          </thead>
          <tbody>
            {PEAK.map((m) => {
              const rows = byMonth(m);
              return (
                <tr key={m}>
                  <td>{MONTH_NAME[m]}</td>
                  {rows.map((r) => (
                    <td key={r.family}>
                      {r.family} <b>{r.records}</b>
                    </td>
                  ))}
                  <td>{rows[0].monthTotal}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Alert kind="warning">
        Boletaceae ranks first (or ties) in all four months, but it holds edible species and species flagged as poisonous: 12 of its 14 June records and 5 of its 13 August records carry the flag.
      </Alert>
      <Note>
        June (26 records) and September (17) are small, so ranks 4 and 5 are ties at 1–2 records and carry little information. Ties are broken by all-year records, then by name.
        <Tag kind="info">n shown on every chart</Tag>
      </Note>
    </Step>
  );
}
