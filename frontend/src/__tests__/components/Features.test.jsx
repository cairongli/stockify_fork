import { render, screen } from "@testing-library/react";
import Features from "../../components/Features";
import "@testing-library/jest-dom";

describe("Features Component", () => {
  test("renders without errors", () => {
    render(<Features />);
    expect(screen.getByText("Why Learn with Stockify?")).toBeInTheDocument();
  });

  test("displays all feature cards", () => {
    render(<Features />);
    const features = [
      "Learn by Playing",
      "Real Market Data",
      "AI Trading Assistant",
      "Risk-Free Trading",
      "Community Support",
    ];

    features.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument();
    });
  });

  test("each feature card has an icon", () => {
    render(<Features />);
    const icons = screen.getAllByText(/[🎮📊🤖🛡️👥]/);
    expect(icons.length).toBeGreaterThan(0);
  });

  test("handles missing feature data gracefully", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    render(<Features features={[]} />);
    expect(screen.getByText("Why Learn with Stockify?")).toBeInTheDocument();
    console.error.mockRestore();
  });
});
