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

var season = getCurrentSeason();
var names = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

// 首页横幅——DOM 就绪后立刻替换
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('img[data-seasonal]').forEach(function(img) {
    var dir = img.src.substring(0, img.src.lastIndexOf('/') + 1);
    img.src = dir + season + '.png';
    img.alt = '校园' + names[season] + '景';
  });
});

// 校徽——等所有资源加载完毕后再替换（包括 Material 主题的异步渲染）
window.addEventListener('load', function() {
  // 遍历所有可能的 logo 选择器
  var selectors = ['.md-logo img', '.md-header__button img', '.md-logo a img', 'header img[alt="logo"]'];
  for (var i = 0; i < selectors.length; i++) {
    var imgs = document.querySelectorAll(selectors[i]);
    for (var j = 0; j < imgs.length; j++) {
      var dir = imgs[j].src.substring(0, imgs[j].src.lastIndexOf('/') + 1);
      imgs[j].src = dir + 'logo-' + season + '.png';
    }
  }
});
