import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import JobSummary from "@/features/jobs/components/JobSummary";

describe("Regression: F-07 - Mobile Match Score Presentation", () => {
  it("renders match scores as {score} / 100 on both mobile and desktop without percentage symbols", () => {
    const html = renderToStaticMarkup(
      React.createElement(JobSummary, {
        stats: {
          count: 5,
          totalCount: 20,
          highest: 92,
          average: 84,
        },
      }),
    );

    // Verify {score} / 100 is present for both highest and average
    expect(html).toContain("92 / 100");
    expect(html).toContain("84 / 100");

    // Verify '%' is NOT used for match scores (prevent regression to {score}%)
    expect(html).not.toContain("92%");
    expect(html).not.toContain("84%");
    expect(html).not.toContain("%");
  });

  it("handles null highest and average gracefully without percent signs", () => {
    const html = renderToStaticMarkup(
      React.createElement(JobSummary, {
        stats: {
          count: 0,
          totalCount: 0,
          highest: null,
          average: null,
        },
      }),
    );

    expect(html).toContain("N/A");
    expect(html).not.toContain("%");
  });
});
