import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLojas } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { MetricsSLASection } from "@/components/dashboard/MetricsSLASection";
import { Sparkles } from "lucide-react";

export default function CriativosPage() {
  const [selectedLojaId, setSelectedLojaId] = useState<number | null>(null);

  const { data: lojas = [] } = useQuery({
    queryKey: ["lojas"],
    queryFn: getLojas,
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Header da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-500" />
              Relatório de Criativos & Tempo de Resposta (SLA)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Análise detalhada de performance por anúncio (Meta Ads & Google Ads), volume de leads e velocidade de atendimento
            </p>
          </div>
        </div>

        {/* Componente de Métricas e Tabela de Criativos */}
        <MetricsSLASection
          lojas={lojas}
          selectedLojaId={selectedLojaId}
          onSelectLojaId={setSelectedLojaId}
        />
      </main>
    </div>
  );
}
