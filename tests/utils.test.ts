import { describe, expect, it } from "bun:test";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
	it("merges class names correctly", () => {
		expect(cn("px-2 py-1", "bg-blue-500")).toBe("px-2 py-1 bg-blue-500");
	});

	it("handles conditional class names and overrides", () => {
		expect(cn("p-4", false && "hidden", "p-2")).toBe("p-2");
	});

	it("handles empty or falsy inputs", () => {
		expect(cn("", null, undefined, false)).toBe("");
	});
});
