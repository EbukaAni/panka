import formData from "form-data";
import Mailgun from "mailgun.js";

export default class MailgunProvider {
  constructor({
    apiKey = process.env.MAILGUN_API_KEY,
    domain = process.env.MAILGUN_DOMAIN,
    url = process.env.MAILGUN_URL || "https://api.mailgun.net",
  } = {}) {
    if (!apiKey) throw new Error("MAILGUN_API_KEY is required");
    if (!domain) throw new Error("MAILGUN_DOMAIN is required");

    this.domain = domain;
    this.client = new Mailgun(formData).client({
      username: "api",
      key: apiKey,
      url,
    });
    this.batchSize = 1000;
  }

  async send(msg) {
    const data = await this._payload(msg);
    data.to = msg.to;
    return this._create(data);
  }

  async sendBatch(msg, recipients) {
    if (recipients.length > this.batchSize) {
      throw new Error(
        `Mailgun batch is limited to ${this.batchSize} recipients per call`,
      );
    }
    const variables = {};
    for (const { email, ...vars } of recipients) variables[email] = vars;

    const data = await this._payload(msg);
    data.to = recipients.map((r) => r.email);
    data["recipient-variables"] = JSON.stringify(variables);
    return this._create(data);
  }

  async _payload(msg) {
    const data = { from: msg.from, subject: msg.subject };
    if (msg.cc.length) data.cc = msg.cc;
    if (msg.bcc.length) data.bcc = msg.bcc;
    if (msg.text) data.text = msg.text;
    if (msg.html) data.html = msg.html;
    if (msg.replyTo) data["h:Reply-To"] = msg.replyTo;
    if (msg.tags.length) data["o:tag"] = msg.tags;

    if (msg.attachments.length) {
      data.attachment = await Promise.all(
        msg.attachments.map(async (a) => ({
          filename: a.filename,
          data: a.content ?? (await fs.readFile(a.path)),
        })),
      );
    }
    return data;
  }

  async _create(data) {
    try {
      const res = await this.client.messages.create(this.domain, data);
      return { id: res.id };
    } catch (err) {
      const e = new Error(
        err.details || err.message || "Mailgun request failed",
      );
      e.status = err.status; // used by MailNotifier to decide whether to retry
      throw e;
    }
  }
}
