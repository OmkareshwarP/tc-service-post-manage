const getCurrentTime = () => {
  const now = Date.now();
  return now;
};

const getCurrentEpochTimestamp = (): number => {
  return +getCurrentTime();
};

const getCurrentEpochTimestampInSeconds = (): number => {
  const now = Date.now();
  return Math.floor(now / 1000);
};

export { getCurrentTime, getCurrentEpochTimestamp, getCurrentEpochTimestampInSeconds };
