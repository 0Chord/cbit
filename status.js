const fs = require("fs");
const path = require("path");

function status(targetDirPath) {
  const indexPath = path.join(targetDirPath, `.cbit`, `index`, `index.txt`);
  if (fs.existsSync(indexPath)) {
    const files = JSON.parse(fs.readFileSync(indexPath));
    files.forEach((file) => {
      const fullPath = path.join(targetDirPath,file.file);
      if (!file.hashValue) {
        console.log("삭제된 파일 목록: ", fullPath);
      }else{
        console.log("변경된 파일 목록: ", fullPath);
      }
    });
  } else {
    console.log("커밋할 사항 없음, 작업 폴더 깨끗함");
  }
}

module.exports = {status}