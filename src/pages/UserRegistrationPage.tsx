import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Trash2, UserPlus, Users } from "lucide-react";
import { ApiError, api } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type IUser from "@/interface/IUser/IUsuario";

interface UserFormState {
  name: string;
  email: string;
  phone: string;
  permission: string;
  password: string;
  confirmPassword: string;
}

interface UserProfile {
  ID: number;
  description: string;
}

const EMPTY_FORM: UserFormState = {
  name: "",
  email: "",
  phone: "",
  permission: "",
  password: "",
  confirmPassword: "",
};

function messageFromError(error: unknown, fallback = "Não foi possível cadastrar o usuário."): string {
  if (error instanceof ApiError) {
    if (error.message === "email.alredy.used") return "Este e-mail já está cadastrado.";
    if (error.message === "error.create") return "Não foi possível criar o usuário.";
    if (error.message === "error.hash.password") return "Não foi possível proteger a senha.";
    return error.message;
  }

  return fallback;
}

export function UserRegistrationPage() {
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [users, setUsers] = useState<IUser[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [permissionsError, setPermissionsError] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [editForm, setEditForm] = useState<UserFormState>(EMPTY_FORM);
  const [updating, setUpdating] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadPermissions = async () => {
    setLoadingPermissions(true);
    setPermissionsError("");

    try {
      const response = await api.get<UserProfile[]>("user-profiles/");
      const profiles = Array.isArray(response.data) ? response.data : [];
      const nextPermissions = profiles
        .map((profile) => profile.description?.trim())
        .filter(Boolean);

      setPermissions(nextPermissions);
      setForm((current) => ({
        ...current,
        permission: current.permission || nextPermissions[0] || "",
      }));
    } catch (err) {
      console.error("[UserRegistrationPage] perfis de usuário falharam:", err);
      setPermissions([]);
      setPermissionsError("Nãoo foi possível carregar os perfis cadastrados.");
    } finally {
      setLoadingPermissions(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get<IUser[]>("users/");
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("[UserRegistrationPage] usuários falharam:", err);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    void loadPermissions();
    void loadUsers();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password || !form.permission) {
      setError("Preencha nome, e-mail, permissão e senha.");
      setSuccess("");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("As senhas não conferem.");
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.post("users/", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        permission: form.permission,
        password: form.password,
      });
      setForm({ ...EMPTY_FORM, permission: permissions[0] || "" });
      setSuccess("Usuário cadastrado com sucesso.");
      await loadUsers();
    } catch (err) {
      console.error("[UserRegistrationPage] cadastro falhou:", err);
      setError(messageFromError(err));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (user: IUser) => {
    setEditingUser(user);
    setEditError("");
    setEditForm({
      name: user.name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      permission: user.permission ?? permissions[0] ?? "",
      password: "",
      confirmPassword: "",
    });
  };

  const closeEdit = () => {
    if (updating) return;
    setEditingUser(null);
    setEditError("");
    setEditForm(EMPTY_FORM);
  };

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingUser) return;

    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.permission) {
      setEditError("Preencha nome, e-mail e permissão.");
      return;
    }

    if (editForm.password && editForm.password !== editForm.confirmPassword) {
      setEditError("As senhas não conferem.");
      return;
    }

    setUpdating(true);
    setEditError("");
    setError("");
    setSuccess("");

    try {
      await api.patch(`users/${editingUser.ID}/`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        permission: editForm.permission,
        ...(editForm.password ? { password: editForm.password } : {}),
      });
      setEditingUser(null);
      setEditForm(EMPTY_FORM);
      setSuccess("Usuário atualizado com sucesso.");
      await loadUsers();
    } catch (err) {
      console.error("[UserRegistrationPage] update falhou:", err);
      setEditError(messageFromError(err, "Não foi possível atualizar o usuário."));
    } finally {
      setUpdating(false);
    }
  };

  const deleteUser = async (user: IUser) => {
    setDeletingUserId(user.ID);
    setError("");
    setSuccess("");

    try {
      await api.delete(`users/${user.ID}/`);
      setUsers((current) => current.filter((registeredUser) => registeredUser.ID !== user.ID));
      setSuccess("Usuário excluído com sucesso.");
    } catch (err) {
      console.error("[UserRegistrationPage] delete falhou:", err);
      setError(messageFromError(err, "Não foi possível excluir o usuário."));
    } finally {
      setDeletingUserId(null);
    }
  };

  const editPermissions =
    editForm.permission && !permissions.includes(editForm.permission)
      ? [editForm.permission, ...permissions]
      : permissions;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            configurações
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Cadastrar usuário</h1>
        </div>
      </header>

      <div className="grid gap-6">
        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-card p-6 shadow-card"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-semibold">Novo acesso</h2>
              <p className="text-sm text-muted-foreground">
                Informe os dados para liberar um novo usuário no sistema.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Operador da linha"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="operador@plcbridge.local"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="permission">Permissão</Label>
                <Select
                  value={form.permission}
                  onValueChange={(permission) => setForm({ ...form, permission })}
                  disabled={loadingPermissions || permissions.length === 0}
                >
                  <SelectTrigger id="permission">
                    <SelectValue
                      placeholder={loadingPermissions ? "Carregando perfis" : "Selecione"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {permissions.map((permission) => (
                      <SelectItem key={permission} value={permission}>
                        {permission}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {permissionsError && (
                  <p className="text-xs text-destructive">{permissionsError}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm({ ...form, confirmPassword: event.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro no cadastro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-5 border-status-online/40 text-status-online">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Cadastro concluído</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Editar usuário</DialogTitle>
          </DialogHeader>

          <form onSubmit={submitEdit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="editName">Nome</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="editEmail">E-mail</Label>
              <Input
                id="editEmail"
                type="email"
                value={editForm.email}
                onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="editPhone">Telefone</Label>
                <Input
                  id="editPhone"
                  value={editForm.phone}
                  onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="editPermission">Permissão</Label>
                <Select
                  value={editForm.permission}
                  onValueChange={(permission) => setEditForm({ ...editForm, permission })}
                  disabled={loadingPermissions || editPermissions.length === 0}
                >
                  <SelectTrigger id="editPermission">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {editPermissions.map((permission) => (
                      <SelectItem key={permission} value={permission}>
                        {permission}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="editPassword">Nova senha</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editForm.password}
                  onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="editConfirmPassword">Confirmar senha</Label>
                <Input
                  id="editConfirmPassword"
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={(event) =>
                    setEditForm({ ...editForm, confirmPassword: event.target.value })
                  }
                />
              </div>
            </div>

            {editError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro ao editar</AlertTitle>
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEdit} disabled={updating}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <section className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-semibold">Usuários cadastrados</h2>
            </div>
          </div>
        </div>

        {loadingUsers ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">Carregando usuários.</p>
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum usuário retornado.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((registeredUser) => (
                <TableRow key={registeredUser.ID}>
                  <TableCell className="font-medium">{registeredUser.name}</TableCell>
                  <TableCell>{registeredUser.email}</TableCell>
                  <TableCell>{registeredUser.phone || "-"}</TableCell>
                  <TableCell className="font-mono text-xs uppercase">
                    {registeredUser.permission || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => openEdit(registeredUser)}
                        aria-label="Editar usuário"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Excluir usuário"
                            disabled={deletingUserId === registeredUser.ID}
                          >
                            {deletingUserId === registeredUser.ID ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação remove {registeredUser.name} do sistema.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => void deleteUser(registeredUser)}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
