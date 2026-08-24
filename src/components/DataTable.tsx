"use client";

import { TableData } from "@/types/quiz";

interface Props {
  table: TableData;
  compact?: boolean;
}

export default function DataTable({ table, compact = false }: Props) {
  if (!table || !table.headers || table.headers.length === 0) return null;

  const renderCellContent = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-slate-600 italic">—</span>;
    }

    // If cell is an array of items (e.g. [130, 155, 74, 180])
    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-1 items-center">
          {value.map((item, idx) => (
            <span
              key={idx}
              className="inline-block px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-200 font-mono text-xs font-medium"
            >
              {typeof item === "object" ? JSON.stringify(item) : String(item)}
            </span>
          ))}
        </div>
      );
    }

    // If cell is an object with value and order (e.g. Latin Square cell: { value: 11.61, order: "d" })
    if (typeof value === "object") {
      if ("value" in value) {
        return (
          <div className="inline-flex items-center gap-1.5 font-mono text-xs">
            <span className="text-white font-semibold">{String(value.value)}</span>
            {value.order && value.order !== "UNCLEAR_IN_SOURCE" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                ({value.order})
              </span>
            )}
          </div>
        );
      }
      return <span className="font-mono text-xs text-slate-300">{JSON.stringify(value)}</span>;
    }

    // Default primitive (string or number)
    return (
      <span className="font-mono text-xs sm:text-sm text-slate-200 font-medium">
        {String(value)}
      </span>
    );
  };

  return (
    <div className="w-full my-4 rounded-2xl overflow-hidden border border-white/[0.08] bg-slate-950/40 backdrop-blur-md shadow-lg">
      {/* Table Header / Title Bar */}
      {table.title && (
        <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-brand-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {table.title}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            {table.rows.length} rows × {table.headers.length} cols
          </span>
        </div>
      )}

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto max-w-full">
        <table className="w-full text-left border-collapse min-w-full">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
              {table.headers.map((header, idx) => (
                <th
                  key={idx}
                  className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 ${
                    compact ? "px-3 py-2" : "px-4 py-3"
                  } whitespace-nowrap`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {table.rows.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="hover:bg-white/[0.025] transition-colors duration-150"
              >
                {table.headers.map((header, cIdx) => {
                  const cellValue = row[header];
                  return (
                    <td
                      key={cIdx}
                      className={`${
                        compact ? "px-3 py-2" : "px-4 py-3"
                      } text-slate-200 align-middle`}
                    >
                      {renderCellContent(cellValue)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
