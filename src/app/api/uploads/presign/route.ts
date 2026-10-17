import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getUploadLink, listProjects } from "@/lib/data";

// Issues a short-lived presigned PUT URL so the browser uploads straight to
// Cloudflare R2. Requires R2_* env vars (see .env.example).

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB — generous for home videos
const ALLOWED = /^(image\/|video\/|application\/pdf$)/;

function client() {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });
}

export async function POST(req: Request) {
  const s3 = client();
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.R2_PUBLIC_BASE_URL;
  if (!s3 || !bucket || !publicBase) return NextResponse.json({ error: "Storage is not configured" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as {
    projectId?: string;
    uploadToken?: string;
    filename?: string;
    contentType?: string;
    size?: number;
  } | null;
  if (!body?.projectId || !body.filename || !body.contentType || typeof body.size !== "number")
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  if (!ALLOWED.test(body.contentType)) return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  if (body.size > MAX_BYTES) return NextResponse.json({ error: "File too large" }, { status: 413 });

  // Authorize: either a valid upload link for this project, or membership with upload rights.
  if (body.uploadToken) {
    const link = await getUploadLink(body.uploadToken);
    if (!link || link.project.id !== body.projectId) return NextResponse.json({ error: "Invalid link" }, { status: 403 });
  } else {
    const project = (await listProjects()).find((p) => p.id === body.projectId);
    if (!project || project.role === "viewer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const safe = body.filename.replace(/[^\w.\-]+/g, "_").slice(-120);
  const key = `projects/${body.projectId}/${crypto.randomUUID()}-${safe}`;
  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: body.contentType, ContentLength: body.size }),
    { expiresIn: 600 },
  );
  return NextResponse.json({ uploadUrl, key, publicUrl: `${publicBase.replace(/\/$/, "")}/${key}` });
}
