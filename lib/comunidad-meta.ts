/**
 * Comunidad · helpers Meta Graph API para el módulo de redes sociales.
 *
 * Capa de alto nivel sobre `metaCall()`. Conoce los endpoints específicos
 * de comentarios (IG + FB) y conversaciones Messenger.
 *
 * Tokens:
 *  - IG media + comentarios IG → System User Token (via metaCall)
 *  - FB posts + comentarios FB + Messenger → Page Access Token (auto-derivado)
 */
import { metaCall } from "./meta-api";
import { PLAN } from "./config";

// ─── TIPOS ─────────────────────────────────────────────────────────────────

export interface IGPost {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM" | string;
  permalink?: string;
  timestamp: string;
  comments_count: number;
  like_count: number;
  thumbnail_url?: string;
  media_url?: string;
}

export interface FBPost {
  id: string;
  message?: string;
  created_time: string;
  permalink_url?: string;
  comments_count: number;
  full_picture?: string;
}

export interface Comment {
  id: string;
  text: string;
  username?: string;
  from?: { name?: string; id?: string };
  timestamp?: string;
  created_time?: string;
  parent_id?: string;
  platform: "ig" | "fb";
  post_id: string;
  post_caption?: string;
  post_permalink?: string;
  /** Respuestas anidadas (replies/comments) al comentario. */
  replies?: Comment[];
  /** True si al menos una reply es de Bewe Software / @bewe_software. */
  respondedByBewe?: boolean;
  /** Texto de la respuesta más reciente de Bewe (preview). */
  beweReplyText?: string;
}

/** Determina si un autor (from/username) es Bewe. */
function isFromBewe(from?: { name?: string; id?: string }, username?: string): boolean {
  if (username === "bewe_software" || username === "bewesoftware") return true;
  if (!from) return false;
  const name = (from.name ?? "").toLowerCase();
  if (name.includes("bewe")) return true;
  // Page ID de Bewe Software
  if (from.id === PLAN.meta.pageId) return true;
  return false;
}

export interface Conversation {
  id: string;
  updated_time: string;
  message_count: number;
  unread_count: number;
  participants?: { data: Array<{ id: string; name?: string }> };
  snippet?: string;
}

export interface Message {
  id: string;
  message?: string;
  from?: { id: string; name?: string };
  to?: { data: Array<{ id: string; name?: string }> };
  created_time: string;
}

// ─── INSTAGRAM ─────────────────────────────────────────────────────────────

/** Lista de posts/reels del feed IG @bewe_software con conteo de comentarios. */
export async function fetchIGPosts(limit = 25): Promise<IGPost[]> {
  const res = await metaCall({
    endpoint: `${PLAN.meta.igAccountId}/media`,
    params: {
      fields:
        "id,caption,media_type,permalink,timestamp,comments_count,like_count,thumbnail_url,media_url",
      limit,
    },
  });
  if (!res.ok) return [];
  const data = res.data as { data?: IGPost[] };
  return data.data ?? [];
}

/** Comentarios de un post IG · incluye replies anidadas y flag de respondido por Bewe. */
export async function fetchIGComments(mediaId: string, post?: IGPost): Promise<Comment[]> {
  const res = await metaCall({
    endpoint: `${mediaId}/comments`,
    params: {
      fields:
        "id,text,username,timestamp,parent_id,from,replies{id,text,username,timestamp,from}",
      limit: 100,
    },
  });
  if (!res.ok) return [];
  const data = res.data as {
    data?: Array<
      Omit<Comment, "platform" | "post_id" | "replies" | "respondedByBewe" | "beweReplyText"> & {
        replies?: { data?: Array<{ id: string; text?: string; username?: string; timestamp?: string; from?: { name?: string; id?: string } }> };
      }
    >;
  };
  const comments = data.data ?? [];
  return comments.map((c) => {
    const replies: Comment[] = (c.replies?.data ?? []).map((r) => ({
      id: r.id,
      text: r.text ?? "",
      username: r.username,
      from: r.from,
      timestamp: r.timestamp,
      parent_id: c.id,
      platform: "ig" as const,
      post_id: mediaId,
    }));
    const beweReplies = replies.filter((r) => isFromBewe(r.from, r.username));
    return {
      ...c,
      platform: "ig" as const,
      post_id: mediaId,
      post_caption: post?.caption,
      post_permalink: post?.permalink,
      replies,
      respondedByBewe: beweReplies.length > 0,
      beweReplyText: beweReplies[beweReplies.length - 1]?.text,
    };
  });
}

/** Responde a un comentario IG (crea un reply anidado). */
export async function replyToIGComment(commentId: string, message: string) {
  return metaCall({
    endpoint: `${commentId}/replies`,
    method: "POST",
    body: { message },
  });
}

// ─── FACEBOOK ──────────────────────────────────────────────────────────────

/** Posts publicados en la página FB Bewe Software. */
export async function fetchFBPosts(limit = 25): Promise<FBPost[]> {
  const res = await metaCall({
    endpoint: `${PLAN.meta.pageId}/feed`,
    params: {
      fields:
        "id,message,created_time,permalink_url,full_picture,comments.limit(0).summary(true)",
      limit,
    },
  });
  if (!res.ok) return [];
  const data = res.data as {
    data?: Array<
      FBPost & { comments?: { summary?: { total_count?: number } } }
    >;
  };
  return (data.data ?? []).map((p) => ({
    ...p,
    comments_count: p.comments?.summary?.total_count ?? 0,
  }));
}

/** Comentarios de un post FB · incluye replies anidadas y flag de respondido por Bewe. */
export async function fetchFBComments(postId: string, post?: FBPost): Promise<Comment[]> {
  const res = await metaCall({
    endpoint: `${postId}/comments`,
    params: {
      fields:
        "id,message,from,created_time,parent,comments{id,message,from,created_time}",
      limit: 100,
      filter: "stream", // trae también comentarios anidados
    },
  });
  if (!res.ok) return [];
  const data = res.data as {
    data?: Array<{
      id: string;
      message?: string;
      from?: { name?: string; id?: string };
      created_time?: string;
      parent?: { id?: string };
      comments?: { data?: Array<{ id: string; message?: string; from?: { name?: string; id?: string }; created_time?: string }> };
    }>;
  };
  return (data.data ?? [])
    .filter((c) => !c.parent) // descartar replies (vienen como top-level con parent.id en filter=stream)
    .map((c) => {
      const replies: Comment[] = (c.comments?.data ?? []).map((r) => ({
        id: r.id,
        text: r.message ?? "",
        from: r.from,
        created_time: r.created_time,
        parent_id: c.id,
        platform: "fb" as const,
        post_id: postId,
      }));
      const beweReplies = replies.filter((r) => isFromBewe(r.from));
      return {
        id: c.id,
        text: c.message ?? "",
        from: c.from,
        created_time: c.created_time,
        parent_id: c.parent?.id,
        platform: "fb" as const,
        post_id: postId,
        post_caption: post?.message,
        post_permalink: post?.permalink_url,
        replies,
        respondedByBewe: beweReplies.length > 0,
        beweReplyText: beweReplies[beweReplies.length - 1]?.text,
      };
    });
}

/** Responde a un comentario FB (puede ser comentario raíz o reply). */
export async function replyToFBComment(commentId: string, message: string) {
  return metaCall({
    endpoint: `${commentId}/comments`,
    method: "POST",
    body: { message },
  });
}

// ─── MESSENGER ─────────────────────────────────────────────────────────────

/** Lista de conversaciones de Messenger en la página FB.
 *
 * Incluye `messages.limit(1){from,created_time,id}` para que el frontend pueda
 * distinguir conversaciones REALMENTE sin responder (último msg del cliente)
 * vs ya respondidas (último msg de la página = Bewe). Sin esto, contábamos
 * todas como "pendientes" → conteo inflado.
 */
export async function fetchMessengerConversations(limit = 25): Promise<Conversation[]> {
  const res = await metaCall({
    endpoint: `${PLAN.meta.pageId}/conversations`,
    params: {
      platform: "messenger",
      fields:
        "id,updated_time,message_count,unread_count,participants,snippet,messages.limit(1){from,created_time,id}",
      limit,
    },
  });
  if (!res.ok) return [];
  const data = res.data as { data?: Conversation[] };
  return data.data ?? [];
}

/** Mensajes dentro de una conversación. */
export async function fetchConversationMessages(conversationId: string): Promise<Message[]> {
  const res = await metaCall({
    endpoint: `${conversationId}/messages`,
    params: {
      fields: "id,message,from,to,created_time",
      limit: 50,
    },
  });
  if (!res.ok) return [];
  const data = res.data as { data?: Message[] };
  return data.data ?? [];
}

/** Envía un mensaje al receptor desde la página (Messenger window 24h aplica). */
export async function sendMessengerMessage(recipientId: string, message: string) {
  return metaCall({
    endpoint: "me/messages",
    method: "POST",
    body: {
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: "RESPONSE",
    },
  });
}

/**
 * Envía un Private Reply (DM directo desde un comentario público en Facebook).
 *
 * Meta permite responder al autor de un comentario público con un DM privado
 * usando Page Token + endpoint /{comment-id}/private_replies. SOLO funciona
 * dentro de los primeros 7 días después del comentario y solo UNA vez por
 * comentario.
 *
 * Para Instagram el endpoint funciona similar pero requiere el scope
 * `instagram_manage_messages` que actualmente NO tenemos. En IG, el frontend
 * debería abrir un link a ig.me/m/{username} en lugar de llamar a este
 * endpoint.
 */
export async function sendFBPrivateReply(commentId: string, message: string) {
  return metaCall({
    endpoint: `${commentId}/private_replies`,
    method: "POST",
    body: { message },
  });
}

// ─── ADS · DARK POSTS ──────────────────────────────────────────────────────

export interface AdPost {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  effective_object_story_id: string; // formato pageId_postId
  status: string;
  effective_status: string;
}

/**
 * Lista todos los ads ACTIVOS con su post_id asociado.
 * Devuelve objetos con: ad_id, ad_name, campaign_id, campaign_name,
 * effective_object_story_id.
 *
 * Esto permite traer los comentarios de "dark posts" (publicaciones que solo
 * aparecen como anuncios y no están en el feed orgánico de la página).
 */
export async function fetchActiveAdsWithPosts(): Promise<AdPost[]> {
  // OJO Meta: `effective_object_story_id` NO está disponible a nivel `ad`,
  // solo dentro de `creative{...}`. Antes pedíamos directo y siempre devolvía
  // null — todos los ads se filtraban y "Comentarios Pauta" salía vacío.
  const res = await metaCall({
    endpoint: `${PLAN.meta.accountId}/ads`,
    params: {
      fields:
        "id,name,campaign_id,campaign{name},creative{effective_object_story_id,object_type},status,effective_status",
      effective_status: '["ACTIVE"]',
      limit: 200,
    },
  });
  if (!res.ok) return [];
  const data = res.data as {
    data?: Array<{
      id: string;
      name?: string;
      campaign_id?: string;
      campaign?: { name?: string };
      creative?: { effective_object_story_id?: string; object_type?: string };
      status: string;
      effective_status: string;
    }>;
  };
  return (data.data ?? [])
    .filter((a) => !!a.creative?.effective_object_story_id)
    .map((a) => ({
      ad_id: a.id,
      ad_name: a.name ?? "Anuncio sin nombre",
      campaign_id: a.campaign_id ?? "",
      campaign_name: a.campaign?.name ?? "Campaña sin nombre",
      effective_object_story_id: a.creative!.effective_object_story_id!,
      status: a.status,
      effective_status: a.effective_status,
    }));
}
