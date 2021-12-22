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

const strongs = require('strongs');
const nodeSwordInterface = require('node-sword-interface');
const fs = require('fs');

const nsi = new nodeSwordInterface();
const DEBUG = false;

async function getNumberOfOccurrences(key) {
  var results = await nsi.getModuleSearchResults('KJV', key, undefined, 'strongsNumber');
  return results.length;
}

async function main() {
  var count = 0;

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

  var occurrenceMap = {};
  var totalEntryCount = Object.entries(strongs).length;

  if (!DEBUG) {
    console.log(`Generating strongs_occurrences.json for ${totalEntryCount} entries! WARNING: This is a lengthy process.`);
    console.log('');
  }

  var percentageDone = (0).toFixed(2);

  for (const [key, object] of Object.entries(strongs)) {
    process.stdout.write(`Getting occurrences for ${key} [${count + 1} out of ${totalEntryCount} / ${percentageDone} %]: `);
    var occurrences = await getNumberOfOccurrences(key);
    console.log(occurrences);

    occurrenceMap[key] = occurrences;
    count += 1;

    percentageDone = (count / totalEntryCount * 100).toFixed(2);
    if (DEBUG && count >= 2) {
      break;
    }
  }

  const occurrencesString = JSON.stringify(occurrenceMap, null, 2);

  try {
    fs.writeFileSync('strongs_occurrences.json', occurrencesString);
  } catch (error) {
    console.error(err);
  }
}

main();
