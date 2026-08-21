export type TransactionalEmailEvent =
  | "registration_confirmation"
  | "deposit_received"
  | "deposit_approved"
  | "withdrawal_received"
  | "withdrawal_approved"
  | "kyc_pending"
  | "kyc_approved";

export type TransactionalEmailData = { asset?: string; network?: string; amount?: string };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);

function layout(title: string, body: string, actionLabel = "Open client portal") {
  const portalUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.bwiginvest.com";
  return `<!doctype html><html><body style="margin:0;background:#edf3f1;color:#102433;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:36px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #d2dfda"><tr><td style="padding:34px 38px;background:#08292b;color:#ffffff"><p style="margin:0 0 8px;color:#a9d1c7;font-size:11px;font-weight:700;letter-spacing:1.8px">BETTER WEALTH INVESTMENT GROUP</p><h1 style="margin:0;font-size:28px;line-height:1.2">${title}</h1></td></tr><tr><td style="padding:34px 38px;font-size:15px;line-height:1.7">${body}<p style="margin:28px 0 4px"><a href="${portalUrl}/portal" style="display:inline-block;background:#0b3032;color:#ffffff;padding:13px 20px;text-decoration:none;font-weight:700">${actionLabel} →</a></p><p style="margin:28px 0 0;color:#66777a;font-size:12px">Better Wealth Investment Group<br/>Capital is at risk. This message is not investment advice.</p></td></tr></table></td></tr></table></body></html>`;
}

export function createTransactionalEmail(event: TransactionalEmailEvent, firstName?: string, data: TransactionalEmailData = {}) {
  const name = escapeHtml(firstName?.trim() || "there");
  const asset = escapeHtml([data.amount, data.asset, data.network].filter(Boolean).join(" · "));
  const details = asset ? `<strong>Submission details:</strong> ${asset}<br/>` : "";
  const messages: Record<TransactionalEmailEvent, { subject: string; title: string; body: string }> = {
    registration_confirmation: { subject: "Welcome to Better Wealth", title: "Your account has been created", body: `Hello ${name},<br/><br/>Your Better Wealth client account has been created. Please use the separate email-verification message to confirm your email address, then sign in securely.` },
    deposit_received: { subject: "We received your deposit submission", title: "Deposit submission received", body: `Hello ${name},<br/><br/>${details}Your deposit reference is awaiting manual review. We will update your client portal when the review is complete.` },
    deposit_approved: { subject: "Your deposit has been approved", title: "Deposit approved", body: `Hello ${name},<br/><br/>${details}Your deposit submission has been approved. Your client portal now reflects the current status.` },
    withdrawal_received: { subject: "We received your withdrawal request", title: "Withdrawal request received", body: `Hello ${name},<br/><br/>${details}Your request is awaiting manual review. We will never request your private key or seed phrase.` },
    withdrawal_approved: { subject: "Your withdrawal request has been approved", title: "Withdrawal request approved", body: `Hello ${name},<br/><br/>${details}Your request has been approved for manual processing. Any blockchain transfer is completed outside this application.` },
    kyc_pending: { subject: "Your identity verification is being reviewed", title: "Identity verification received", body: `Hello ${name},<br/><br/>We received your identity-verification submission. It is awaiting review by the Better Wealth operations team. Withdrawals remain unavailable until approval.` },
    kyc_approved: { subject: "Your identity verification has been approved", title: "Identity verification approved", body: `Hello ${name},<br/><br/>Your identity verification has been approved. Your client portal now reflects the updated status.` },
  };
  const message = messages[event];
  return { subject: message.subject, html: layout(message.title, message.body) };
}
