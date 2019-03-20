#!/usr/bin/env node
const program = require('commander');
const Papa = require('papaparse')
const fs = require('fs')
const fsPromises = require('fs').promises;
const path = require('path')
const JSZip = require('jszip')
const pMap = require('p-map')
const _ = require('lodash')

const pLimit = require('p-limit');
const pLimit4 = pLimit(4);


var PDFImage = require("pdf-image").PDFImage;

program
  .version('1.0.0')
  .option('-c, --csv [file]', 'input source csv file')
  .option('-z, --zip [file]', 'input json Wrap zip file')
  .option('-p, --pdf [file]', 'input json Wrap pdf file')
  .parse(process.argv);

if(!program.csv || !program.zip || !program.pdf) {
  console.log('require --csv and --zip option and --pdf option');
  return 1
}

let pdfName = path.parse(program.pdf).name
let fileName = path.parse(program.csv).name;

(async ()=>{

  //
  // zip json
  //
  let zip = await JSZip.loadAsync(fs.readFileSync(program.zip))

  let promises = await zip.filter((path,file)=> /db\.json$/.test(path))
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

  let dir = './positive-setting';
  let ndir = './negative-setting';
  let imageDir = './images';

  [dir,ndir,imageDir].forEach(str=>{
    if (!fs.existsSync(str)){ fs.mkdirSync(str); }
  })

  await maybeTitlePages
    .map(index=>[titleObj[index],index])
    .filter(([v])=>v)
    .map(([v,index])=>{
      console.log(`${dir}/${pdfName}-${index}.txt`,`title ${v}`)
      return fsPromises.appendFile(`${dir}/${pdfName}-${index}.txt`,`title ${v}\n`)
    })

  await maybeBodyPages
    .map(index=>[bodyObj[index],index])
    .filter(([v])=>v)
    .map(([v,index])=>{
      console.log(`${dir}/${pdfName}-${index}.txt`,`body ${v}`)
      return fsPromises.appendFile(`${dir}/${pdfName}-${index}.txt`,`body ${v}\n`)
    })

    let negativePages = _.difference(_.range(1,_.max(maybeBodyPages)),maybeBodyPages)

    await negativePages.map(index=>{
      console.log(`${ndir}/${pdfName}-${index}.txt`)
      return fsPromises.appendFile(`${ndir}/${pdfName}-${index}.txt`,'')
    })

    let pdfImage = new PDFImage(program.pdf, {
      convertExtension : 'png',
      outputDirectory: '/tmp/',
      convertOptions: {
        '-flatten': '',
        '-filter': 'lanczos',
        '-quality': '100'
      }
    });
    console.log(pdfImage)

    let convertTasks = _.range(0,_.max(maybeBodyPages)).map(pageIndex=>{
      return pLimit4(async () => {
      // 0-th page (first page) of the slide.pdf is available as slide-0.png
        let imagePath = await pdfImage.convertPage(pageIndex)
        let {name,ext} = path.parse(imagePath);
        let outPath = imageDir + '/' + name.replace(/-(\d+)$/,(_,num)=>`-${+num+1}${ext}`);
        await fsPromises.writeFile(outPath,await fsPromises.readFile(imagePath))
        console.log(outPath)
      })
    });
    await Promise.all(convertTasks)
})();



