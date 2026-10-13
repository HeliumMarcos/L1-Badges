// Java 8 Nashorn runner: jjs -scripting scripts/validate-java-patterns.js -- badges.json
// Nuvio compiles java.util.regex.Pattern; validate that engine, not only Python.
var Files = Java.type('java.nio.file.Files');
var Paths = Java.type('java.nio.file.Paths');
var StandardCharsets = Java.type('java.nio.charset.StandardCharsets');
var Pattern = Java.type('java.util.regex.Pattern');
var source = String(new (Java.type('java.lang.String'))(Files.readAllBytes(Paths.get(String(arguments[0] || 'badges.json'))), StandardCharsets.UTF_8));
var data = JSON.parse(source);
var compiled = data.filters.map(function (filter) {
    return {id: filter.id, group: filter.groupId, enabled: filter.isEnabled !== false,
        pattern: Pattern.compile(filter.pattern)};
});
function matched(text, group) {
    return compiled.filter(function (filter) {
        return filter.enabled && (!group || filter.group === group) && filter.pattern.matcher(text).find();
    }).map(function (filter) { return filter.id; }).sort().join(',');
}
function check(text, group, expected) {
    var result = matched(text, group);
    if (result !== expected.sort().join(',')) throw new Error(text + ': ' + result);
}
check('Movie (2016) 2160p BluRay Remux HDR10 DTS-HD.HR7.1 H.265 tt2381991.mkv', null,
    ['4k-ultra-hd','blu-ray-disc','remux','hdr10','dts-hd-high-resolution','71-audio','hevc']);
check('DTS-HD.MA7.1 DTS-X', 'audio-tech', ['dts-hd-master-audio','dts-x']);
check('E-AC-3 5.1', 'audio-tech', ['dolby-digital-plus']);
check('TrueHD7.1.4', 'audio-channels', ['714-audio']);
check('MP32.0', 'audio-channels', ['20-audio']);
var maPositive = [
    'Movie (2026) MA 2160p WEB-DL DDP5.1 H.265.mkv',
    'Movie.2026.MoviesAnywhere.2160p.WEB-DL.AAC2.0.mkv',
    'Movie (2026) 2160p WEB-DL MA DTS-HD MA 7.1 H.265.mkv',
    'Movie (2026) 2160p WEB-DL DTS-HD MA 7.1 MA H.265.mkv',
    'Show S01E01 MA 1080p WEB-DL AAC2.0.mkv',
    '💿 WEB-DL   📺 MA   ⚙️ H.265'
];
var maNegative = [
    'Ma (2019) 1080p WEB-DL AAC2.0.mkv',
    'Movies Anywhere (2026) 1080p WEB-DL AAC2.0.mkv',
    'Show S01E01 Ma and Dad 1080p WEB-DL AAC2.0.mkv',
    'Movie (2026) 2160p BluRay DTS-HD MA 7.1 H.265.mkv',
    'Movie (2026) 2160p BluRay DTS HD   MA 7.1 H.265.mkv',
    'Movie (2026) 2160p BluRay DTS-MA 7.1 H.265.mkv'
];
maPositive.forEach(function (text) { check(text,'streaming',['ma']); });
maNegative.forEach(function (text) { check(text,'streaming',[]); });
var dolbyCases = [
    ['DDP5.1 Atmos DV', ['dolby-vision','dolby-digital-plus','dolby-atmos','51-audio']],
    ['DV DD5.1', ['dolby-vision','dolby-digital','51-audio']],
    ['DoVi E-AC-3 5.1 Dolby Atmos', ['dolby-vision','dolby-digital-plus','dolby-atmos','51-audio']],
    ['Dolby.Vision DD+7.1 Atmos', ['dolby-vision','dolby-digital-plus','dolby-atmos','71-audio']],
    ['TrueHD7.1 Atmos Dolby Vision', ['dolby-vision','truehd','dolby-atmos','71-audio']],
    ['DV Dolby TrueHD 7.1', ['dolby-vision','truehd','71-audio']],
    ['Dolby Vision AC-3 5.1 Atmos', ['dolby-vision','dolby-digital','dolby-atmos','51-audio']],
    ['💎 DV\n🔊 DDP 5.1 Atmos', ['dolby-vision','dolby-digital-plus','dolby-atmos','51-audio']],
    ['DV Atmos', ['dolby-vision','dolby-atmos']],
    ['DV', ['dolby-vision']],
    ['Dolby Atmos', ['dolby-atmos']],
    ['DVI Atmospheric', []],
    ['HDR10 DV TrueHD7.1 Atmos', ['hdr10','dolby-vision','truehd','71-audio','dolby-atmos']]
];
dolbyCases.forEach(function (test) { check(test[0], null, test[1]); });
var combos = compiled.filter(function (filter) { return filter.id.indexOf('vis-') === 0; });
if (combos.length !== 4 || combos.some(function (filter) { return filter.enabled; })) {
    throw new Error('Combined Dolby badges must remain disabled.');
}
print('Java Pattern: ' + compiled.length + ' filters compiled; ' +
    (5+maPositive.length+maNegative.length+dolbyCases.length) + ' cases passed.');
