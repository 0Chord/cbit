const fs = require("fs");
const path = require("path");
const {getRecentTree} = require("./utils");
const CHANGED = "changed";
const DELETED = "deleted";

function log(targetDirPath) {
  const commitsPath = path.join(targetDirPath,`.cbit`,`index`,`commits`);
  const objectsPath = path.join(targetDirPath,`.cbit`,`objects`);
  if (fs.existsSync(commitsPath)) {
    const commits = fs.readFileSync(commitsPath).toString();
    const commitsSplit = commits.split("\n");
    commitsSplit.forEach((commit) => {
      console.log(commit);
      const commitHash = commit.split(" ")[1];
      const {recentTreeDirPath, recentTreeFileName} = getRecentTree(objectsPath, commitHash);
      const recentTree = fs
        .readFileSync(path.join(recentTreeDirPath,recentTreeFileName))
        .toString()
        .split("\n");
      recentTree.forEach((blob) => {
        const blobSplit = blob.split(", ");
        if (blobSplit[3] === CHANGED) {
          console.log(`수정함:        ${blobSplit[2]}`);
        }else if (blobSplit[3] === DELETED){
          console.log(`삭제함:        ${blobSplit[2]}`);
        }
      });
    });
  } else {
    console.log("커밋 로그 기록 없음");
  }
}

module.exports = {log}
