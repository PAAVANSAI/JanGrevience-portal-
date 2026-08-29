import React from "react";
import { motion } from "framer-motion";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface AdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

export function AdminTable<T extends { id?: string }>({ data, columns, onRowClick, isLoading }: AdminTableProps<T>) {
  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading...</div>;
  }

  if (data.length === 0) {
    return <div className="p-8 text-center text-text-muted bg-surface border border-border rounded-lg">No records found.</div>;
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-bg border-b border-border">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-3 font-semibold">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <motion.tr
                key={item.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onRowClick && onRowClick(item)}
                className={`border-b border-border last:border-0 ${
                  onRowClick ? "cursor-pointer hover:bg-blue-50 transition-colors" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
