import React, { useState, useEffect } from "react";
import { User, UserRole } from "@/types/auth";
import { saveUsuario } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  X,
  UserPlus,
  UserCog,
  Mail,
  Phone,
  Lock,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  usuario?: User | null;
}

export function UsuarioModal({ isOpen, onClose, onSaved, usuario }: UsuarioModalProps) {
  const { user: currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("operador");
  const [ativo, setAtivo] = useState(true);

  const isEditing = Boolean(usuario?.id);
  const currentUserId = currentUser?.user_id || currentUser?.id;
  const isSelf = Boolean(isEditing && usuario?.id && currentUserId && Number(usuario.id) === Number(currentUserId));

  useEffect(() => {
    if (!isOpen) return;

    setShowPassword(false);
    setPassword("");

    if (usuario) {
      setNome(usuario.nome || "");
      setEmail(usuario.email || "");
      setWhatsapp(usuario.whatsapp || "");
      setRole((usuario.role?.toLowerCase() === "admin" ? "admin" : "operador") as UserRole);
      setAtivo(usuario.ativo ?? true);
    } else {
      setNome("");
      setEmail("");
      setWhatsapp("");
      setRole("operador");
      setAtivo(true);
    }
  }, [isOpen, usuario]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNome = nome.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanWhatsapp = whatsapp.replace(/\D/g, "");

    if (!cleanNome) {
      toast.error("Informe o nome completo do usuário.");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Informe um endereço de e-mail válido.");
      return;
    }

    if (!cleanWhatsapp || cleanWhatsapp.length < 10) {
      toast.error("Informe um número de WhatsApp válido com DDD (mínimo 10 dígitos).");
      return;
    }

    if (!isEditing && password.length < 6) {
      toast.error("A senha inicial deve ter pelo menos 6 caracteres.");
      return;
    }

    if (isEditing && password.length > 0 && password.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await saveUsuario({
        id: usuario?.id,
        nome: cleanNome,
        email: cleanEmail,
        whatsapp: cleanWhatsapp,
        password: password || undefined,
        role: isSelf ? "admin" : role,
        ativo: isSelf ? true : ativo,
      });

      if (res.ok) {
        toast.success(
          res.message || (isEditing ? "Usuário atualizado com sucesso!" : "Usuário criado com sucesso!")
        );
        onSaved();
        onClose();
      } else {
        toast.error(res.message || "Erro ao salvar usuário.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao comunicar com o servidor.";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              {isEditing ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-foreground">
                {isEditing ? `Editar Usuário #${usuario?.id}` : "Novo Usuário"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Atualize os dados, permissões ou redefina a senha de acesso"
                  : "Cadastre um novo administrador ou operador na empresa gestora"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {isSelf && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Você está editando sua própria conta. Por segurança, seu papel de <strong>Admin</strong> e status{" "}
                <strong>Ativo</strong> estão protegidos contra desativação acidental.
              </span>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Nome Completo <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: João Silva"
              required
              disabled={isSaving}
              className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* E-mail e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                E-mail de Login <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@agencia.com"
                required
                disabled={isSaving}
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                WhatsApp de Login <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="5511999998888"
                required
                disabled={isSaving}
                className="w-full px-3.5 py-2 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary font-mono"
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                {isEditing ? "Nova Senha (opcional)" : "Senha de Acesso"}
                {!isEditing && <span className="text-destructive">*</span>}
              </span>
              {isEditing && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  Deixe em branco para manter a senha atual
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? "•••••••• (sem alteração)" : "Mínimo de 6 caracteres"}
                required={!isEditing}
                disabled={isSaving}
                className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-input bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Perfil de Acesso (Role) */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              Perfil de Permissão
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSaving || isSelf}
                onClick={() => setRole("operador")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === "operador"
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                } ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Operador</span>
                  {role === "operador" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Opera lojas, instâncias, contatos, chat e relatórios de SLA.
                </p>
              </button>

              <button
                type="button"
                disabled={isSaving || isSelf}
                onClick={() => setRole("admin")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === "admin"
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                } ${isSelf ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Administrador</span>
                  {role === "admin" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Acesso total à plataforma, incluindo gestão de usuários e permissões.
                </p>
              </button>
            </div>
          </div>

          {/* Status Ativo */}
          <div className="pt-2">
            <label
              className={`flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20 ${
                isSelf ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-muted/40"
              } transition-colors`}
            >
              <div>
                <span className="text-xs font-semibold text-foreground block">Acesso Ativo</span>
                <span className="text-[11px] text-muted-foreground">
                  Usuários inativos são bloqueados imediatamente no login
                </span>
              </div>
              <input
                type="checkbox"
                checked={ativo}
                disabled={isSaving || isSelf}
                onChange={(e) => setAtivo(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Criar Usuário"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

