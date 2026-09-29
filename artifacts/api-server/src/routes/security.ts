import { Router, type IRouter } from "express";
import {
  AnalyzePasswordBody,
  AnalyzePasswordResponse,
  GeneratePasswordBody,
  GeneratePasswordResponse,
  GetDashboardStatsResponse,
  GetWeaknessAnalyticsResponse,
} from "@workspace/api-zod";
import {
  analyzePassword,
  generateSecurePassword,
  type AnalysisResult,
} from "../lib/password-analyzer";

const router: IRouter = Router();

const classifications = ["VERY WEAK", "WEAK", "MODERATE", "STRONG", "VERY STRONG"];
const analyses: Array<{ score: number; length: number; classification: AnalysisResult["classification"]; findingTypes: string[] }> = [];

router.post("/analyze", (req, res): void => {
  const parsed = AnalyzePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ error: parsed.error.message }, "Invalid password analysis request");
    res.status(400).json({ error: "Invalid analysis request" });
    return;
  }

  const result = analyzePassword(parsed.data.password, parsed.data.personalContext, parsed.data.policy);
  analyses.push({
    score: result.score,
    length: result.metrics.length,
    classification: result.classification,
    findingTypes: result.findings
      .filter((finding) => finding.severity !== "positive")
      .map((finding) => finding.type),
  });
  if (analyses.length > 250) analyses.shift();
  res.json(AnalyzePasswordResponse.parse(result));
});

router.post("/generate-password", (req, res): void => {
  const parsed = GeneratePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid generation options" });
    return;
  }
  try {
    res.json(GeneratePasswordResponse.parse(generateSecurePassword(parsed.data)));
  } catch {
    res.status(400).json({ error: "Select at least one character set" });
  }
});

router.get("/dashboard/stats", (_req, res): void => {
  const totalAnalyses = analyses.length;
  const averageScore = totalAnalyses === 0 ? 0 : Number((analyses.reduce((sum, item) => sum + item.score, 0) / totalAnalyses).toFixed(1));
  const averageLength = totalAnalyses === 0 ? 0 : Number((analyses.reduce((sum, item) => sum + item.length, 0) / totalAnalyses).toFixed(1));
  const classificationCounts = classifications.map((classification) => ({
    classification,
    count: analyses.filter((item) => item.classification === classification).length,
  }));
  res.json(GetDashboardStatsResponse.parse({
    totalAnalyses,
    averageScore,
    averageLength,
    classificationCounts,
    recentScores: analyses.slice(-12).map((item) => item.score),
  }));
});

router.get("/analytics/weaknesses", (_req, res): void => {
  const labels: Record<string, string> = {
    short: "Short length",
    common: "Common password",
    dictionary: "Common word",
    repetition: "Repeated pattern",
    sequence: "Sequential pattern",
    keyboard: "Keyboard walk",
    "predictable-structure": "Word + number/year",
    "personal-information": "Personal information",
    spaces: "Policy: spaces",
  };
  const counts = new Map<string, number>();
  for (const analysis of analyses) {
    for (const type of new Set(analysis.findingTypes)) {
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }
  const weaknesses = [...counts.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([type, count]) => ({ type, label: labels[type] ?? type, count }));
  res.json(GetWeaknessAnalyticsResponse.parse({ weaknesses }));
});

export default router;