import simulate from "./simulate";
import {
  sanitizeEnv,
  restoreEnv,
  createTemporaryRepository,
} from "./testHelpers";

describe("simulate", () => {
  let mockConsoleLog: jest.MockInstance<void, any[]>;
  let mockConsoleError: jest.MockInstance<void, any[]>;
  beforeEach(() => {
    sanitizeEnv();
    mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
    mockConsoleError = jest.spyOn(console, "error").mockImplementation();
  });
  afterEach(() => {
    restoreEnv();
    jest.clearAllMocks();
  });

  it("throws by default because env vars are not provided", async () => {
    await expect(simulate()).rejects.toThrow(
      "Invalid env vars: GIT_REPO_URI, GIT_FILE_PATH",
    );

    expect(mockConsoleLog).not.toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("throws for an empty repository (branch does not exist)", async () => {
    const { repositoryPath } = await createTemporaryRepository();
    process.env.GIT_FILE_PATH = "clicks.txt";
    process.env.GIT_REPO_URI = repositoryPath;
    expect(simulate()).rejects.toThrow(
      /Remote branch main not found in upstream origin/,
    );
  });
});
