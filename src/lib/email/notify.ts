"use client";

import { createClient } from "@/lib/supabase/client";
import type { TransactionalEmailData, TransactionalEmailEvent } from "@/lib/email/templates";

export async function notifyCustomer(event: TransactionalEmailEvent, data: TransactionalEmailData = {}, clientId?: string) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  await fetch("/api/transactional-email", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify({ event, data, clientId }),
  });
}
