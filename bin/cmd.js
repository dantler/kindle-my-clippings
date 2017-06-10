#!/usr/bin/env node

var minimist = require('minimist');
var fs = require('fs');

var clippings = require('../clippings');

var argv = minimist(process.argv.slice(2), {
  alias: {h: 'help', i: 'input', o: 'output', f: 'format', l: 'location', s: 'start', b: 'book'}
});

if (argv.help) {
  return fs.createReadStream(__dirname + '/usage.txt').pipe(process.stdout);
}

var fileName = argv.input || 'My Clippings.txt';
var fileNameArray = fileName.split(',');

clippings.getTitles(fileNameArray, function (titles, collection) {
  if (argv.book) {
    next(titles, collection, argv.book);
  }
  else {
    titles.forEach(function (t, index) {
      index++;
      console.log(index + ' - ' + t);
    });
    process.stdin.resume();
    process.stdout.write("Choose a title to display: ");
    process.stdin.once("data", function (data) {
      var bookNumber = data.toString().trim();
      next(titles, collection, bookNumber);
    });
  }
});


function next(titles, collection, bookNumber) {
  var chosenTitle = titles[bookNumber - 1];
  var book = clippings.getBook(collection, chosenTitle, argv.start);
  var text;
  if (argv.format && argv.format === 'json') {
    text = JSON.stringify(book);
  }
  else {
    text = chosenTitle + '\n';
    if (argv.format && argv.format === 'david') {
      text += '\n'
      var dateFormat = require('dateformat');
      var started = dateFormat(clippings.getBookDuration(book).started, "yyyy-mm-dd");
      text += 'READ: ' + started;
      text += ' | RATING:  x/10 '
      text += '\n\n'
    }
    text += '============\n\n';
    text += clippings.getText(book, argv.location);
  }
  if (argv.output) {
    fs.writeFileSync(argv.output, text);
  }
  else {
    process.stdout.write(text);
  }
  process.stdin.pause();
}
