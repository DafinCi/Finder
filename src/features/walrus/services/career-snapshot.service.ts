// ==============================================================================
// SOVEREIGN CAREER PASSPORT SNAPSHOT SERVICE
// Module: @/features/walrus/services/career-snapshot.service
//
// Purpose:
// Builds a minimized public profile subset and publishes it to Walrus when the
// user explicitly asks for it.
//
// Privacy rules:
// - No identifiers (user id, wallet address, contact details).
// - No education, employer names, salary, location, or negative preferences.
// - Only skills, target roles, employment types, and career level.
// ==============================================================================

import { supabaseAdmin } from "@/lib/supabase/admin";
import { walrusClient } from "@/lib/walrus/walrus-client";
import { careerProfileService } from "@/features/profile/services/career-profile.service";

export interface CareerPassportSnapshot {
  schema: "finder-career-passport/v1";
  exported_at: string;
  profile_version: number;
  career_level: string | null;
  target_roles: Array<{ role: string; priority: string }>;
  employment_types: string[];
  skills: Array<{ skill: string; category: string }>;
}

export interface PublishSnapshotResult {
  blobId: string;
  suiObjectId?: string;
  explorerUrl: string;
  aggregatorUrl: string;
  snapshot: CareerPassportSnapshot;
}

/**
 * Builds the public subset of a profile. Exported so the UI can preview exactly
 * what would be published before the user confirms.
 */
export function buildPublicSnapshot(
  profile: Awaited<ReturnType<typeof careerProfileService.getProfile>>,
): CareerPassportSnapshot {
  if (!profile) {
    throw new Error("No career profile found for this user.");
  }

  return {
    schema: "finder-career-passport/v1",
    exported_at: new Date().toISOString(),
    profile_version: profile.profileVersion,
    career_level: profile.careerIntent?.target_level ?? null,
    target_roles: (profile.careerIntent?.target_roles || []).map((role) => ({
      role: role.role,
      priority: role.priority,
    })),
    employment_types: profile.careerIntent?.employment_types || [],
    skills: (profile.capabilities?.skills || []).map((item) => ({
      skill: item.skill,
      category: item.category,
    })),
  };
}

export class CareerSnapshotService {
  /**
   * Publishes the minimized public passport to Walrus. The route enforces the
   * user's explicit confirmation before this runs.
   */
  async generateAndPublish(userId: string): Promise<PublishSnapshotResult> {
    const profile = await careerProfileService.getProfile(userId);
    const snapshot = buildPublicSnapshot(profile);

    const buffer = Buffer.from(JSON.stringify(snapshot, null, 2), "utf-8");

    const walrusResult = await walrusClient.storeBlob(buffer, {
      epochs: 50,
      deletable: true,
    });

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
