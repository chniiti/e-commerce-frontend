"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { z } from "zod";

import {
  DataTable,
  type DataTableColumn,
} from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  activateUser,
  createUser,
  getUsers,
  suspendUser,
  updateUserRole,
} from "@/lib/api/users";
import type { User, UserRole } from "@/lib/types";
import { formatDate } from "@/lib/utils/formatters";
import { getApiErrorMessage } from "@/lib/utils/apiErrors";

const PAGE_SIZE = 20;

const ROLES: UserRole[] = ["ADMIN", "TRENDS_RESPONSIBLE", "CUSTOMER"];

const createUserSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(255),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || /^\+?[0-9]{8,15}$/.test(value),
      "Invalid phone number format",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer"),
  role: z.enum(["ADMIN", "TRENDS_RESPONSIBLE", "CUSTOMER"]),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

function roleLabel(role: UserRole): string {
  switch (role) {
    case "TRENDS_RESPONSIBLE":
      return "Trends Responsible";
    case "ADMIN":
      return "Admin";
    default:
      return "Customer";
  }
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "TRENDS_RESPONSIBLE",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: CreateUserFormValues) =>
      createUser({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
        role: values.role,
      }),
    onSuccess: async (user) => {
      toast.success(`Created ${user.name}`);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to create user"));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          form.reset();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
          <DialogDescription>
            Add an Admin or Trends Responsible account.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          noValidate
        >
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input id="email" type="email" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone (optional)
            </label>
            <Input
              id="phone"
              placeholder="+97450123456"
              {...form.register("phone")}
            />
            {form.formState.errors.phone ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.phone.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <select
              id="role"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
              {...form.register("role")}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({
    queryKey: ["users", page, PAGE_SIZE],
    queryFn: () => getUsers(page, PAGE_SIZE),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: UserRole }) =>
      updateUserRole(id, role),
    onSuccess: async (user) => {
      toast.success(`Updated role for ${user.name}`);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update role"));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (user: User) =>
      user.enabled ? suspendUser(user.id) : activateUser(user.id),
    onSuccess: async (user) => {
      toast.success(
        user.enabled ? `${user.name} activated` : `${user.name} suspended`,
      );
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Unable to update user status"));
    },
  });

  const columns = useMemo<DataTableColumn<User>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        cell: (row) => (
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: (row) => (
          <select
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
            value={row.role}
            disabled={roleMutation.isPending}
            onChange={(event) =>
              roleMutation.mutate({
                id: row.id,
                role: event.target.value as UserRole,
              })
            }
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <Badge variant={row.enabled ? "secondary" : "destructive"}>
            {row.enabled ? "Active" : "Suspended"}
          </Badge>
        ),
      },
      {
        id: "created",
        header: "Created",
        cell: (row) => formatDate(row.createdAt),
      },
      {
        id: "actions",
        header: "",
        className: "text-right",
        cell: (row) => (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={toggleMutation.isPending}
              onClick={() => toggleMutation.mutate(row)}
            >
              {row.enabled ? "Suspend" : "Activate"}
            </Button>
          </div>
        ),
      },
    ],
    [roleMutation, toggleMutation],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff accounts, roles, and access.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus />
          Create user
        </Button>
      </div>

      {query.isError ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {getApiErrorMessage(query.error)}
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={query.data?.content ?? []}
          getRowId={(row) => row.id}
          page={page}
          totalPages={query.data?.totalPages ?? 0}
          totalElements={query.data?.totalElements ?? 0}
          onPageChange={setPage}
          isLoading={query.isLoading || query.isFetching}
          emptyMessage="No users found."
        />
      )}

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
