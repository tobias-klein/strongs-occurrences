/* This file is part of strongs-occurrences.

   Copyright (C) 2021 Tobias Klein <contact@tklein.info>

   strongs-occurrences is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 2 of the License, or
   (at your option) any later version.

   strongs-occurrences is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with strongs-occurrences. See the file LICENSE.
   If not, see <http://www.gnu.org/licenses/>. */

const nodeSwordInterface = require('node-sword-interface');
const fs = require('fs');

const nsi = new nodeSwordInterface();
const DEBUG = false;

function getNormalizedStrongsId(strongsId) {
  if (strongsId == undefined) {
    return undefined;
  }

  var strongsNumber = parseInt(strongsId.substring(1));
  strongsId = strongsId[0] + strongsNumber;
  return strongsId;
}

function getStrongsIdsFromStrongsElement(strongsElement) {
  var strongsIds = [];

  if (strongsElement) {
    strongsElement.classList._set.forEach((cls) => {
      if (cls.startsWith('strong:')) {
        const strongsId = getNormalizedStrongsId(cls.slice(7));
        strongsIds.push(strongsId);
      }
    });
  }

  return strongsIds;
}

function getOccurrenceMap() {
  var count = 0;
  var occurrenceMap = {};

  nsi.enableMarkup();
  var kjvVerses = nsi.getBibleText('KJV');

  const { parse } = require('node-html-parser');

  for (let i = 0; i < kjvVerses.length; i++) {
    let verse = kjvVerses[i];
    let content = verse.content;
    const html = parse(content);
    const wElements = html.querySelectorAll('w');

    let currentVerseStrongsIds = [];

    wElements.forEach((w) => {
      let strongsIds = getStrongsIdsFromStrongsElement(w);

      strongsIds.forEach((id) => {
        if (!currentVerseStrongsIds.includes(id)) {
          if (occurrenceMap.hasOwnProperty(id)) {
            occurrenceMap[id] += 1;
          } else {
            occurrenceMap[id] = 1;
          }

          currentVerseStrongsIds.push(id);
        }
      });
    });

    count += 1;

    if (DEBUG && count >= 10) {
      break;
    }
  }

  return occurrenceMap;
}

function getSortedMap(map) {
  let keys = Object.keys(map);
  let hKeys = [];
  let gKeys = [];

  keys.forEach((key) => {
    let letter = key[0];

    if (letter == 'H') {
      hKeys.push(key);
    } else {
      gKeys.push(key);
    }
  });

  hKeys.sort(sortKeys);
  gKeys.sort(sortKeys);

  let sortedKeys = hKeys;
  gKeys.forEach((key) => {
    sortedKeys.push(key);
  });

  let sortedMap = {};
  sortedKeys.forEach((key) => {
    sortedMap[key] = map[key];
  });

  return sortedMap;
}

function sortKeys(a, b) {
  a = Number(a.slice(1));
  b = Number(b.slice(1));

  return a - b;
}

async function main() {
  var kjvAvailable = nsi.isModuleInUserDir('KJV');
  if (!kjvAvailable) {
    process.stdout.write('Updating repository config ... ');
    await nsi.updateRepositoryConfig();
    console.log('Done!');

    process.stdout.write('Installing KJV ... ');
    await nsi.installModule('KJV');

    console.log('Done!');
    console.log('');
  }

  if (!DEBUG) {
    console.log(`Generating strongs_occurrences.json!`);
    console.log('');
  }

  const occurrenceMap = getOccurrenceMap();
  const sortedOccurrenceMap = getSortedMap(occurrenceMap);
  const occurrencesString = JSON.stringify(sortedOccurrenceMap, null, 2);

  try {
    fs.writeFileSync('strongs_occurrences.json', occurrencesString);
  } catch (error) {
    console.error(err);
  }
}

main();
