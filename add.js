const fs = require("fs");
const path = require("path");
const {createHash} = require("crypto");
const {createGzip} = require("node:zlib");
const {pipeline} = require("node:stream/promises");
const {createReadStream, createWriteStream} = fs;
const {getTree, readFilePaths} = require("./utils");


function createIndexFile(targetDirPath, indexList) {
  const indexPath = path.join(targetDirPath, `.cbit`, `index`, `index.txt`);
  fs.writeFileSync(indexPath, JSON.stringify(indexList, null, 2));
}

async function fileZip(targetDirPath) {
  const indexList = [];
  const filePaths = readFilePaths(targetDirPath, targetDirPath);
  for (const file of filePaths) {
    const filePath = path.join(targetDirPath, file);
    const gzip = createGzip();
    const source = createReadStream(filePath);
    const destination = createWriteStream(`${file}.gz`);

    await pipeline(source, gzip, destination);

    const fileContent = fs.readFileSync(
      path.join(targetDirPath, destination.path)
    );

    const hashValue = createHash("sha256")
      .update(fileContent + file)
      .digest("hex");
    indexList.push({file, hashValue, fileContent});
  }
  return {indexList, filePaths};
}

function deleteZips(targetDirPath, fileList) {
  fileList.forEach((file) => {
    fs.unlinkSync(path.join(targetDirPath, `${file}.gz`));
  });
}


async function add(targetDirPath) {
  const recentTree = new Map();

  const commitsPath = path.join(targetDirPath, `.cbit`, `index`, `commits`);
  const objectsPath = path.join(targetDirPath, `.cbit`, `objects`);
  const {indexList, filePaths} = await fileZip(targetDirPath);

  if (fs.existsSync(commitsPath)) {
    const {recentTreeDirPath, recentTreeFileName} = getTree(commitsPath, objectsPath);
    fs.readFileSync(path.join(recentTreeDirPath, recentTreeFileName))
      .toString()
      .trim()
      .split("\n")
      .forEach((item) => {
        const [hashValue, fileSize, fileName, isChanged] = item.split(", ");
        recentTree.set(fileName, {hashValue, isChanged});
      });

    const filteredIndexList = indexList.filter((item) => {
      if (recentTree.get(item.file)) {
        return item.hashValue !== recentTree.get(item.file).hashValue;
      }
      return true;
    });
    const indexFileList = indexList.map(el => el.file);
    Array.from(recentTree.keys()).forEach(fileName => {
      if (fileName !== 'undefined' && !indexFileList.includes(fileName) && recentTree.get(fileName).isChanged !== "deleted") {
        filteredIndexList.push({
          file: fileName,
          hashValue: null,
        })
      }
    })
    createIndexFile(targetDirPath, filteredIndexList);
  } else {
    createIndexFile(targetDirPath, indexList);
  }
  deleteZips(targetDirPath, filePaths);
}

module.exports = {add}
