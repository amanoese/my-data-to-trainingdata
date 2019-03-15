#!/usr/bin/env node
const program = require('commander');
const Papa = require('papaparse')
const fs = require('fs')
const path = require('path')
const JSZip = require('jszip')
const pMap = require('p-map')
const _ = require('lodash')

program
  .version('1.0.0')
  .option('-c, --csv [file]', 'input source csv file')
  .option('-z, --zip [file]', 'input json Wrap zip file')
  .parse(process.argv);

if(!program.csv || !program.zip) {
  console.log('require --csv and --zip option');
  return 1
}

let fileName = path.parse(program.csv).name;

(async ()=>{

  //
  // zip json
  //
  let zip = await JSZip.loadAsync(fs.readFileSync(program.zip))

  let promises = await zip.filter((path,file)=> /db\.json$/.test(path))
    .slice(-20)
    .map(zipFile=>zipFile.async('string'));

  let pagess = (await Promise.all(promises)).map(str=>JSON.parse(str).page)

  let maybeTitlePages = pagess.map(pages=>Math.min(...pages)).flat()
  let maybeBodyPages = pagess.flat()
  //console.log({ maybeTitlePages, maybeBodyPages })

  //
  // csv
  //
  let csvContent = fs.readFileSync(program.csv, 'utf8');
  let csvss = Papa.parse(csvContent, {header: !true}).data.slice(1);
  //console.log(csvss)

  let fixCsvss = csvss
    .filter(line=> line.length >= 5)
    .filter(line=>line[3] !== 'matching')
    .map(line=> [ ...line.slice(0,-1),line[5].replace(/- /g,line[0].replace(/^\d+/,'') + ' ') ])
  console.log(fixCsvss)

  let titleSttingList = fixCsvss.map(line=> line[0] + ' ' + line[4]).map(str=>str.split(' false')[0])
  let bodySttingList = fixCsvss.map(line=> line[5].split(';')).flat().map(str=>str.split(' false')[0])

  //console.log({ titleStting, bodyStting})
  let titleObj = _.fromPairs(titleSttingList.map(str=> 
    _.range(...str.split(' ')[0].split('-'))
    .map(index=>[ index, str.replace(/[^ ]+ /,'') ])).flat())

  let bodyObj = _.fromPairs(bodySttingList.map(str=> 
    _.range(...str.split(' ')[0].split('-'))
    .map(index=>[ index, str.replace(/[^ ]+ /,'') ])).flat())
  //console.log({ titleObj , bodyObj })



  // merge

  let dir = './data'
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  maybeTitlePages
    .map(index=>[titleObj[index],index])
    .filter(([v])=>v)
    .forEach(([v,index])=>{
      console.log(`${dir}/${fileName}-${index}.txt`,`title ${v}\n`)
      fs.appendFileSync(`${dir}/${fileName}-${index}.txt`,`title ${v}\n`)
    })

  maybeBodyPages
    .map(index=>[bodyObj[index],index])
    .filter(([v])=>v)
    .forEach(([v,index])=>{
      console.log(`${dir}/${fileName}-${index}.txt`,`body ${v}\n`)
      fs.appendFileSync(`${dir}/${fileName}-${index}.txt`,`body ${v}\n`)
    })
})();



