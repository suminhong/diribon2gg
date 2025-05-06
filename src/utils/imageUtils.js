export const formatDigimonNameForImage = (name) => {
  return name
    .toLowerCase() // 대문자를 소문자로
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거 (영문자, 숫자, 공백, 하이픈만 남김)
    .replace(/\s+/g, '-'); // 공백을 하이픈으로 변경
};

export const getDigimonImageUrl = (name) => {
  const formattedName = formatDigimonNameForImage(name);
  return `https://www.grindosaur.com/img/games/digital-tamers-2/icons/${formattedName}-icon.png`;
};
