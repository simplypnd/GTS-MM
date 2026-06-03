"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Message, ParticipantRole } from "@/lib/types/database";

export function DealChat({
  dealId,
  currentUserId,
  senderRole,
}: {
  dealId: string;
  currentUserId: string;
  senderRole: ParticipantRole;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    }
    load();

    const channel = supabase
      .channel(`deal:${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `deal_id=eq.${dealId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      deal_id: dealId,
      sender_id: currentUserId,
      sender_role: senderRole,
      body: body.trim(),
      is_system: false,
    });
    if (!error) setBody("");
    setSending(false);
  }

  return (
    <div className="flex h-96 flex-col rounded-xl border border-zinc-200 bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.is_system
                ? "text-center text-xs text-zinc-500 italic"
                : m.sender_id === currentUserId
                  ? "ml-8 text-right"
                  : "mr-8"
            }
          >
            {!m.is_system && m.sender_role && (
              <Badge variant="default" className="mb-1 mr-1 capitalize">
                {m.sender_role}
              </Badge>
            )}
            <p
              className={
                m.is_system
                  ? ""
                  : m.sender_id === currentUserId
                    ? "inline-block rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white"
                    : "inline-block rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900"
              }
            >
              {m.body}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t p-3">
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          disabled={sending}
        />
        <Button type="submit" disabled={sending}>
          Send
        </Button>
      </form>
    </div>
  );
}
