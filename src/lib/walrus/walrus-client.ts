// ==============================================================================
// WALRUS CLIENT SERVICE
// Module: @/lib/walrus/walrus-client
// ==============================================================================

import { WALRUS_CONFIG } from "./walrus-config";

export interface WalrusStoreResult {
  blobId: string;
  suiObjectId?: string;
  storageSize?: number;
  startEpoch?: number;
  endEpoch?: number;
  cost?: number;
  isAlreadyCertified: boolean;
}

export class WalrusClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "WalrusClientError";
  }
}

export class WalrusClient {
  private publisherUrl: string;
  private aggregatorUrl: string;
  private explorerUrl: string;
  private defaultEpochs: number;

  constructor(customConfig?: Partial<typeof WALRUS_CONFIG>) {
    this.publisherUrl =
      customConfig?.publisherUrl || WALRUS_CONFIG.publisherUrl;
    this.aggregatorUrl =
      customConfig?.aggregatorUrl || WALRUS_CONFIG.aggregatorUrl;
    this.explorerUrl = customConfig?.explorerUrl || WALRUS_CONFIG.explorerUrl;
    this.defaultEpochs =
      customConfig?.defaultEpochs || WALRUS_CONFIG.defaultEpochs;
  }

  /**
   * Stores a binary blob (PDF, JSON, etc.) to the Walrus network.
   * Handles both `newlyCreated` and `alreadyCertified` success responses.
   */
  async storeBlob(
    data: Buffer | Uint8Array,
    options?: { epochs?: number; deletable?: boolean },
  ): Promise<WalrusStoreResult> {
    const epochs = options?.epochs ?? this.defaultEpochs;
    const deletable = options?.deletable ?? true;

    if (data.byteLength > WALRUS_CONFIG.maxFileSizeBytes) {
      throw new WalrusClientError(
        `Payload size (${(data.byteLength / 1024 / 1024).toFixed(1)} MB) exceeds Walrus limit of 10 MB.`,
        413,
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      WALRUS_CONFIG.requestTimeoutMs,
    );

    const url = `${this.publisherUrl}/v1/blobs?epochs=${epochs}&deletable=${deletable}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        body: data as unknown as BodyInit,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new WalrusClientError(
          `Walrus publisher returned HTTP ${response.status}: ${errorText}`,
          response.status,
          errorText,
        );
      }

      const json = await response.json();

      // Case A: newlyCreated blob
      if (json.newlyCreated) {
        const { blobObject, cost } = json.newlyCreated;
        return {
          blobId: blobObject.blobId,
          suiObjectId: blobObject.id,
          storageSize: blobObject.storage?.storageSize,
          startEpoch: blobObject.storage?.startEpoch,
          endEpoch: blobObject.storage?.endEpoch,
          cost,
          isAlreadyCertified: false,
        };
      }

      // Case B: alreadyCertified blob (identical content previously stored with sufficient lifetime)
      if (json.alreadyCertified) {
        return {
          blobId: json.alreadyCertified.blobId,
          endEpoch: json.alreadyCertified.endEpoch,
          isAlreadyCertified: true,
        };
      }

      throw new WalrusClientError(
        "Unexpected response structure from Walrus publisher.",
        502,
        json,
      );
    } catch (err: unknown) {
      if (err instanceof WalrusClientError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new WalrusClientError(
          "Walrus upload timed out after 60 seconds.",
          504,
        );
      }
      throw new WalrusClientError(
        `Failed to store blob on Walrus: ${err instanceof Error ? err.message : String(err)}`,
        500,
        err,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Reads raw binary data of a certified blob from a Walrus aggregator.
   */
  async readBlob(blobId: string): Promise<ArrayBuffer> {
    const url = `${this.aggregatorUrl}/v1/blobs/${encodeURIComponent(blobId)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new WalrusClientError(
          `Aggregator returned HTTP ${response.status} for blob ${blobId}`,
          response.status,
        );
      }
      return await response.arrayBuffer();
    } catch (err: unknown) {
      if (err instanceof WalrusClientError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new WalrusClientError("Aggregator read timed out.", 504);
      }
      throw new WalrusClientError(
        `Failed to read blob from Walrus: ${err instanceof Error ? err.message : String(err)}`,
        500,
        err,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Checks whether a blob is certified and available on the aggregator.
   */
  async checkBlobStatus(blobId: string): Promise<boolean> {
    const url = `${this.aggregatorUrl}/v1/blobs/${encodeURIComponent(blobId)}`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Returns direct public aggregator URL.
   */
  getAggregatorUrl(blobId: string): string {
    return `${this.aggregatorUrl}/v1/blobs/${encodeURIComponent(blobId)}`;
  }

  /**
   * Returns the official Walruscan blockchain explorer URL for this blob.
   */
  getExplorerUrl(blobId: string): string {
    return `${this.explorerUrl}/${encodeURIComponent(blobId)}`;
  }
}

export const walrusClient = new WalrusClient();
