const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");
const {getRecentTree} = require("./utils");

const CHANGED = "changed";
const NOCHANGED = "no_changed";
const DELETED = "deleted";

function makeTreeAndCommit(tree, objectsPath) {
  const treeHash = createHash("sha256").update(tree).digest("hex");
  const treeDirPath = path.join(objectsPath,treeHash.slice(0, 8));
  const treeFileName = treeHash.slice(8);
  if (!fs.existsSync(treeDirPath)) {
    fs.mkdirSync(treeDirPath);
  }
  fs.writeFileSync(path.join(treeDirPath,treeFileName), tree);

  const date = new Date();
  const firstLine = `${"0".repeat(64)}, ${treeHash}`;
  const secondLine = date.toString();
  const commit = `${firstLine}\n${secondLine}`;
  const commitHash = createHash("sha256").update(commit).digest("hex");
  const commitDirPath = path.join(objectsPath,commitHash.slice(0, 8));
  const commitFileName = commitHash.slice(8);
  if (!fs.existsSync(commitDirPath)) {
    fs.mkdirSync(commitDirPath);
  }
  fs.writeFileSync(path.join(commitDirPath,commitFileName), commit);
  return {secondLine, commitHash};
}

function commit(targetDirPath) {
  const indexPath = path.join(targetDirPath,`.cbit`,`index`,`index.txt`);

  if (fs.existsSync(indexPath)) {
    const files = JSON.parse(fs.readFileSync(indexPath));
    let tree = "";
    const objectsPath = path.join(targetDirPath,`.cbit`,`objects`);
    const currentChangedFiles = [];
    files.forEach((file) => {
      currentChangedFiles.push(file.file);
      if(!file.hashValue){
        tree += `${file.hashValue}, 0, ${file.file}, ${DELETED}\n`;
      }else{
        const blobDirPath = path.join(objectsPath,file.hashValue.slice(0, 8));
        if (!fs.existsSync(blobDirPath)) {
          fs.mkdirSync(blobDirPath);
        }
        const blobFileName = file.hashValue.slice(8);
        const buffer = Buffer.from(file.fileContent.data);
        fs.writeFileSync(path.join(blobDirPath,blobFileName), buffer);

        tree += `${file.hashValue}, ${buffer.byteLength}, ${file.file}, ${CHANGED}\n`;
      }

    });

    const commitsPath = path.join(targetDirPath,`.cbit`,`index`,`commits`);
    if (!fs.existsSync(commitsPath)) {
      const {secondLine, commitHash} = makeTreeAndCommit(tree, objectsPath);
      const commits = `${"0".repeat(64)} ${commitHash} ${secondLine}`;
      fs.writeFileSync(`${commitsPath}`, commits);
    } else {
      const oldCommits = fs.readFileSync(commitsPath).toString();
      const oldCommitsSplit = oldCommits.split("\n").map((el) => el.split(" "));
      const recentCommitHash = oldCommitsSplit[0][1];
      const {recentTreeDirPath,recentTreeFileName} = getRecentTree(objectsPath, recentCommitHash);
      const recentTree = fs
        .readFileSync(path.join(recentTreeDirPath, recentTreeFileName))
        .toString();
      recentTree
        .split("\n")
        .map((item) => item.split(", "))
        .forEach((item) => {
          if (!currentChangedFiles.includes(item[2])) {
            tree += `${item[0]}, ${item[1]}, ${item[2]}, ${NOCHANGED}\n`;
          }
        });
      const {secondLine, commitHash} = makeTreeAndCommit(tree, objectsPath);
      const newCommits = `${recentCommitHash} ${commitHash} ${secondLine}\n${oldCommits}`;
      fs.writeFileSync(commitsPath, newCommits);
    }
    fs.unlinkSync(indexPath);

  }
}

module.exports = {commit}
