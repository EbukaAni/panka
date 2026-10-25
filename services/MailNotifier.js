import MailgunProvider from "./MailgunProvider.js";

class MailNotifier {
  constructor({
    provider,
    from = process.env.MAIL_FROM,
    retries = 2,
    retryDelayMs = 1000,
  } = {}) {
    this.provider = provider || new MailgunProvider();
    this.from = from;
    this.retries = retries;
    this.retryDelayMs = retryDelayMs;
  }

  async send(options) {
    const message = this._normalize(options);
    return this._withRetry(() => this.provider.send(message));
  }

  async sendBatch(
    { recipients, ...options },
    { chunkSize, concurrency = 2 } = {},
  ) {
    if (typeof this.provider.sendBatch !== "function") {
      throw new Error("This provider does not support batch sending");
    }
    if (options.cc || options.bcc)
      throw new Error("cc/bcc are not supported in batch sends");
    if (!Array.isArray(recipients) || !recipients.length)
      throw new Error('"recipients" is required');

    const message = this._normalize(options, false);

    const seen = new Set();
    const list = [];
    for (const r of recipients) {
      const person = typeof r === "string" ? { email: r } : r;
      if (
        !person ||
        typeof person.email !== "string" ||
        !person.email.includes("@")
      ) {
        throw new Error(`Invalid recipient: ${JSON.stringify(r)}`);
      }
      const key = person.email.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push(person);
      }
    }

    const max = this.provider.batchSize || 1000;
    const size = Math.min(chunkSize || max, max);
    const chunks = [];
    for (let i = 0; i < list.length; i += size)
      chunks.push(list.slice(i, i + size));

    const perChunk = await this._pool(chunks, concurrency, async (chunk) => {
      try {
        const result = await this._withRetry(() =>
          this.provider.sendBatch(message, chunk),
        );
        return chunk.map((r) => ({ to: r.email, ok: true, result }));
      } catch (err) {
        return chunk.map((r) => ({
          to: r.email,
          ok: false,
          error: err.message,
        }));
      }
    });
    return perChunk.flat();
  }

  _normalize(
    { to, cc, bcc, replyTo, subject, text, html, attachments, tags, from },
    toRequired = true,
  ) {
    const list = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
    const sender = from || this.from;

    if (!sender) throw new Error('"from" is required (set MAIL_FROM)');
    if (toRequired && !list(to).length) throw new Error('"to" is required');
    if (!subject) throw new Error('"subject" is required');
    if (!text && !html) throw new Error('Provide "text" or "html"');

    return {
      from: sender,
      to: list(to),
      cc: list(cc),
      bcc: list(bcc),
      replyTo,
      subject,
      text,
      html,
      attachments: list(attachments),
      tags: list(tags),
    };
  }

  async _withRetry(fn) {
    for (let attempt = 0; ; attempt++) {
      try {
        return await fn();
      } catch (err) {
        const retryable =
          err.status == null || err.status === 429 || err.status >= 500;
        if (!retryable || attempt >= this.retries) throw err;
        await new Promise((r) =>
          setTimeout(r, this.retryDelayMs * 2 ** attempt),
        );
      }
    }
  }

  async _pool(items, concurrency, fn) {
    const results = new Array(items.length);
    let next = 0;
    const worker = async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(concurrency, items.length) }, worker),
    );
    return results;
  }
}

export default new MailNotifier();
