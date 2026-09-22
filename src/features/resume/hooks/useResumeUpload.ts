import { useState, useCallback } from "react";
import { resumeService } from "../services/resume.service";
import * as analysisService from "../../ai-analysis/services/analysis.service";

export type UploadStep =
  | "idle"
  | "uploading"
  | "extracting"
  | "analyzing"
  | "matching"
  | "success"
  | "error";

export const useResumeUpload = () => {
  const [step, setStep] = useState<UploadStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [resumeDate, setResumeDate] = useState<string | null>(null);

  const checkExistingResume = useCallback(async () => {
    try {
      setIsChecking(true);
      const userLatest = await analysisService.fetchUserLatestAnalysis();

      if (userLatest && userLatest.id) {
        const fullData = await analysisService.fetchAnalysisData(userLatest.id);

        setAnalysisResult(fullData);
        setResumeDate(fullData.created_at);
        setStep("success");
      } else {
        setStep("idle");
      }
    } catch (error) {
      console.error("Gagal verifikasi data historis:", error);
      setStep("idle");
    } finally {
      setIsChecking(false);
    }
  }, []);

  const processResume = async (file: File) => {
    try {
      setErrorMsg("");

      setStep("uploading");
      const uploadPromise = resumeService.uploadPdf(file);
      const [, uploadData] = await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 1200)),
        uploadPromise,
      ]);

      setStep("extracting");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStep("analyzing");
      const analysisData = await analysisService.startAnalysis(
        uploadData.resumeId,
        uploadData.rawText,
      );

      setStep("matching");
      const finalData = await analysisService.fetchAnalysisData(
        analysisData.analysisId,
      );
      await new Promise((resolve) => setTimeout(resolve, 800));

      setAnalysisResult(finalData);
      setResumeDate(finalData.created_at);
      setStep("success");
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Kesalahan Alur Pemrosesan:", err);
      setErrorMsg(err.message);
      setStep("error");
    }
  };

  const resetFlow = () => {
    setStep("idle");
    setErrorMsg("");
    setAnalysisResult(null);
    setResumeDate(null);
  };

  return {
    step,
    errorMsg,
    analysisResult,
    isChecking,
    resumeDate,
    processResume,
    checkExistingResume,
    resetFlow,
  };
};
