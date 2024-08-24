const fs = require("fs");
const path = require("path");
function getRecentTree(objectsPath, commitHash) {
  const recentCommit = fs
    .readFileSync(path.join(objectsPath, commitHash.slice(0, 8), commitHash.slice(8))
    )
    .toString();
  const recentTreeHash = recentCommit.split("\n")[0].split(" ")[1];
  const recentTreeDirPath = path.join(objectsPath, recentTreeHash.slice(0, 8));
  const recentTreeFileName = recentTreeHash.slice(8);
  return {recentTreeDirPath, recentTreeFileName};
}

function getTree(commitsPath, objectsPath) {
  const commits = fs.readFileSync(commitsPath).toString();
  const commitsSplit = commits.split("\n");
  const commitHash = commitsSplit[0].split(" ")[1];
  const {recentTreeDirPath, recentTreeFileName} = getRecentTree(objectsPath, commitHash);
  return {recentTreeDirPath, recentTreeFileName};
}

function getCbitIgnoreContent(targetPath) {
  return fs.readFileSync(path.join(targetPath, '.cbitignore')).toString().trim().split("\n");
}
module.exports = {getTree, getRecentTree,getCbitIgnoreContent};