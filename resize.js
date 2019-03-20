#!/usr/bin/env node
const program = require('commander');

const _ = require('lodash')
const im = require('imagemagick');
const Papa = require('papaparse')

const path = require('path');
const fs = require('fs').promises;
const fsOld = require('fs');
const util = require('util');
const math = require('mathjs')

const pLimit = require('p-limit');
const pLimit4 = pLimit(4);

program
  .version('1.0.0')
  .arguments('[path]')
  .parse(process.argv);

let dir = './positive-setting';
let ndir = './negative-setting';
let imagedir = './images';

let outDir = './train-data';

let names = {
  'title' : 0,
  'body'  : 1,
};

[outDir].forEach(str=>{
  if (!fsOld.existsSync(str)){ fsOld.mkdirSync(str); }
});

;(async ()=>{
  let tasks = program.args.map(filePath=>{
    return pLimit4(async () => {
      let fileName = path.parse(filePath).name
      let imgPath = path.join(imagedir,fileName+'.png')
      let pdfPath = path.join('./',fileName.replace(/-(\d+)$/,(_,num)=>`.pdf[${num-1}]`))
      let outTxtPath =  path.join(outDir,fileName+'.txt')
      let outImgPath =  path.join(outDir,fileName+'.png')

      //im.convert([imgPath, '-resize', '416x416!', outImgPath])

      let pdfsize = await util.promisify(im.identify)(['-format', '%@', pdfPath ]);
      let {width , height} = await util.promisify(im.identify)(imgPath);
      let [ _1,_2, p_w, p_h ] = pdfsize.split(/\+|x| /)
      //let [ width, height ] = [595 , 841];
      //let [ width, height ] = [620,920]
      //669x916

      // { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
      let x_scale = 416 / width;
      let y_scale = 416 / height;

      let csvContent = await fs.readFile(filePath, 'utf8');
      let csvss = Papa.parse(csvContent, {header: false, delimiter:' '}).data;
      let newData = csvss
        .filter(line=>line.length===5)
        .map(line=>[line[0],...math.add(line.slice(1),[p_w,p_h,0,0])]) //format
        .map(line=>[line[0],...math.dotMultiply(line.slice(1),[x_scale,y_scale,x_scale,y_scale])]) //scale
        .map(line=>[names[line[0]],...line.slice(1)]); //format name
      await fs.writeFile(outTxtPath,newData.map(line=>line.join(' ')).join('\n'));
      console.log(imgPath);
    });
  });
  await Promise.all(tasks);
})();
