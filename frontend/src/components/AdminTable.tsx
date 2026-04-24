'use client';
import React from 'react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
}

export default function AdminTable<T extends { _id: string }>({
  columns,
  data,
  actions,
  onRowClick,
}: AdminTableProps<T>) {
  const gridTemplateColumns = [
    ...columns.map(col => col.width || 'minmax(150px, 1fr)'),
    ...(actions ? ['auto'] : []),
  ].join(' ');

  return (
    <div className="w-full overflow-x-auto">
      {/* Header */}
      <div
        className="hidden md:grid bg-orange-100 rounded-t-xl p-4 font-semibold text-gray-700 mb-2 border-b border-orange-200"
        style={{ gridTemplateColumns }}
      >
        {columns.map((col) => (
          <div key={col.key as string} className="truncate">
            {col.label}
          </div>
        ))}
        {actions && <div>Actions</div>}
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {data.filter((item) => item).map((item) => (
          <div
            key={item._id}
            onClick={() => onRowClick?.(item)}
            className="bg-white shadow-md p-4 md:grid hover:shadow-lg transition cursor-pointer"
            style={{ gridTemplateColumns }}
          >
            {columns.map((col) => (
              <div key={col.key as string} className="truncate">
                <span className="text-sm font-semibold text-gray-500 md:hidden">{col.label}</span>
                <span className="text-gray-900">
                  {col.render
                    ? col.render(item)
                    : col.key === 'createdAt' && (item as any)[col.key as string]
                      ? new Date((item as any)[col.key as string]).toLocaleDateString()
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      : (item as any)[col.key as string] ?? ''}
                </span>
              </div>
            ))}
            {actions && (
              <div className="flex flex-wrap justify-start gap-2 mt-2 md:mt-0">
                {actions(item)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
