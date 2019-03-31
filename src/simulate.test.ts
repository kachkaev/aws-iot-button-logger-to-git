import simulate from "./simulate";
import { sanitizeEnv, restoreEnv } from "./testUtil";

describe("simulate()", () => {
  beforeEach(sanitizeEnv);
  afterEach(restoreEnv);

  it("throws by default because env vars are not provided", async () => {
    const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
    const mockConsoleError = jest.spyOn(console, "error").mockImplementation();
    const mockExit = jest
      .spyOn(process, "exit")
      .mockImplementation((code: number) => {
        throw new Error(`Early exit with code ${code}`);
      });

    await expect(simulate()).rejects.toThrow("Early exit with code 1");

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    jest.clearAllMocks();
  });
});
