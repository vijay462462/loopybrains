// Makes a real PowerPoint (.pptx) file in the browser, with no library: a few XML parts stored in an uncompressed zip.
// slides: [{ title, bullets: [text], note }] -> Blob. Text only, so it opens in PowerPoint, Google Slides, Keynote and LibreOffice.
const enc = new TextEncoder();
const esc = (s) => String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
let CRC = null;
function crc32(b) { if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function zip(files) {
  const parts = [], central = []; let off = 0; const u16 = (n) => [n & 255, (n >> 8) & 255], u32 = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
  for (const [name, text] of files) {
    const nb = enc.encode(name), data = enc.encode(text), crc = crc32(data);
    const head = new Uint8Array([0x50, 0x4B, 3, 4, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), 0, 0]);
    parts.push(head, nb, data);
    central.push(new Uint8Array([0x50, 0x4B, 1, 2, 20, 0, 20, 0, 0, 8, 0, 0, 0, 0, 0x21, 0, ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(nb.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]), nb);
    off += head.length + nb.length + data.length;
  }
  const csize = central.reduce((a, x) => a + x.length, 0), end = new Uint8Array([0x50, 0x4B, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(csize), ...u32(off), 0, 0]);
  return new Blob([...parts, ...central, end], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}
const NS = 'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"';
const HDR = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const W = 12192000, H = 6858000, TEAL = "0B3B3C", ORANGE = "F28A2E", WHITE = "FFFFFF", INK = "17302F";
function shape(id, name, x, y, w, h, paras, opts = {}) {
  const fill = opts.fill ? `<a:solidFill><a:srgbClr val="${opts.fill}"/></a:solidFill>` : "<a:noFill/>";
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr${opts.fill ? "" : ' txBox="1"'}/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill}</p:spPr><p:txBody><a:bodyPr wrap="square" lIns="182880" rIns="182880" tIns="91440" bIns="91440" anchor="${opts.anchor || "t"}"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paras}</p:txBody></p:sp>`;
}
const para = (t, sz, color, bold, bullet) => `<a:p><a:pPr${bullet ? ' marL="342900" indent="-342900"' : ""}>${bullet ? '<a:spcBef><a:spcPts val="900"/></a:spcBef><a:buClr><a:srgbClr val="' + ORANGE + '"/></a:buClr><a:buFont typeface="Arial"/><a:buChar char="&#8226;"/>' : "<a:buNone/>"}</a:pPr><a:r><a:rPr lang="en-IN" sz="${sz}" b="${bold ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Calibri"/></a:rPr><a:t>${esc(t)}</a:t></a:r></a:p>`;
function slideXml(s, first, n, total) {
  const bg = `<p:bg><p:bgPr><a:solidFill><a:srgbClr val="${first ? TEAL : "F6F4EE"}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>`;
  let sh = "";
  if (first) {
    sh += shape(2, "Title", 685800, 1900000, W - 1371600, 1500000, para(s.title, 4400, WHITE, true), { anchor: "b" });
    sh += shape(3, "Subtitle", 685800, 3500000, W - 1371600, 1800000, (s.bullets || []).map(b => para(b, 2000, "CFE6E3", false)).join(""));
    sh += shape(4, "Bar", 685800, 3420000, 1600000, 60000, '<a:p><a:endParaRPr lang="en-IN"/></a:p>', { fill: ORANGE });
  } else {
    sh += shape(2, "Title", 0, 0, W, 1000000, para(s.title, 3000, WHITE, true), { fill: TEAL, anchor: "ctr" });
    sh += shape(3, "Content", 457200, 1250000, W - 914400, H - 1250000 - 600000, (s.bullets || []).map(b => para(b, s.size || 2200, INK, false, true)).join(""));
    sh += shape(4, "Footer", 457200, H - 520000, W - 914400, 400000, para("Loopy Brains · loopybrains.com   " + n + " / " + total, 1200, "6B7C7B", false));
  }
  return `${HDR}<p:sld ${NS}><p:cSld>${bg}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${sh}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}
const REL = (id, type, target) => `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
const RELS = (items) => `${HDR}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.join("")}</Relationships>`;
export function makePptx(slides, title) {
  const n = slides.length, files = [];
  files.push(["[Content_Types].xml", `${HDR}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}</Types>`]);
  files.push(["_rels/.rels", RELS([REL("rId1", "officeDocument", "ppt/presentation.xml"), `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>`])]);
  files.push(["docProps/core.xml", `${HDR}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>Loopy Brains</dc:creator></cp:coreProperties>`]);
  files.push(["ppt/presentation.xml", `${HDR}<p:presentation ${NS}><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst><p:sldSz cx="${W}" cy="${H}"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`]);
  files.push(["ppt/_rels/presentation.xml.rels", RELS([REL("rId1", "slideMaster", "slideMasters/slideMaster1.xml"), ...slides.map((_, i) => REL("rId" + (i + 2), "slide", "slides/slide" + (i + 1) + ".xml"))])]);
  files.push(["ppt/slideMasters/slideMaster1.xml", `${HDR}<p:sldMaster ${NS}><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`]);
  files.push(["ppt/slideMasters/_rels/slideMaster1.xml.rels", RELS([REL("rId1", "slideLayout", "../slideLayouts/slideLayout1.xml"), REL("rId2", "theme", "../theme/theme1.xml")])]);
  files.push(["ppt/slideLayouts/slideLayout1.xml", `${HDR}<p:sldLayout ${NS} type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`]);
  files.push(["ppt/slideLayouts/_rels/slideLayout1.xml.rels", RELS([REL("rId1", "slideMaster", "../slideMasters/slideMaster1.xml")])]);
  const clr = (n, v) => `<a:${n}><a:srgbClr val="${v}"/></a:${n}>`;
  files.push(["ppt/theme/theme1.xml", `${HDR}<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Loopy"><a:themeElements><a:clrScheme name="Loopy"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>${clr("dk2", TEAL)}${clr("lt2", "F6F4EE")}${clr("accent1", "1E9E73")}${clr("accent2", ORANGE)}${clr("accent3", "0B3B3C")}${clr("accent4", "5BC0A8")}${clr("accent5", "F6C177")}${clr("accent6", "6B7C7B")}${clr("hlink", "1E9E73")}${clr("folHlink", "6B7C7B")}</a:clrScheme><a:fontScheme name="Loopy"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Loopy"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`]);
  slides.forEach((s, i) => { files.push(["ppt/slides/slide" + (i + 1) + ".xml", slideXml(s, i === 0, i + 1, n)]); files.push(["ppt/slides/_rels/slide" + (i + 1) + ".xml.rels", RELS([REL("rId1", "slideLayout", "../slideLayouts/slideLayout1.xml")])]); });
  return zip(files);
}
