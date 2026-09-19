import { put } from "@vercel/blob";
import { requireAdmin, assertSameOrigin } from "@/lib/server/auth";
import { ApiError, apiError } from "@/lib/server/db";
import { privateJson } from "@/lib/server/http";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await requireAdmin(req);
    if (!process.env.BLOB_READ_WRITE_TOKEN || !process.env.BLOB_PUBLIC_HOST)
      throw new ApiError(503, "Catalog image storage is not configured.");
    if (Number(req.headers.get("content-length") || 0) > 3100000)
      throw new ApiError(413, "Maximum image size is 3 MB.");
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > 3000000)
      throw new ApiError(400, "Choose an image up to 3 MB.");
    const bytes = new Uint8Array(await file.arrayBuffer());
    const png =
      bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const webp =
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
    const contentType = png
      ? "image/png"
      : jpg
        ? "image/jpeg"
        : webp
          ? "image/webp"
          : null;
    if (!contentType || file.type !== contentType)
      throw new ApiError(
        400,
        "Only valid JPEG, PNG and WebP images are accepted.",
      );
    const ext = png ? "png" : jpg ? "jpg" : "webp";
    const blob = await put(
      `catalog/${crypto.randomUUID()}.${ext}`,
      Buffer.from(bytes),
      { access: "public", contentType, addRandomSuffix: false },
    );
    return privateJson(
      { url: blob.url, pathname: blob.pathname, contentType, size: file.size },
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
