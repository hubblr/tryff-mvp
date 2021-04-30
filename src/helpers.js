const { hourShift } = require("./lambda/carrierService/constants");

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

/* PRICE HELPERS */

const normalizePrice = (price, inCents = true) => {
  if (!price) {
    return 0;
  }
  return inCents ? price * 100 : price;
};

exports.normalizePrice = normalizePrice;
exports.calcCartValue = (items) => {
  return items.reduce((accumulator, { price, quantity }) => {
    return accumulator + normalizePrice(price * quantity, false);
  }, 0);
};

/* TIME */

exports.mapDateToDateString = (day) => {
  switch (day) {
    case 1:
      return "Monday";
    case 2:
      return "Tuesday";
    case 3:
      return "Wednesday";
    case 4:
      return "Thursday";
    case 5:
      return "Friday";
    case 6:
      return "Saturday";
    case 7:
      return "Sunday";
  }
};

const getCurrentTime = () => {
  const localTime = new Date();
  const utc = new Date(
    localTime.getTime() + localTime.getTimezoneOffset() * 60000
  );
  return new Date(utc.getTime() + hourShift * 3600000);
};
exports.getCurrentTime = getCurrentTime;

const splitTimeString = (timeStr) => {
  const [hour, minute] = timeStr.split(":").map((str) => parseInt(str));
  return {
    hour,
    minute,
  };
};

exports.isNowWithinTimeInterval = ({ startTime, endTime }) => {
  const now = getCurrentTime();
  const curHour = now.getHours();
  const curMinute = now.getMinutes();

  // check if before start time
  if (startTime) {
    const startTimeObj =
      typeof startTime === "string" ? splitTimeString(startTime) : startTime;
    const { hour: startHour, minute: startMinute } = startTimeObj;
    if (
      curHour < startHour ||
      (curHour === startHour && curMinute < startMinute)
    ) {
      return false;
    }
  }

  // check if after end time
  if (endTime) {
    const endTimeObj =
      typeof endTime === "string" ? splitTimeString(endTime) : endTime;
    const { hour: endHour, minute: endMinute } = endTimeObj;
    if (curHour > endHour || (curHour === endHour && curMinute > endMinute)) {
      return false;
    }
  }

  return true;
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
