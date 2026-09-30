// ==============================================================================
// SOVEREIGN CAREER PASSPORT SNAPSHOT SERVICE
// Module: @/features/walrus/services/career-snapshot.service
//
// Purpose:
// Packages the user's confirmed career profile, verified skills, and background
// into a standardized sovereign Career Passport document and permanently anchors
// it to the decentralized Walrus network (epochs=50 on Testnet).
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import { walrusClient } from "@/lib/walrus/walrus-client";
import { careerProfileService } from "@/features/profile/services/career-profile.service";

export interface CareerPassportSnapshot {
  schema: "finder-career-passport/v1";
  exported_at: string;
  user_id: string;
  profile_version: number;
  sui_address: string | null;
  career_intent: unknown;
  preferences: unknown;
  constraints: unknown;
  skills: {
    skill: string;
    category: string;
    confirmation_state: string;
  }[];
  background: {
    education: unknown[];
    experience: unknown[];
    projects: unknown[];
  };
  resume_walrus_blob_id: string | null;
}

export interface PublishSnapshotResult {
  blobId: string;
  suiObjectId?: string;
  explorerUrl: string;
  aggregatorUrl: string;
  snapshot: CareerPassportSnapshot;
}

export class CareerSnapshotService {
  /**
   * Generates and publishes the canonical Career Passport to Walrus.
   */
  async generateAndPublish(userId: string): Promise<PublishSnapshotResult> {
    const profile = await careerProfileService.getProfile(userId);
    if (!profile) {
      throw new Error("No career profile found for this user.");
    }

    // 1. Fetch user Sui address from public.profiles
    const { data: profileRow } = await supabaseAdmin
      .from("profiles")
      .select("sui_address")
      .eq("id", userId)
      .maybeSingle();

    // 2. Fetch active resume Walrus blob ID if available
    let resumeBlobId: string | null = null;
    if (profile.resumeId) {
      const { data: resumeRow } = await supabaseAdmin
        .from("resumes")
        .select("walrus_blob_id")
        .eq("id", profile.resumeId)
        .maybeSingle();
      resumeBlobId = resumeRow?.walrus_blob_id || null;
    }

    // 3. Package clean, portable Career Passport snapshot
    const skills = (profile.capabilities?.skills || []).map((s) => ({
      skill: s.skill,
      category: s.category,
      confirmation_state: s.confirmation_state,
    }));

    const snapshot: CareerPassportSnapshot = {
      schema: "finder-career-passport/v1",
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile_version: profile.profileVersion,
      sui_address: profileRow?.sui_address || null,
      career_intent: profile.careerIntent || null,
      preferences: profile.preferences || null,
      constraints: profile.constraints || null,
      skills,
      background: {
        education: profile.background?.education || [],
        experience: profile.background?.experience || [],
        projects: profile.background?.projects || [],
      },
      resume_walrus_blob_id: resumeBlobId,
    };

    const jsonString = JSON.stringify(snapshot, null, 2);
    const buffer = Buffer.from(jsonString, "utf-8");

    // 4. Store on Walrus Testnet (epochs=50 for ~50 days lifetime)
    const walrusResult = await walrusClient.storeBlob(buffer, {
      epochs: 50,
      deletable: true,
    });

    // 5. Update user metadata with snapshot reference
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        career_snapshot_blob_id: walrusResult.blobId,
        career_snapshot_updated_at: snapshot.exported_at,
      },
    });

    return {
      blobId: walrusResult.blobId,
      suiObjectId: walrusResult.suiObjectId,
      explorerUrl: walrusClient.getExplorerUrl(walrusResult.blobId),
      aggregatorUrl: walrusClient.getAggregatorUrl(walrusResult.blobId),
      snapshot,
    };
  }
}

export const careerSnapshotService = new CareerSnapshotService();
