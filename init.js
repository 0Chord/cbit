const fs = require("fs");
const path = require("path");

function init(targetDirPath) {
  const targetDir = path.join(targetDirPath, ".cbit");
  const indexPath = path.join(targetDir, "index");
  const objectsPath = path.join(targetDir, "objects");
  fs.writeFileSync(path.join(targetDirPath, '.cbitignore'),'.cbitignore\n.cbit');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, {recursive: true});
    fs.mkdirSync(indexPath);
    fs.mkdirSync(objectsPath);
  }
}

module.exports = {init}
