import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { win32, posix } from "node:path";
import { cpus } from "node:os";
import { Glob } from "glob";
import { promise as fastq } from "fastq";
const fastqConcurrency = Math.max(1, cpus().length - 1);

const generateFileHash = async (filePath) => {
  try {
    const fileBuffer = await readFile(filePath);
    return createHash("md5").update(fileBuffer).digest("hex").slice(0, 16);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
    return "";
  }
};

const updateFilePathsWithHashes = async (
  fileHashes,
  updateCwd,
  skipPatterns,
  includeDotFiles,
) => {
  updateCwd = updateCwd.split(win32.sep).join(posix.sep);
  if (!updateCwd.endsWith("/")) {
    updateCwd += "/";
  }

  const filesIterable = new Glob("**/**", {
    cwd: updateCwd,
    absolute: true,
    follow: true,
    nodir: true,
    dot: includeDotFiles,
    ignore: skipPatterns,
  });

  for await (const file of filesIterable) {
    let content = await readFile(file, "utf8");
    let changed = false;

    for (const [originalPath, hash] of fileHashes) {
      if (content.includes(originalPath)) {
        const hashedPath = `${originalPath}?hash=${hash}`;
        content = content.replaceAll(originalPath, hashedPath);
        changed = true;
      }
    }

    if (changed) {
      await writeFile(file, content);
    }
  }
};

const generateHashesAndReplace = async ({
  rootPaths,
  updateCwd,
  skipPatterns = ["**/node_modules/**"],
  includeDotFiles = false,
}) => {
  const fileHashes = new Map();
  const roots = Array.isArray(rootPaths) ? rootPaths : [rootPaths];

  for (let rootPath of roots) {
    rootPath = rootPath.split(win32.sep).join(posix.sep);
    if (!rootPath.endsWith("/")) {
      rootPath += "/";
    }

    const queue = fastq(generateFileHash, fastqConcurrency);
    const queuePromises = [];
    const files = [];

    const filesIterable = new Glob("**/**", {
      cwd: rootPath,
      absolute: true,
      follow: true,
      nodir: true,
      dot: includeDotFiles,
      ignore: skipPatterns,
    });

    for await (let file of filesIterable) {
      file = file.split(win32.sep).join(posix.sep);
      files.push(file);
      queuePromises.push(queue.push(file));
    }

    const hashes = await Promise.all(queuePromises);

    for (let i = 0; i < files.length; i++) {
      const fileRelativePath = posix.relative(rootPath, files[i]);
      fileHashes.set(fileRelativePath, hashes[i]);
    }
  }

  await updateFilePathsWithHashes(
    fileHashes,
    updateCwd,
    skipPatterns,
    includeDotFiles,
  );
};

export { generateFileHash, generateHashesAndReplace };
