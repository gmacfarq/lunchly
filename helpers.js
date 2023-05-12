"use strict"

/** Accepts array of strings: words
 * Returns: the same array
 * with each string having capital first letter
 * and all other letters lowercase*/
function capitalizeWords(words){
  return words.map(word => {
    let firstLetter = word.charAt(0).toUpperCase();
    let otherLetters = word.substring(1).toLowerCase();
    word = firstLetter + otherLetters;
    return word;
  });
}

module.exports = {capitalizeWords}