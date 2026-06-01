//const fs = require("node:fs");

import fs from "node:fs";

function createDir(realPath) {
    if (!fs.existsSync(realPath)) {
      fs.mkdirSync(realPath, { recursive: true });
    }
}

function copyRecursive(src, target){
    fs.cpSync(src, target, {recursive: true});
}



//module.exports = { createDir, copyRecursive };
export { createDir, copyRecursive }; 