const API_URL = "https://api.imgbb.com/1/upload";

export class ImgBB {
  constructor(apiKey = process.env.IMGBB_API_KEY) {
    if (!apiKey) throw new Error("Missing IMGBB_API_KEY");
    this.apiKey = apiKey;
  }

  async upload(image, { name, expiration } = {}) {
    const form = new FormData();

    if (Buffer.isBuffer(image)) {
      form.append("image", image.toString("base64"));
    } else {
      form.append("image", image);
    }
    if (name) form.append("name", name);

    const params = new URLSearchParams({ key: this.apiKey });
    if (expiration) params.set("expiration", String(expiration));

    const res = await fetch(`${API_URL}?${params}`, {
      method: "POST",
      body: form,
    });
    const json = await res.json().catch(() => null);

    if (!res.ok || !json?.success) {
      const msg = json?.error?.message || `HTTP ${res.status}`;
      throw new Error(`ImgBB upload failed: ${msg}`);
    }

    const d = json.data;
    return {
      id: d.id,
      url: d.url,
      deleteUrl: d.delete_url,
    };
  }
}
