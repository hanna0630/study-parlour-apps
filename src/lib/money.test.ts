import { describe, it, expect } from "vitest";
import { toMinor, convertMinor } from "./money";

describe("money", () => {
  it("parses without float error", () => {
    expect(toMinor("0.10", "USD") + toMinor("0.20", "USD")).toBe(30n);
    expect(toMinor("150000", "IDR")).toBe(150000n);
  });
  it("rejects excess precision and junk", () => {
    expect(() => toMinor("1.5", "IDR")).toThrow();
    expect(() => toMinor("abc", "USD")).toThrow();
  });
  it("converts USD to IDR with explicit rate", () => {
    expect(convertMinor(1000n, "16000", "USD", "IDR")).toBe(160000n);
  });
});
