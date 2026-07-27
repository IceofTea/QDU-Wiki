function getCurrentSeason() {
  var now = new Date();
  var year = now.getFullYear();
  var date = now.getTime();

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

document.addEventListener('DOMContentLoaded', function() {
  var season = getCurrentSeason();
  var names = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

  // 首页横幅（从图片原路径推断文件夹位置，保证子页面也别路径）
  document.querySelectorAll('img[data-seasonal]').forEach(function(img) {
    var dir = img.src.substring(0, img.src.lastIndexOf('/') + 1);
    img.src = dir + season + '.png';
    img.alt = '校园' + names[season] + '景';
  });

  // 导航栏校徽
  var logo = document.querySelector('.md-logo img, .md-header__button img');
  if (logo) {
    var dir = logo.src.substring(0, logo.src.lastIndexOf('/') + 1);
    logo.src = dir + 'logo-' + season + '.png';
  }
});
