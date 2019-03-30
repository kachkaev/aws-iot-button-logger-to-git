import simulate from "./simulate";

describe("simulate()", () => {
  it("throws by default because env vars are not provided", async () => {
    expect(simulate()).rejects.toThrow();
  });
});
