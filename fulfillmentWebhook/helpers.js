/* GENERIC TEXT HELPERS */

exports.fillDynamicText = (
  text,
  dict,
  { matchStart = "{", matchEnd = "}" } = {}
) => {
  const replaceStrRegex = new RegExp(
    `${matchStart}(${Object.keys(dict).join("|")})${matchEnd}`,
    "g"
  );
  return text.replace(replaceStrRegex, (fullMatch, matchedKey) => {
    return dict[matchedKey];
  });
};

/* RANDOM GENERATION */

exports.randomNumberString = (digitCount) => {
  let numberString = "";
  let remainingDigits = digitCount;

  // only add 15 digits per iteration because of precision of Math.random
  while (remainingDigits > 0) {
    const addedDigits = remainingDigits >= 15 ? 15 : remainingDigits;
    numberString = `${numberString}${Math.random()
      .toString()
      .substring(2, addedDigits + 2)}`;
    remainingDigits -= 15;
  }

  return numberString;
};
