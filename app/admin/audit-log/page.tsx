"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { Input } from "@/components/ui/input";
import { getAuditLog } from "@/lib/api/auditLog";
import type { AuditLogEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatters";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";

const PAGE_SIZE = 20;

const columns: DataTableColumn<AuditLogEntry>[] = [
  {
    id: "actor",
    header: "Actor",
    cell: (row) => <span className="font-mono text-xs">#{row.actorId}</span>,
  },
  {
    id: "action",
    header: "Action",
    cell: (row) => <span className="font-medium">{row.action}</span>,
  },
  {
    id: "entity",
    header: "Entity",
    cell: (row) => row.entityType,
  },
  {
    id: "entityId",
    header: "Entity ID",
    cell: (row) => <span className="font-mono text-xs">#{row.entityId}</span>,
  },
  {
    id: "timestamp",
    header: "Timestamp",
    cell: (row) => formatDate(row.createdAt),
  },
];

export default function AdminAuditLogPage() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const query = useQuery({
    queryKey: ["audit-logs", page, PAGE_SIZE],
    queryFn: () => getAuditLog(page, PAGE_SIZE),
  });

  const filteredRows = useMemo(() => {
    const rows = query.data?.content ?? [];
    const actionQuery = actionFilter.trim().toLowerCase();
    const fromMs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toMs = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return rows.filter((row) => {
      if (actionQuery && !row.action.toLowerCase().includes(actionQuery)) {
        return false;
      }

      const createdMs = new Date(row.createdAt).getTime();
      if (fromMs !== null && createdMs < fromMs) {
        return false;
      }
      if (toMs !== null && createdMs > toMs) {
        return false;
      }

      return true;
    });
  }, [actionFilter, fromDate, query.data?.content, toDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Read-only trail of admin and staff actions.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="actionFilter" className="text-sm font-medium">
            Action contains
          </label>
          <Input
            id="actionFilter"
            placeholder="e.g. PRODUCT_APPROVED"
            value={actionFilter}
            onChange={(event) => setActionFilter(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="fromDate" className="text-sm font-medium">
            From date
          </label>
          <Input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="toDate" className="text-sm font-medium">
            To date
          </label>
          <Input
            id="toDate"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </div>

      {query.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(query.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRows}
          getRowId={(row) => row.id}
          page={page}
          totalPages={query.data?.totalPages ?? 0}
          totalElements={query.data?.totalElements ?? 0}
          onPageChange={setPage}
          isLoading={query.isLoading || query.isFetching}
          emptyMessage="No audit events match these filters."
        />
      )}
    </div>
  );
}
