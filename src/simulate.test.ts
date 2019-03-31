import simulate from "./simulate";
import { sanitizeEnv, restoreEnv } from "./testUtil";

describe("simulate()", () => {
  beforeEach(sanitizeEnv);
  afterEach(restoreEnv);

  it("throws by default because env vars are not provided", async () => {
    const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
    const mockConsoleError = jest.spyOn(console, "error").mockImplementation();
    const mockExit = jest.spyOn(process, "exit").mockImplementation();

    await expect(simulate()).rejects.toThrow(
      "Invalid env vars: GIT_REPO_URI,GIT_FILE_PATH",
    );

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    jest.clearAllMocks();
  });
});
