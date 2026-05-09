export const convertToPascalCase = (s) => {
  const r = s.replace(
    /\w+/g,
    (word) => word[0].toUpperCase() + word.slice(1).toLowerCase(),
  );
  return r.split(" ").join("");
};
