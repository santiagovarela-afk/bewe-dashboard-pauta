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

/** Comentarios de un post IG (incluye replies anidadas). */
export async function fetchIGComments(mediaId: string, post?: IGPost): Promise<Comment[]> {
  const res = await metaCall({
    endpoint: `${mediaId}/comments`,
    params: {
      fields: "id,text,username,timestamp,parent_id,from",
      limit: 100,
    },
  });
  if (!res.ok) return [];
  const data = res.data as { data?: Array<Omit<Comment, "platform" | "post_id">> };
  const comments = data.data ?? [];
  return comments.map((c) => ({
    ...c,
    platform: "ig" as const,
    post_id: mediaId,
    post_caption: post?.caption,
    post_permalink: post?.permalink,
  }));
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

/** Comentarios de un post FB. */
export async function fetchFBComments(postId: string, post?: FBPost): Promise<Comment[]> {
  const res = await metaCall({
    endpoint: `${postId}/comments`,
    params: {
      fields: "id,message,from,created_time,parent",
      limit: 100,
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
    }>;
  };
  return (data.data ?? []).map((c) => ({
    id: c.id,
    text: c.message ?? "",
    from: c.from,
    created_time: c.created_time,
    parent_id: c.parent?.id,
    platform: "fb" as const,
    post_id: postId,
    post_caption: post?.message,
    post_permalink: post?.permalink_url,
  }));
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

/** Lista de conversaciones de Messenger en la página FB. */
export async function fetchMessengerConversations(limit = 25): Promise<Conversation[]> {
  const res = await metaCall({
    endpoint: `${PLAN.meta.pageId}/conversations`,
    params: {
      platform: "messenger",
      fields: "id,updated_time,message_count,unread_count,participants,snippet",
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
