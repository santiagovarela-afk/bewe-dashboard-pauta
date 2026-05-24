"use client";
import * as React from "react";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ThumbsUp,
  Share2,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewPlatform = "ig" | "fb" | "reel" | "story";

interface PostPreviewProps {
  platform: PreviewPlatform;
  caption: string;
  imageUrl?: string;
  /** Username override. Default @bewe_software. */
  username?: string;
  /** Followers humanizado (ej "50k"). */
  followers?: string;
  className?: string;
}

/**
 * Mockup visual de cómo se vería el post publicado.
 * NO publica · solo previsualización fiel a la UI de cada plataforma.
 *
 * Soporta:
 *   - ig: feed cuadrado 1:1
 *   - reel: 9:16 con UI de Reels
 *   - story: 9:16 efímero
 *   - fb: feed 16:9 con reacciones
 */
export function PostPreview({
  platform,
  caption,
  imageUrl,
  username = "bewe_software",
  followers = "50k",
  className,
}: PostPreviewProps) {
  return (
    <div className={cn("w-full", className)}>
      {platform === "ig" && (
        <InstagramFeedMock
          caption={caption}
          imageUrl={imageUrl}
          username={username}
          followers={followers}
        />
      )}
      {platform === "fb" && (
        <FacebookFeedMock
          caption={caption}
          imageUrl={imageUrl}
          username={username}
        />
      )}
      {platform === "reel" && (
        <ReelMock caption={caption} imageUrl={imageUrl} username={username} />
      )}
      {platform === "story" && (
        <StoryMock caption={caption} imageUrl={imageUrl} username={username} />
      )}
    </div>
  );
}

function Avatar({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-gradient-to-br from-[hsl(var(--brand-violet))] via-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-lime))] ring-2 ring-white/80 shrink-0"
    />
  );
}

function ImageOrPlaceholder({
  src,
  aspect = "aspect-square",
  rounded = false,
}: {
  src?: string;
  aspect?: string;
  rounded?: boolean;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt="preview"
        className={cn(
          aspect,
          "w-full object-cover bg-secondary",
          rounded && "rounded-lg",
        )}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div
      className={cn(
        aspect,
        "w-full bg-gradient-to-br from-secondary to-secondary/40 grid place-items-center text-muted-foreground/40",
        rounded && "rounded-lg",
      )}
    >
      <ImageIcon className="size-10" />
    </div>
  );
}

function truncateForVerMas(text: string, words = 18): { visible: string; truncated: boolean } {
  const w = text.trim().split(/\s+/);
  if (w.length <= words) return { visible: text, truncated: false };
  return { visible: w.slice(0, words).join(" "), truncated: true };
}

function InstagramFeedMock({
  caption,
  imageUrl,
  username,
  followers,
}: {
  caption: string;
  imageUrl?: string;
  username: string;
  followers: string;
}) {
  const { visible, truncated } = truncateForVerMas(caption, 22);
  return (
    <div className="rounded-xl border border-border/60 bg-white text-black overflow-hidden shadow-sm max-w-[420px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar size={32} />
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-semibold flex items-center gap-1 truncate">
            {username}
            <span className="text-[10px] text-neutral-500 font-normal">
              · {followers} seguidores
            </span>
          </div>
          <div className="text-[10px] text-neutral-500">Publicación · Bewe.io</div>
        </div>
        <MoreHorizontal className="size-4 text-neutral-700" />
      </div>
      {/* Image */}
      <ImageOrPlaceholder src={imageUrl} aspect="aspect-square" />
      {/* Actions */}
      <div className="px-3 pt-2.5 pb-1 flex items-center gap-3">
        <Heart className="size-5 text-neutral-800" />
        <MessageCircle className="size-5 text-neutral-800" />
        <Send className="size-5 text-neutral-800" />
        <Bookmark className="size-5 text-neutral-800 ml-auto" />
      </div>
      <div className="px-3 text-[11px] font-semibold text-neutral-800">
        1,284 Me gusta
      </div>
      {/* Caption */}
      <div className="px-3 py-2 text-[11px] leading-relaxed text-neutral-800">
        <span className="font-semibold mr-1.5">{username}</span>
        <span className="whitespace-pre-wrap">{visible || "(sin caption)"}</span>
        {truncated && (
          <button className="text-neutral-500 ml-1">… más</button>
        )}
      </div>
      <div className="px-3 pb-3 text-[10px] text-neutral-500">
        Ver los 47 comentarios · hace 3 min
      </div>
    </div>
  );
}

function FacebookFeedMock({
  caption,
  imageUrl,
  username,
}: {
  caption: string;
  imageUrl?: string;
  username: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-white text-black overflow-hidden shadow-sm max-w-[460px] mx-auto">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar size={36} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold flex items-center gap-1 truncate">
            {username.replace(/_/g, " ")}
            <span className="text-blue-600 text-[10px]">✓</span>
          </div>
          <div className="text-[10px] text-neutral-500">
            Ahora · <span className="inline-block">🌎</span>
          </div>
        </div>
        <MoreHorizontal className="size-4 text-neutral-700" />
      </div>
      <div className="px-3 pb-2 text-[12px] leading-relaxed whitespace-pre-wrap text-neutral-800">
        {caption || "(sin caption)"}
      </div>
      <ImageOrPlaceholder src={imageUrl} aspect="aspect-[16/9]" />
      <div className="px-3 py-2 border-t border-neutral-100 mt-1 flex items-center justify-between text-[10px] text-neutral-500">
        <span>👍❤️🎉 312</span>
        <span>28 comentarios · 12 compartidos</span>
      </div>
      <div className="px-2 py-1 grid grid-cols-3 border-t border-neutral-100">
        {[
          { i: <ThumbsUp className="size-4" />, l: "Me gusta" },
          { i: <MessageCircle className="size-4" />, l: "Comentar" },
          { i: <Share2 className="size-4" />, l: "Compartir" },
        ].map((b) => (
          <button
            key={b.l}
            className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-neutral-600 hover:bg-neutral-100 rounded"
          >
            {b.i} {b.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReelMock({
  caption,
  imageUrl,
  username,
}: {
  caption: string;
  imageUrl?: string;
  username: string;
}) {
  const { visible } = truncateForVerMas(caption, 14);
  return (
    <div className="rounded-2xl border border-border/60 bg-black overflow-hidden shadow-lg max-w-[260px] mx-auto relative">
      <ImageOrPlaceholder src={imageUrl} aspect="aspect-[9/16]" />
      {/* Right action stack */}
      <div className="absolute right-2 bottom-20 flex flex-col items-center gap-3 text-white">
        <div className="flex flex-col items-center">
          <Heart className="size-6 drop-shadow" />
          <span className="text-[9px] font-semibold">12.4k</span>
        </div>
        <div className="flex flex-col items-center">
          <MessageCircle className="size-6 drop-shadow" />
          <span className="text-[9px] font-semibold">348</span>
        </div>
        <div className="flex flex-col items-center">
          <Send className="size-6 drop-shadow" />
          <span className="text-[9px] font-semibold">112</span>
        </div>
        <div className="flex flex-col items-center">
          <Bookmark className="size-6 drop-shadow" />
        </div>
      </div>
      {/* Bottom caption */}
      <div className="absolute bottom-0 left-0 right-12 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
        <div className="text-[11px] font-semibold mb-1">@{username}</div>
        <div className="text-[10px] leading-snug whitespace-pre-wrap line-clamp-3">
          {visible || "(sin caption)"}
        </div>
      </div>
      {/* Reels badge top */}
      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur rounded-full p-1.5">
        <span className="text-white text-[9px] font-bold">REELS</span>
      </div>
    </div>
  );
}

function StoryMock({
  caption,
  imageUrl,
  username,
}: {
  caption: string;
  imageUrl?: string;
  username: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-black overflow-hidden shadow-lg max-w-[240px] mx-auto relative">
      <ImageOrPlaceholder src={imageUrl} aspect="aspect-[9/16]" />
      {/* Progress bar */}
      <div className="absolute top-1.5 left-2 right-2 flex gap-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={cn(
              "h-0.5 flex-1 rounded-full",
              s === 1 ? "bg-white" : "bg-white/30",
            )}
          />
        ))}
      </div>
      {/* Header */}
      <div className="absolute top-4 left-2 right-2 flex items-center gap-2">
        <Avatar size={24} />
        <div className="text-white text-[10px] font-semibold drop-shadow">
          {username}
        </div>
        <div className="text-white/70 text-[9px] drop-shadow">hace 1m</div>
      </div>
      {/* Caption overlay */}
      <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 text-center">
        <div className="bg-white/90 text-black rounded px-2 py-1 text-[11px] font-semibold leading-snug whitespace-pre-wrap line-clamp-6">
          {caption.trim() || "Tu texto sobre imagen"}
        </div>
      </div>
      {/* Reply bar */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5">
        <div className="flex-1 border border-white/60 rounded-full px-2.5 py-1 text-white/80 text-[9px]">
          Enviar mensaje
        </div>
        <Heart className="size-4 text-white" />
        <Send className="size-4 text-white" />
      </div>
    </div>
  );
}
