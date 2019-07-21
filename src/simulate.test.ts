import simulate from "./simulate";
import {
  sanitizeEnv,
  restoreEnv,
  createTemporaryRepository,
} from "./testHelpers";

describe("simulate", () => {
  let mockConsoleLog: jest.MockInstance<void, any[]>;
  let mockConsoleError: jest.MockInstance<void, any[]>;
  let mockExit: jest.MockInstance<void, any[]>;
  beforeEach(() => {
    sanitizeEnv();
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
    mockConsoleError = jest.spyOn(console, "error").mockImplementation();
    mockExit = jest
      .spyOn(process, "exit")
      .mockImplementation((code: number) => {
        throw new Error(`Early exit with code ${code}`);
      });
  });
  afterEach(() => {
    restoreEnv();
    jest.clearAllMocks();
  });

  it("throws by default because env vars are not provided", async () => {
    await expect(simulate()).rejects.toThrow("Early exit with code 1");

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("throws for an empty repository (branch does not exist)", async () => {
    const { repositoryPath } = await createTemporaryRepository();
    process.env.GIT_REPO_URI = repositoryPath;
    process.env.GIT_FILE_PATH = "clicks.txt";
    expect(simulate()).rejects.toThrow();
  });
});
