const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function button(label, link) {
  if (!/^https?:\/\//i.test(link)) throw new Error(`Invalid URL: ${link}`); // blocks javascript: links
  return `<p style="margin:24px 0"><a href="${esc(link)}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">${esc(label)}</a></p>`;
}

function need(who, fields) {
  const missing = Object.keys(fields).filter(
    (k) => fields[k] == null || fields[k] === "",
  );
  if (missing.length)
    throw new Error(`Messages.${who}: missing ${missing.join(", ")}`);
}

export default class Messages {
  static welcome({ to, name }) {
    need("welcome", { to, name });
    const subject = `Welcome, ${name}! Let's send your first invoice`;
    return {
      to,
      subject,
      tags: ["welcome"],
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Vocidy</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f5f7;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

          <!-- Header -->
          <tr>
            <td style="background-color:#4f46e5; padding:28px 32px;">
              <span style="font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.3px;">Vocidy</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px; font-size:22px; line-height:1.3; color:#111827;">Welcome to Vocidy! 👋</h1>
              <p style="margin:0 0 20px; font-size:15px; line-height:1.6; color:#374151;">
                Thanks for installing the extension.
              </p>
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#374151;">
                If you get stuck or have an idea for making Vocidy better, reach us at
                <a href="mailto:contact@vocidy.com" style="color:#4f46e5; text-decoration:underline;">contact@vocidy.com</a>.
                A real person reads every message.
              </p>
              <p style="margin:0; font-size:15px; line-height:1.6; color:#374151;">
                Happy invoicing,<br>
                <strong style="color:#111827;">The Vocidy Team</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
      text: `Hi ${name},

Welcome to Vocidy! Thanks for installing the extension.

If you get stuck or have an idea for making Vocidy better, reach us at contact@vocidy.com. A real person reads every message.

Happy invoicing,
The Vocidy Team`,
    };
  }

  static invoicesSent({ period, dashboardUrl }) {
    need("invoicesSent", { period, dashboardUrl });
    const subject = `Your ${period} invoices have been sent`;
    return {
      subject,
      tags: ["invoices-sent"],
      html: wrap(
        subject,
        `<p>Hi %recipient.nameHtml%,</p>
<p>We generated and sent <strong>%recipient.invoiceLabel%</strong> to your clients for ${esc(period)}, totaling <strong>%recipient.total%</strong>.</p>
${button("View invoices", dashboardUrl)}`,
      ),
      text: `Hi %recipient.name%,\n\nWe generated and sent %recipient.invoiceLabel% to your clients for ${period}, totaling %recipient.total%.\n\nView invoices: ${dashboardUrl}`,
    };
  }

  static invoicesSentRecipient({
    email,
    name,
    invoiceCount,
    amount,
    currency = "USD",
  }) {
    need("invoicesSentRecipient", { email, name, invoiceCount, amount });
    return {
      email,
      name,
      nameHtml: esc(name),
      invoiceLabel: `${invoiceCount} invoice${Number(invoiceCount) === 1 ? "" : "s"}`,
      total: new Intl.NumberFormat("en", {
        style: "currency",
        currency,
      }).format(amount),
    };
  }
}
