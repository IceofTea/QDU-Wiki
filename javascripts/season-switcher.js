function getCurrentSeason() {
  var now = new Date();
  var year = now.getFullYear();
  var date = now.getTime();

  // 节气近似日期（阳历）
  var seasons = [
    { name: 'spring', start: new Date(year, 2, 20).getTime(), end: new Date(year, 5, 20).getTime() },
    { name: 'summer', start: new Date(year, 5, 21).getTime(), end: new Date(year, 8, 22).getTime() },
    { name: 'autumn', start: new Date(year, 8, 23).getTime(), end: new Date(year, 11, 21).getTime() },
    { name: 'winter', start: new Date(year, 11, 22).getTime(), end: new Date(year + 1, 2, 19).getTime() }
  ];

  for (var i = 0; i < seasons.length; i++) {
    if (date >= seasons[i].start && date <= seasons[i].end) return seasons[i].name;
  }
  return 'spring';
}

// 替换带 data-seasonal 属性的图片
document.querySelectorAll('img[data-seasonal]').forEach(function(img) {
  var season = getCurrentSeason();
  var names = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };
  img.src = 'assets/' + season + '.png';
  img.alt = '校园' + names[season] + '景';
});

// 替换带 data-seasonal-logo 属性的导航栏校徽
function switchLogo() {
  var season = getCurrentSeason();
  var logo = document.querySelector('.md-logo img, .md-header__button img');
  if (logo) {
    logo.src = 'assets/logo-' + season + '.png';
  }
}
window.addEventListener('load', switchLogo);
