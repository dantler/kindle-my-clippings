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
  var chosenSubtitle = '';
  var book = clippings.getBook(collection, chosenTitle, argv.start);
  var text;

  if (argv.format && argv.format === 'json') {
    text = JSON.stringify(book);
  }
  else {
    if (argv.format && argv.format === 'md') {
      var dateFormat = require('dateformat');
      var hasSubtitle = chosenTitle.split(':')[1];

      if (hasSubtitle) {
        chosenSubtitle = chosenTitle.split(':')[1].trim();
        chosenTitle = chosenTitle.split(':')[0].trim();
      }
      text =    'layout:            booknotes'
      text += '\ntitle:             \'' + chosenTitle + '\'';
      text += '\nsubtitle:          \'' + chosenSubtitle + '\'';
      text += '\nbook_author:       \'' + book[0].author + '\''
      text += '\nlanguage:          en_US'
      text += '\nbook_rating:       x'
      text += '\nisbn:              978-xxx'
      text += '\nread_date_start:   \'' + dateFormat(clippings.getBookDuration(book).started, "yyyy-mm-dd") +'\''
      text += '\nread_date_end:     \'' + dateFormat(clippings.getBookDuration(book).finished, "yyyy-mm-dd") + '\''
      text += '\ntags:'
      text += '\n  - books'
      text += '\n\n-------\n\n'
      text += 'Paste blurb here'
      text += '\n\n-------\n\n'
      text += '## my notes\n\n'
      book_text = clippings.getText(book, argv.location);
      text += book_text.replace(/---------[-]/g, '');
    }
    else if (argv.format && argv.format === 'david') {
      text = chosenTitle;
      text += ' (' + book[0].author + ')\n';
      var dateFormat = require('dateformat');
      var started = dateFormat(clippings.getBookDuration(book).started, "yyyy-mm-dd");
      text += 'READ: ' + started;
      text += ' | RATING:  x/10 '
      text += '\n\n'
      text += '------------\n\n';
      book_text = clippings.getText(book, argv.location);
      text += book_text.replace(/---------[-]/g, '');
    }
    else
    {
      text = chosenTitle;
      text += '\n============\n\n';
      text += clippings.getText(book, argv.location);
    }
  }
  if (argv.output) {
    fs.writeFileSync(argv.output, text);
  }
  else {
    process.stdout.write(text);
  }
  process.stdin.pause();
}
