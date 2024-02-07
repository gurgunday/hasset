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
  cwds,
  includeDotFiles,
  skipPatterns,
) => {
  for (let cwd of cwds) {
    cwd = cwd.split(win32.sep).join(posix.sep);
    if (!cwd.endsWith("/")) {
      cwd += "/";
    }

    const filesIterable = new Glob("**/**", {
      nodir: true,
      follow: true,
      absolute: true,
      cwd,
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
  }
};

const generateHashesAndReplace = async ({
  roots,
  cwds,
  includeDotFiles = false,
  skipPatterns = ["**/node_modules/**"],
}) => {
  const fileHashes = new Map();
  roots = Array.isArray(roots) ? roots : [roots];
  cwds = Array.isArray(cwds) ? cwds : [cwds];

  for (let rootPath of roots) {
    rootPath = rootPath.split(win32.sep).join(posix.sep);
    if (!rootPath.endsWith("/")) {
      rootPath += "/";
    }

    const queue = fastq(generateFileHash, fastqConcurrency);
    const queuePromises = [];
    const files = [];

    const filesIterable = new Glob("**/**", {
      nodir: true,
      follow: true,
      absolute: true,
      cwd: rootPath,
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
    cwds,
    includeDotFiles,
    skipPatterns,
  );
};

export { generateFileHash, generateHashesAndReplace };
