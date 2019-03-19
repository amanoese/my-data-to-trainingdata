#!/usr/bin/env node
const program = require('commander');

const _ = require('lodash')
const im = require('imagemagick');
const Papa = require('papaparse')

const path = require('path');
const fs = require('fs').promises;
const fsOld = require('fs');

program
  .version('1.0.0')
  .arguments('[path]')
  .parse(process.argv);

let dir = './setting';
let ndir = './negative-setting';

let outDir = './train-data';
let outNDir = './negative-train-data';

[outDir,outNDir].forEach(str=>{
  if (!fsOld.existsSync(str)){ fsOld.mkdirSync(str); }
})

program.args.forEach(async imgPath=>{
  let imgName = path.parse(imgPath).name
  //im.convert([imgPath, '-resize', '416x416', 'kittens-small.jpg'])
  im.identify(imgPath, async function(err, { width, height, ...features}){
    if (err) throw err;
    console.log(width,height);
    // { format: 'JPEG', width: 3904, height: 2622, depth: 8 }
    let x_scale = 416 / width
    let y_scale = 416 / height

    let csvContent = await fs.readFile(`${dir}/${imgName}.txt`, 'utf8');
    console.log(csvContent )
    let csvss = Papa.parse(csvContent, {header: false, delimiter:' '}).data;
    let newData = csvss
      .map(line=>[line[0],line[1]*x_scale,line[2]*y_scale,line[3]*x_scale,line[4]*y_scale]) //scale
      .map(line=>[...line.slice(0,3),line[2]/2,line[3]/2]); //format

    await fs.writeFile(`${outDir}/${imgName}.txt`,newData.map(line=>line.join(' ')).join('\n'))
  });
})

