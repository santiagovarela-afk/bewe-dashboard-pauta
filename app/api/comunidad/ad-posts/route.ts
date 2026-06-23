import { NextRequest, NextResponse } from "next/server";
import { fetchActiveAdsWithPosts } from "@/lib/comunidad-meta";
import { metaCall } from "@/lib/meta-api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AdPostEnriched {
  ad_id: string;
  ad_name: string;
  campaign_id: string;
  campaign_name: string;
  post_id: string;
  platform: "fb" | "ig";
  // Datos del post enriquecidos
  message?: string;
  caption?: string;
  created_time?: string;
  permalink_url?: string;
  full_picture?: string;
  thumbnail_url?: string;
  comments_count?: number;
  like_count?: number;
}

/**
 * GET /api/comunidad/ad-posts
 *
 * Lista los posts asociados a anuncios ACTIVOS de la cuenta. Cada uno trae
 * datos enriquecidos del post (texto, imagen, comments_count) listos para
 * que el frontend muestre la UI de "Comentarios Pauta".
 *
 * Detecta automáticamente si el post es de Facebook (page_id_post_id) o
 * Instagram (id puro de IG media).
 */
export async function GET(_req: NextRequest) {
  try {
    const ads = await fetchActiveAdsWithPosts();
    if (ads.length === 0) {
      return NextResponse.json({ ok: true, posts: [] });
    }

    // Dedupe por post_id (varios ads pueden referenciar el mismo post)
    const uniquePostIds = Array.from(new Set(ads.map((a) => a.effective_object_story_id)));

    // Enriquecer cada post con sus datos reales
    const enriched: AdPostEnriched[] = await Promise.all(
      uniquePostIds.map(async (postId) => {
        const ad = ads.find((a) => a.effective_object_story_id === postId)!;
        const platform: "fb" | "ig" = postId.includes("_") ? "fb" : "ig";

        // Para FB (postId tiene formato pageId_postId)
        if (platform === "fb") {
          const r = await metaCall({
            endpoint: postId,
            params: {
              fields:
                "id,message,created_time,permalink_url,full_picture,comments.limit(0).summary(true)",
            },
          });
          if (!r.ok) {
            return {
              ad_id: ad.ad_id,
              ad_name: ad.ad_name,
              campaign_id: ad.campaign_id,
              campaign_name: ad.campaign_name,
              post_id: postId,
              platform,
            };
          }
          const d = r.data as {
            id?: string;
            message?: string;
            created_time?: string;
            permalink_url?: string;
            full_picture?: string;
            comments?: { summary?: { total_count?: number } };
          };
          return {
            ad_id: ad.ad_id,
            ad_name: ad.ad_name,
            campaign_id: ad.campaign_id,
            campaign_name: ad.campaign_name,
            post_id: postId,
            platform,
            message: d.message,
            created_time: d.created_time,
            permalink_url: d.permalink_url,
            full_picture: d.full_picture,
            comments_count: d.comments?.summary?.total_count ?? 0,
          };
        }

        // IG media
        const r = await metaCall({
          endpoint: postId,
          params: {
            fields:
              "id,caption,media_type,timestamp,permalink,thumbnail_url,media_url,comments_count,like_count",
          },
        });
        if (!r.ok) {
          return {
            ad_id: ad.ad_id,
            ad_name: ad.ad_name,
            campaign_id: ad.campaign_id,
            campaign_name: ad.campaign_name,
            post_id: postId,
            platform,
          };
        }
        const d = r.data as {
          caption?: string;
          timestamp?: string;
          permalink?: string;
          thumbnail_url?: string;
          media_url?: string;
          comments_count?: number;
          like_count?: number;
        };
        return {
          ad_id: ad.ad_id,
          ad_name: ad.ad_name,
          campaign_id: ad.campaign_id,
          campaign_name: ad.campaign_name,
          post_id: postId,
          platform,
          caption: d.caption,
          created_time: d.timestamp,
          permalink_url: d.permalink,
          thumbnail_url: d.thumbnail_url || d.media_url,
          comments_count: d.comments_count ?? 0,
          like_count: d.like_count,
        };
      }),
    );

    // Ordenar por comentarios desc
    enriched.sort((a, b) => (b.comments_count ?? 0) - (a.comments_count ?? 0));

    return NextResponse.json({ ok: true, posts: enriched, totalAds: ads.length });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 },
    );
  }
}
