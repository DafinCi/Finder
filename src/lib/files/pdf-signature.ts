const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"

/**
 * Reads the PDF file signature so a renamed or mislabelled file is rejected
 * before upload. The server enforces the same check; this only fails faster
 * for the user.
 */
export async function hasPdfSignature(file: Blob): Promise<boolean> {
  const header = new Uint8Array(
    await file.slice(0, PDF_MAGIC_BYTES.length).arrayBuffer(),
  );
  if (header.length !== PDF_MAGIC_BYTES.length) return false;
  return PDF_MAGIC_BYTES.every((byte, index) => header[index] === byte);
}
