// /osrs/utils/helpers.js

export function getWikiLink(name) {
    if (!name) return '#';
    return `https://oldschool.runescape.wiki/w/Exchange:${encodeURIComponent(name.replace(/ /g, '_'))}`;
}
