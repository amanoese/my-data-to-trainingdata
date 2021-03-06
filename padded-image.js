#!/usr/bin/env node
const program = require('commander');

require('lodash.product');
const _ = require('lodash')

const path = require('path');
const jimp = require('jimp')

program
  .version('1.0.0')
  .arguments('[path]')
  .parse(process.argv);

program.parse(process.argv);

console.log(program)

program.args.forEach(async imgPath=>{
  let imgName = path.parse(imgPath).name

  let img = await jimp.read(imgPath)

  let gaussianParams = _.range(1,3)
  let brightnessParams = _.range(-20,20,20).map(v=>v/100)
  let contrastParams = _.range(-20,20,20).map(v=>v/100)

  _.product(gaussianParams,brightnessParams,contrastParams).forEach(([a,b,c],i)=>{
    setTimeout(()=>{
      img.clone().gaussian(a).brightness(b).contrast(c).writeAsync(`pad-data/${imgName}-${i}.png`)
    });
  })
})
