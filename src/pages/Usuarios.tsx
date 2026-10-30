import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUsuarios, saveUsuario } from "@/lib/api";
import { User, UserRole } from "@/types/auth";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { UsuarioModal } from "@/components/usuarios/UsuarioModal";
import {
  Shield,
  UserPlus,
  Search,
  Users,
  CheckCircle2,
  UserCheck,
  Mail,
  Phone,
  Settings,
  Power,
  Loader2,
  RefreshCw,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";

function formatPhone(phone: string) {
  const p = String(phone || "").replace(/\D/g, "");
  if (p.startsWith("55") && (p.length === 12 || p.length === 13)) {
    const ddd = p.substring(2, 4);
    const prefix = p.length === 13 ? p.substring(4, 9) : p.substring(4, 8);
    const suffix = p.length === 13 ? p.substring(9) : p.substring(8);
    return `+55 (${ddd}) ${prefix}-${suffix}`;
  }
  if (p.length === 10 || p.length === 11) {
    const ddd = p.substring(0, 2);
    const prefix = p.length === 11 ? p.substring(2, 7) : p.substring(2, 6);
    const suffix = p.length === 11 ? p.substring(7) : p.substring(6);
    return `(${ddd}) ${prefix}-${suffix}`;
  }
  return phone;
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"todos" | "admin" | "operador">("todos");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const currentUserId = currentUser?.user_id || currentUser?.id;

  const {
    data: usuarios = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["usuarios"],
    queryFn: getUsuarios,
  });

  const filteredUsuarios = usuarios.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (u.nome || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.whatsapp || "").includes(term);

    const normalizedRole = (u.role || "operador").toLowerCase();
    const matchesRole = roleFilter === "todos" || normalizedRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalUsuarios = usuarios.length;
  const usuariosAtivos = usuarios.filter((u) => u.ativo !== false).length;
  const totalAdmins = usuarios.filter((u) => (u.role || "").toLowerCase() === "admin").length;
  const totalOperadores = usuarios.filter((u) => (u.role || "").toLowerCase() !== "admin").length;

  const handleNovoUsuario = () => {
    setSelectedUsuario(null);
    setIsModalOpen(true);
  };

  const handleEditarUsuario = (usuario: User) => {
    setSelectedUsuario(usuario);
    setIsModalOpen(true);
  };

  const handleToggleAtivo = async (usuario: User) => {
    if (Number(usuario.id) === Number(currentUserId)) {
      toast.error("Você não pode desativar sua própria conta.");
      return;
    }

    const novoStatus = !(usuario.ativo !== false);
    setTogglingId(usuario.id);
    try {
      const res = await saveUsuario({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        whatsapp: usuario.whatsapp,
        role: ((usuario.role || "operador").toLowerCase() === "admin" ? "admin" : "operador") as UserRole,
        ativo: novoStatus,
      });

      if (res.ok) {
        toast.success(
          novoStatus
            ? `Acesso de "${usuario.nome}" reativado com sucesso.`
            : `Acesso de "${usuario.nome}" desativado.`
        );
        refetch();
      } else {
        toast.error(res.message || "Não foi possível alterar o status do usuário.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar status do usuário.");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Gestão de Usuários & Permissões
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gerencie os administradores e operadores da empresa gestora com acesso ao painel
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2.5 rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleNovoUsuario}
              className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total de Usuários</p>
              <h3 className="text-lg font-bold font-display">{totalUsuarios}</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Usuários Ativos</p>
              <h3 className="text-lg font-bold font-display">
                {usuariosAtivos} <span className="text-xs font-normal text-muted-foreground">/ {totalUsuarios}</span>
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Administradores</p>
              <h3 className="text-lg font-bold font-display">{totalAdmins}</h3>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Operadores</p>
              <h3 className="text-lg font-bold font-display">{totalOperadores}</h3>
            </div>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou WhatsApp..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1 shadow-sm">
              {(
                [
                  { id: "todos", label: "Todos" },
                  { id: "admin", label: "Admins" },
                  { id: "operador", label: "Operadores" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    roleFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title="Visualização em Tabela"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabela</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === "cards"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title="Visualização em Cards"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Users Table / Cards */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Carregando usuários cadastrados...</p>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-border text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Nenhum usuário encontrado</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Ajuste os filtros de busca ou cadastre um novo membro da equipe.
              </p>
            </div>
          </div>
        ) : viewMode === "table" ? (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">E-mail de Login</th>
                    <th className="py-3 px-4">WhatsApp</th>
                    <th className="py-3 px-4 text-center">Perfil</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsuarios.map((u) => {
                    const isAdminRole = (u.role || "").toLowerCase() === "admin";
                    const isAtivo = u.ativo !== false;
                    const isSelf = Boolean(currentUserId && Number(u.id) === Number(currentUserId));

                    return (
                      <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs shrink-0 ${
                                isAdminRole
                                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                                  : "bg-primary/10 border-primary/20 text-primary"
                              }`}
                            >
                              {u.nome?.substring(0, 2).toUpperCase() || "US"}
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-foreground">{u.nome}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">#{u.id}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                  Você
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-foreground/90">{u.email}</td>

                        <td className="py-3 px-4 font-mono text-foreground/90">
                          {u.whatsapp ? formatPhone(u.whatsapp) : "—"}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] uppercase tracking-wider font-semibold border ${
                              isAdminRole
                                ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {isAdminRole ? "Admin" : "Operador"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              isAtivo
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {isAtivo ? "Ativo" : "Inativo"}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditarUsuario(u)}
                              className="py-1.5 px-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Settings className="w-3.5 h-3.5" />
                              <span>Editar / Senha</span>
                            </button>

                            <button
                              onClick={() => handleToggleAtivo(u)}
                              disabled={isSelf || togglingId === u.id}
                              className={`p-1.5 rounded-lg border transition-colors ${
                                isSelf
                                  ? "border-border text-muted-foreground/40 cursor-not-allowed"
                                  : isAtivo
                                  ? "border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                                  : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                              }`}
                              title={
                                isSelf
                                  ? "Você não pode desativar sua própria conta"
                                  : isAtivo
                                  ? "Desativar acesso do usuário"
                                  : "Reativar acesso do usuário"
                              }
                            >
                              {togglingId === u.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Power className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsuarios.map((u) => {
              const isAdminRole = (u.role || "").toLowerCase() === "admin";
              const isAtivo = u.ativo !== false;
              const isSelf = Boolean(currentUserId && Number(u.id) === Number(currentUserId));

              return (
                <div
                  key={u.id}
                  className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Avatar + Name + Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shrink-0 ${
                            isAdminRole
                              ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400"
                              : "bg-primary/10 border-primary/20 text-primary"
                          }`}
                        >
                          {u.nome?.substring(0, 2).toUpperCase() || "US"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-bold text-foreground font-display truncate">
                              {u.nome}
                            </h3>
                            <span className="text-[10px] font-mono text-muted-foreground">#{u.id}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                                Você
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-mono uppercase tracking-wider font-semibold border ${
                                isAdminRole
                                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                              }`}
                            >
                              {isAdminRole ? "Admin" : "Operador"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 ${
                          isAtivo
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {isAtivo ? "Ativo" : "Inativo"}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-xs text-muted-foreground pt-3 border-t border-border/60">
                      <p className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-foreground/90">{u.email}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-mono text-foreground/90">
                          {u.whatsapp ? formatPhone(u.whatsapp) : "—"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-border flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleEditarUsuario(u)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Editar / Senha
                    </button>

                    <button
                      onClick={() => handleToggleAtivo(u)}
                      disabled={isSelf || togglingId === u.id}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        isSelf
                          ? "border-border text-muted-foreground/40 cursor-not-allowed"
                          : isAtivo
                          ? "border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                          : "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20"
                      }`}
                      title={
                        isSelf
                          ? "Você não pode desativar sua própria conta"
                          : isAtivo
                          ? "Desativar acesso do usuário"
                          : "Reativar acesso do usuário"
                      }
                    >
                      {togglingId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <UsuarioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => refetch()}
        usuario={selectedUsuario}
      />
    </div>
  );
}

