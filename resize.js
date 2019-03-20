#!/usr/bin/env node
const program = require('commander');

const _ = require('lodash')
const im = require('imagemagick');
const Papa = require('papaparse')

const path = require('path');
const fs = require('fs').promises;
const fsOld = require('fs');
const math = require('mathjs')

program
  .version('1.0.0')
  .arguments('[path]')
  .parse(process.argv);

let dir = './positive-setting';
let ndir = './negative-setting';

let outDir = './positive-train-data';
let outNDir = './negative-train-data';

let names = {
  'title' : 0,
  'body'  : 1,
};

[outDir,outNDir].forEach(str=>{
  if (!fsOld.existsSync(str)){ fsOld.mkdirSync(str); }
})

program.args.forEach(async imgPath=>{
  let imgName = path.parse(imgPath).name
  im.convert([imgPath, '-resize', '416x416!', 'out-100.jpg'])
  im.identify(imgPath, async function(err, { width, height, ...features}){
    if (err) throw err;
    console.log(width,height);
    // { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
    let x_scale = 416 / width
    let y_scale = 416 / height

    let csvContent = await fs.readFile(`${dir}/${imgName}.txt`, 'utf8');
    let csvss = Papa.parse(csvContent, {header: false, delimiter:' '}).data;
    let newData = csvss
      .filter(line=>line.length===5)
      .map(line=>[line[0],...math.dotMultiply(line.slice(1),[x_scale,y_scale,x_scale,y_scale])]) //scale
      .map(line=>[line[0],...math.add(line.slice(1),[line[3]/2,line[4]/2,0,0])]) //format
      .map(line=>[names[line[0]],line.slice(1)]); //format name
    await fs.writeFile(`${outDir}/${imgName}.txt`,newData.map(line=>line.join(' ')).join('\n'))
  });
})

