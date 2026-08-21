import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createTransactionalEmail, type TransactionalEmailData, type TransactionalEmailEvent } from "@/lib/email/templates";

const permittedEvents: TransactionalEmailEvent[] = ["registration_confirmation", "deposit_received", "deposit_approved", "deposit_rejected", "withdrawal_received", "withdrawal_approved", "withdrawal_rejected", "kyc_pending", "kyc_approved", "kyc_rejected"];
const staffEvents: TransactionalEmailEvent[] = ["deposit_approved", "deposit_rejected", "withdrawal_approved", "withdrawal_rejected", "kyc_approved", "kyc_rejected"];

export async function POST(request: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiKey || !from || !url || !publishableKey) return NextResponse.json({ delivered: false, reason: "Email delivery is not configured." }, { status: 202 });

  const body = await request.json() as { event?: TransactionalEmailEvent; clientId?: string; data?: TransactionalEmailData };
  if (!body.event || !permittedEvents.includes(body.event)) return NextResponse.json({ error: "Unsupported email event." }, { status: 400 });
  const admin = createClient(url, serviceKey ?? "", { auth: { persistSession: false, autoRefreshToken: false } });
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  let actorId: string | undefined;
  let actorEmail: string | undefined;
  let actorFirstName: string | undefined;
  if (token) {
    const auth = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user } } = await auth.auth.getUser(token);
    actorId = user?.id;
    actorEmail = user?.email;
    actorFirstName = typeof user?.user_metadata.first_name === "string" ? user.user_metadata.first_name : undefined;
  }

  let recipientId = body.clientId || actorId;
  if (body.event === "registration_confirmation") recipientId = body.clientId;
  if (!recipientId) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  if (staffEvents.includes(body.event)) {
    if (!serviceKey) return NextResponse.json({ delivered: false, reason: "Staff email delivery is not configured." }, { status: 202 });
    if (!actorId) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
    const { data: actorProfile } = await admin.from("profiles").select("role").eq("id", actorId).maybeSingle();
    if (!actorProfile || !["super_admin", "compliance", "operations", "support", "admin", "staff"].includes(actorProfile.role)) return NextResponse.json({ error: "Staff access is required." }, { status: 403 });
  } else if (body.event !== "registration_confirmation" && recipientId !== actorId) return NextResponse.json({ error: "You may only notify your own account." }, { status: 403 });

  let email = recipientId === actorId ? actorEmail : undefined;
  let firstName = recipientId === actorId ? actorFirstName : undefined;
  if (!email) {
    if (!serviceKey) return NextResponse.json({ delivered: false, reason: "Customer lookup is not configured." }, { status: 202 });
    const [{ data: authUser, error: authUserError }, { data: profile }] = await Promise.all([
      admin.auth.admin.getUserById(recipientId),
      admin.from("profiles").select("first_name").eq("id", recipientId).maybeSingle(),
    ]);
    if (authUserError) console.error("Transactional email customer lookup failed", authUserError.message);
    email = authUser.user?.email;
    firstName = profile?.first_name ?? firstName;
  }
  if (!email) return NextResponse.json({ error: "Customer email address not found." }, { status: 404 });
  const template = createTransactionalEmail(body.event, firstName, body.data);
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [email], subject: template.subject, html: template.html }) });
  if (!response.ok) return NextResponse.json({ error: "Email provider rejected delivery." }, { status: 502 });
  return NextResponse.json({ delivered: true });
}
