// ==============================================================================
// WALRUS BLOB PROXY ROUTE
// Module: @/app/api/walrus/blob/[blobId]/route
//
// Purpose:
// Reads certified blobs from Walrus Aggregator and streams them to the browser
// with correct Content-Type (e.g. application/pdf) and Content-Disposition headers.
// This resolves the browser nosniff/blank screen issue when opening raw Walrus blobs.
// ==============================================================================

import { NextRequest, NextResponse } from "next/server";
import { walrusClient } from "@/lib/walrus/walrus-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ blobId: string }> },
) {
  try {
    const { blobId } = await context.params;

    if (!blobId || typeof blobId !== "string" || blobId.length < 5) {
      return NextResponse.json(
        { error: "Invalid Walrus Blob ID parameter." },
        { status: 400 },
      );
    }

    // Sanitize blob ID format (URL-safe base64 characters only)
    const sanitizedBlobId = blobId.replace(/[^a-zA-Z0-9_-]/g, "");
    if (sanitizedBlobId !== blobId) {
      return NextResponse.json(
        { error: "Malformed Walrus Blob ID format." },
        { status: 400 },
      );
    }

    // Read binary data from Walrus Aggregator
    const buffer = await walrusClient.readBlob(sanitizedBlobId);

    // Detect if content is PDF via magic bytes (%PDF- / 0x25 0x50 0x44 0x46)
    const uint8 = new Uint8Array(buffer);
    const isPdf =
      uint8.length >= 4 &&
      uint8[0] === 0x25 &&
      uint8[1] === 0x50 &&
      uint8[2] === 0x44 &&
      uint8[3] === 0x46;

    const contentType = isPdf ? "application/pdf" : "application/octet-stream";
    const filename = isPdf
      ? `walrus_${sanitizedBlobId.slice(0, 8)}.pdf`
      : `walrus_${sanitizedBlobId.slice(0, 8)}.bin`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "public, max-age=86400, immutable",
        "X-Walrus-Blob-Id": sanitizedBlobId,
        "X-Decentralized-Source": "Walrus-Protocol",
      },
    });
  } catch (err: unknown) {
    console.error("[API:Walrus:Proxy:Error]", err);
    return NextResponse.json(
      {
        error: "Unable to retrieve decentralized blob from Walrus network.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
