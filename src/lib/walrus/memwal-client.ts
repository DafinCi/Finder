// ==============================================================================
// SERVICE: Official MemWal (Walrus Memory) Client Wrapper
// Module: @/lib/walrus/memwal-client
// ==============================================================================

import { MemWal, MemWalMock, RecallResult, RememberResult } from "@mysten-incubation/memwal";
import { WALRUS_CONFIG } from "./walrus-config";

export interface MemWalRecallParams {
  query: string;
  limit?: number;
  namespace?: string;
  maxDistance?: number;
}

export interface StoredMemoryResult {
  blobId?: string;
  jobId: string;
  namespace: string;
  isMock: boolean;
}

export interface MemWalClientOptions {
  forceMock?: boolean;
  forceLive?: boolean;
}

export class MemWalClient {
  private client: MemWal | MemWalMock;
  private isMockMode: boolean = false;

  constructor(options?: MemWalClientOptions) {
    const key = process.env.MEMWAL_DELEGATE_PRIVATE_KEY;
    const accountId = process.env.MEMWAL_ACCOUNT_ID;
    const serverUrl = WALRUS_CONFIG.relayerUrl;

    const isTestEnv =
      (process.env.VITEST === "true" || process.env.NODE_ENV === "test") &&
      !options?.forceLive;

    // Test/demo mode is explicit and self-contained.
    if (options?.forceMock || isTestEnv) {
      this.client = MemWalMock.create({ namespace: "finder:default" });
      this.isMockMode = true;
      return;
    }

    // Production: fail loudly instead of silently degrading to a non-durable mock.
    if (!key || !accountId) {
      throw new Error(
        "MemWal is not configured: MEMWAL_DELEGATE_PRIVATE_KEY and MEMWAL_ACCOUNT_ID are required in production.",
      );
    }

    try {
      this.client = MemWal.create({
        key,
        accountId,
        serverUrl,
        namespace: "finder:default",
      });
      this.isMockMode = false;
      console.info(`[MemWalClient] Connected to live MemWal relayer at: ${serverUrl}`);
    } catch (err) {
      console.error(
        "[MemWalClient] Failed to initialize live MemWal client:",
        (err as Error).message,
      );
      throw err;
    }
  }

  /**
   * Indicates whether the client is in live relayer mode or mock fallback mode.
   */
  public isLive(): boolean {
    return !this.isMockMode;
  }

  /**
   * Helper to format a user-specific namespace.
   */
  public getUserNamespace(profileId: string): string {
    return `finder:user:${profileId}`;
  }

  /**
   * Remembers a single atomic fact on Walrus Memory and waits for completion.
   */
  public async rememberAndWait(
    text: string,
    namespace: string
  ): Promise<StoredMemoryResult> {
    try {
      const result: RememberResult = await this.client.rememberAndWait(text, namespace);
      return {
        blobId: result.blob_id,
        jobId: result.job_id || result.id,
        namespace: result.namespace || namespace,
        isMock: this.isMockMode,
      };
    } catch (error) {
      console.error(
        `[MemWalClient] Failed to rememberAndWait in namespace ${namespace}:`,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Recalls the most semantically relevant memories matching a natural language query.
   */
  public async recall(params: MemWalRecallParams): Promise<RecallResult> {
    try {
      const limit = params.limit || 5;
      const namespace = params.namespace || "finder:default";

      return await this.client.recall({
        query: params.query,
        limit,
        namespace,
        maxDistance: params.maxDistance,
      });
    } catch (error) {
      console.error(
        `[MemWalClient] Failed to recall from namespace ${params.namespace}:`,
        (error as Error).message
      );
      return {
        results: [],
        total: 0,
      };
    }
  }

  /**
   * Generates a link to the Walruscan explorer for a specific blob ID.
   */
  public getBlobExplorerUrl(blobId: string): string {
    return `${WALRUS_CONFIG.explorerUrl}/${blobId}`;
  }
}

export const memwalClient = new MemWalClient();
