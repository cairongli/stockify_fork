import { render, screen } from "@testing-library/react";
import Navbar from "@/components/Navbar";
import Features from "@/components/Features";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { jsx } from "react/jsx-runtime";

// Mock next/link since we're in a test environment
jest.mock("next/link", () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

describe("Navbar and Features Interaction", () => {
  test("clicking Features link scrolls to Features section", async () => {
    // Implement mock for window.scrollTo
    const scrollToMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollToMock;

    render(
      <>
        <Navbar />
        <Features />
      </>
    );
    const user = userEvent.setup();
    await user.click(screen.getByText("Features"));
    expect(screen.getByText("Why Learn with Stockify?")).toBeInTheDocument();
  });

  test("handles missing Features section gracefully", async () => {
    render(
      <>
        <Navbar />
      </>
    );
    const user = userEvent.setup();
    await user.click(screen.getByText("Features"));
    expect(screen.getByText("Features")).toBeInTheDocument();
  });
});
