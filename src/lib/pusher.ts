import { useEffect } from "react";
import Pusher from "pusher-js";
import { useQueryClient } from "@tanstack/react-query";

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || "4e686919b206ba5948cb";
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || "us2";

let pusherInstance: Pusher | null = null;

function getPusher(): Pusher | null {
  if (!PUSHER_KEY) return null;
  if (!pusherInstance) {
    pusherInstance = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });
  }
  return pusherInstance;
}

interface NovaMensagemPayload {
  loja_id: number;
  pessoa_id: number;
  mensagem_id?: number | null;
  message_id?: string;
  is_ad?: boolean;
  origem?: string;
}

/**
 * Hook para escutar eventos em tempo real do Pusher.
 * Quando chega nova mensagem:
 * 1. Invalida queries de contatos e métricas
 * 2. Invalida histórico de chat da pessoa específica
 */
export function useRealtimeNotifications(selectedLojaId?: number | null, activePessoaId?: number | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const pusher = getPusher();
    if (!pusher) return;

    // Canal geral para a gestora e canal isolado por loja se houver loja selecionada
    const channelsToListen: string[] = ["adswhats-global"];
    if (selectedLojaId) {
      channelsToListen.push(`loja-${selectedLojaId}`);
    }

    const subscribedChannels = channelsToListen.map((channelName) => {
      const channel = pusher.subscribe(channelName);

      channel.bind("nova-mensagem", (data: NovaMensagemPayload) => {
        // 1. Atualiza lista de contatos e métricas
        queryClient.invalidateQueries({ queryKey: ["contatos"] });
        queryClient.invalidateQueries({ queryKey: ["lojas"] });
        queryClient.invalidateQueries({ queryKey: ["metrics-sla"] });

        // 2. Se o chat aberto for o contato da mensagem, atualiza o chat instantaneamente
        if (data.pessoa_id && (!activePessoaId || activePessoaId === data.pessoa_id)) {
          queryClient.invalidateQueries({ queryKey: ["chat", data.pessoa_id] });
        }
      });

      return channel;
    });

    return () => {
      subscribedChannels.forEach((channel) => {
        channel.unbind_all();
        pusher.unsubscribe(channel.name);
      });
    };
  }, [queryClient, selectedLojaId, activePessoaId]);
}

