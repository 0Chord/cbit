const fs = require("fs");
const os = require('os');
const path = require("path");
const {createGunzip} = require("node:zlib");
const {pipeline} = require("node:stream/promises");
const {createReadStream, createWriteStream} = fs;

const DELETED = "deleted";

async function restoreFiles(fileList, targetDirPath, commits, lastCommitIndex, commitsPath, objectsPath, commitDirPath, commitFileName) {
  const newCommits = commits.slice(lastCommitIndex);

  fs.writeFileSync(commitsPath, newCommits.join("\n"));
  const commitFile = fs
    .readFileSync(path.join(objectsPath, commitDirPath, commitFileName))
    .toString();
  const recentTreeHash = commitFile.split("\n")[0].split(" ")[1];
  const recentTreeDirPath = path.join(objectsPath, recentTreeHash.slice(0, 8));
  const recentTreeFileName = recentTreeHash.slice(8);
  const recentTree = [];
  fs.readFileSync(path.join(recentTreeDirPath, recentTreeFileName))
    .toString()
    .trim()
    .split("\n")
    .forEach((item) => {
      const [hashValue, fileSize, fileName, isChanged] = item.split(", ");
      recentTree.push([hashValue, fileSize, fileName, isChanged]);
    });
  for (const tree of recentTree) {
    if (tree[3] !== DELETED && tree[2] !== 'undefined') {
      let separator = '/';
      if (os.platform() === 'win32') {
        separator = '\\';
      }
      if (fs.existsSync(path.join(targetDirPath, tree[2]))) {
        fs.unlinkSync(path.join(targetDirPath, tree[2]));
      }
      const targetPath = path.join(targetDirPath, tree[2]).split(separator).slice(0, -1).join(separator);
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, {recursive: true});
      }

      const blobDirPath = tree[0].slice(0, 8);
      const blobFileName = tree[0].slice(8);
      const gunzip = createGunzip();
      const compressedSource = createReadStream(
        path.join(objectsPath, blobDirPath, blobFileName)
      );
      const decompressedDestination = createWriteStream(tree[2]);
      await pipeline(compressedSource, gunzip, decompressedDestination);
    }
  }
}

async function restore(targetDirPath, commitHash) {
  console.log(commitHash);
  const commitsPath = path.join(targetDirPath, `.cbit`, `index`, `commits`);
  const objectsPath = path.join(targetDirPath, `.cbit`, `objects`);
  if (fs.existsSync(commitsPath)) {
    const commits = fs.readFileSync(commitsPath).toString().trim().split("\n");
    const commitsSplit = commits.map((item) => item.split(" "));

    let lastCommitIndex = -1;
    commitsSplit.forEach((commit, idx) => {
      if (commit[1].slice(0, commitHash.length) === commitHash) {
        lastCommitIndex = idx;
      }
    });
    const list = fs.readdirSync(targetDirPath);
    const fileList = list.filter((item) => fs.statSync(item));
    if (lastCommitIndex !== -1 && commitHash.length === 8) {
      const shortCommitHashList = fs.readdirSync(path.join(objectsPath, commitHash));
      if (shortCommitHashList.length === 1) {
        await restoreFiles(fileList, targetDirPath, commits, lastCommitIndex, commitsPath, objectsPath, commitHash, shortCommitHashList[0]);
      }
    } else if (lastCommitIndex !== -1 && commitHash.length === 64) {
      const commitDirPath = commitHash.slice(0, 8);
      const commitFileName = commitHash.slice(8);
      await restoreFiles(fileList, targetDirPath, commits, lastCommitIndex, commitsPath, objectsPath, commitDirPath, commitFileName);
    }
  }
}

module.exports = {restore}

