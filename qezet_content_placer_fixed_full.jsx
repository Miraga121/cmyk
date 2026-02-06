#targetengine "claudeA3_Miri313"
/*
 * Qəzet Məzmun Yerləşdiricisi — Sample yaradıcı və səhifələri təmizləyən versiya (fix)
 * İstifadəçi: Miri313-cmyk
 * Versiya: 2026-02 (fix: font handling, safe clear, persistent palette)
 *
 * Dəyişikliklər əsasən:
 * - #targetengine dəyişdirildi və əvvəlki persistent pəncərə bağlanır
 * - populateFonts funksiyası Arial prioriteti ilə yeniləndi
 * - applyFontToFrame daha etibarlı font çözümü ilə yeniləndi
 * - clearPageContent funksiyası daha təhlükəsiz və geniş obyekt silmə loqikası ilə əvəz edildi
 * - Sample struktur yaradılmasında File path-lər .fsName ilə istifadə edildi
 */

// Close previous persistent window if present (prevents duplicate handlers / frozen UI)
try {
    if ($.global.qezetPlacerWin && $.global.qezetPlacerWin instanceof Window) {
        try { $.global.qezetPlacerWin.close(); } catch(e) {}
        $.global.qezetPlacerWin = null;
    }
} catch(e) { /* ignore */ }

// Basic document checks
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}
var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// Debug log array
var debugLog = [];
function log(msg) {
    try { debugLog.push(String(msg)); } catch(e){}
    try { $.writeln(String(msg)); } catch(e){}
}

// UI: palette (modeless) - better for persistent sessions
var win = new Window("palette", "Qəzet Məzmun Yerləşdiricisi", undefined, {resizeable: true});
$.global.qezetPlacerWin = win;
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 12;

// UI controls
var grpFolder = win.add("group");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olacaq):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [420, 26];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 28;

var grpGrid = win.add("group");
grpGrid.orientation = "row";
grpGrid.spacing = 10;
grpGrid.add("statictext", undefined, "Grid Sütun Sayı:");
var ddlColumns = grpGrid.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1; // 2 default
ddlColumns.preferredSize = [80, 22];

var grpFonts = win.add("group");
grpFonts.orientation = "row";
grpFonts.alignChildren = ["fill", "center"];
grpFonts.spacing = 8;

var grpTitle = grpFonts.add("group");
grpTitle.orientation = "column";
grpTitle.add("statictext", undefined, "Başlıq font:");
var ddlTitleFont = grpTitle.add("dropdownlist", undefined, []);
ddlTitleFont.preferredSize = [220, 22];
grpTitle.add("statictext", undefined, "Başlıq ölçü:");
var etTitleSize = grpTitle.add("edittext", undefined, "14");
etTitleSize.preferredSize = [80, 22];

var grpBody = grpFonts.add("group");
grpBody.orientation = "column";
grpBody.add("statictext", undefined, "Mətn font:");
var ddlBodyFont = grpBody.add("dropdownlist", undefined, []);
ddlBodyFont.preferredSize = [220, 22];
grpBody.add("statictext", undefined, "Mətn ölçü:");
var etBodySize = grpBody.add("edittext", undefined, "10");
etBodySize.preferredSize = [80, 22];

var grpBtns = win.add("group");
grpBtns.orientation = "row";
grpBtns.spacing = 8;
var btnSample = grpBtns.add("button", undefined, "🧪 Sample Yarat");
btnSample.preferredSize.height = 30;
var btnTest = grpBtns.add("button", undefined, "🔍 Test Et (Debug)");
btnTest.preferredSize.height = 30;
var btnRun = grpBtns.add("button", undefined, "✅ Məzmunu Yerləşdir");
btnRun.preferredSize.height = 36;

var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [420, 22];

// helper removeDuplicates (already used elsewhere)
function removeDuplicates(arr) {
    var seen = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
        var key = String(arr[i]);
        if (!seen[key]) { seen[key] = true; out.push(arr[i]); }
    }
    return out;
}

// ---------------------------
// Font populate + safer applyFontToFrame (replace originals)
// ---------------------------

// populateFonts — preferring Arial; fills ddlTitleFont and ddlBodyFont
(function populateFontsPreferArial() {
    try {
        var fonts = [];
        for (var i = 0; i < app.fonts.length && fonts.length < 200; i++) {
            try {
                var fname = app.fonts[i].name;
                if (fname && fonts.indexOf(fname) === -1) fonts.push(fname);
            } catch (e) { /* skip */ }
        }
        if (fonts.length === 0) {
            fonts = ["Arial\tRegular", "Arial\tBold", "TimesNewRomanPSMT", "Helvetica"];
        }
        fonts = removeDuplicates(fonts);

        // find an Arial entry index if present
        var arialIndex = -1;
        for (var k = 0; k < fonts.length; k++) {
            var nm = fonts[k] || "";
            if (/^arial(\t| |$)/i.test(nm) || nm.toLowerCase().indexOf("arial") !== -1) { arialIndex = k; break; }
        }

        for (var f = 0; f < fonts.length; f++) {
            try { ddlTitleFont.add("item", fonts[f]); ddlBodyFont.add("item", fonts[f]); } catch(e) {}
        }

        if (arialIndex >= 0) {
            try { ddlTitleFont.selection = arialIndex; } catch(e) { ddlTitleFont.selection = 0; }
            try { ddlBodyFont.selection = arialIndex; } catch(e) { ddlBodyFont.selection = 0; }
        } else {
            try { ddlTitleFont.selection = 0; ddlBodyFont.selection = 0; } catch(e) {}
        }
    } catch (err) {
        try { ddlTitleFont.add("item", "Arial\tRegular"); ddlBodyFont.add("item", "Arial\tRegular"); ddlTitleFont.selection = 0; ddlBodyFont.selection = 0; } catch(e) {}
        $.writeln("populateFontsPreferArial error: " + err.toString());
    }
})();

// findFontByName: flexible resolver for various font name formats, prioritized Arial
function findFontByName(fontName) {
    if (!fontName) return null;
    // try exact itemByName
    try {
        var f = app.fonts.itemByName(fontName);
        if (f && f.isValid) return f;
    } catch(e){}
    // try base family name
    try {
        var base = String(fontName).replace(/\t.*$/, '').replace(/\s+(Regular|Bold|Italic|Oblique|Roman)$/i, '');
        var f2 = app.fonts.itemByName(base);
        if (f2 && f2.isValid) return f2;
    } catch(e){}
    // search contains (case-insensitive)
    try {
        var lower = String(fontName).toLowerCase();
        for (var i = 0; i < app.fonts.length; i++) {
            try {
                var an = app.fonts[i].name;
                if (an && an.toLowerCase().indexOf(lower) !== -1) return app.fonts[i];
            } catch(e){}
        }
    } catch(e){}
    // try to find any Arial
    try {
        for (var j = 0; j < app.fonts.length; j++) {
            try {
                var namej = app.fonts[j].name;
                if (namej && namej.toLowerCase().indexOf("arial") !== -1) return app.fonts[j];
            } catch(e){}
        }
    } catch(e){}
    // fallback to first available font
    try {
        var ff = app.fonts.item(0);
        if (ff && ff.isValid) return ff;
    } catch(e){}
    return null;
}

// applyFontToFrame: safer application with fallback to Arial or first system font
function applyFontToFrame(frame, fontName, fontSize) {
    try {
        if (!frame) return;
        var fontObj = null;
        if (fontName) fontObj = findFontByName(fontName);
        if (!fontObj) fontObj = findFontByName("Arial");
        if (fontObj && fontObj.isValid) {
            try { frame.parentStory.characters.everyItem().appliedFont = fontObj; } catch(e) {}
        } else {
            try { frame.parentStory.characters.everyItem().appliedFont = app.fonts.item(0); } catch(e) {}
        }
    } catch (e) {
        $.writeln("applyFontToFrame error: " + e.toString());
    }
    try { if (fontSize) frame.parentStory.characters.everyItem().pointSize = fontSize; } catch(e){}
    try { frame.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN; } catch(e){}
}

// ---------------------------
// Browse / Sample / Test / Run handlers
// ---------------------------

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olacaq)");
    if (folder) {
        etFolder.text = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

btnSample.onClick = function() {
    var rootPath = etFolder.text;
    if (!rootPath || rootPath === "") { alert("⚠️ Zəhmət olmasa ana qovluğu seçin (sample burada yaradılacaq)."); return; }
    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) {
        if (!rootFolder.create()) { alert("❌ Ana qovluq yaradıla bilmədi: " + rootPath); return; }
    }
    txtProgress.text = "Sample struktur yaradılır...";
    win.update();
    try {
        createSampleStructure(rootFolder);
        txtProgress.text = "Sample yaradıldı: " + rootFolder.fsName;
        alert("Sample struktur yaradıldı:\n" + rootFolder.fsName + "\n\npage2..page8 qovluqları və .txt + .jpg (placeholder) faylları yaradıldı.");
    } catch (e) {
        alert("Sample yaradılarkən xəta: " + e.toString());
    }
};

btnTest.onClick = function() {
    debugLog = [];
    log("═══════════════════════════════");
    log("TEST BAŞLADI");
    log("═══════════════════════════════");
    var rootPath = etFolder.text;
    if (!rootPath || rootPath === "") { alert("⚠️ Zəhmət olmasa qovluq seçin!"); return; }
    var rootFolder = new Folder(rootPath);
    log("Ana qovluq: " + rootFolder.fsName);
    log("Mövcuddur: " + rootFolder.exists);
    if (!rootFolder.exists) { alert("❌ Qovluq mövcud deyil!"); return; }
    var subFolders = rootFolder.getFiles();
    log("\nAna qovluqdakı elementlər:");
    for (var i = 0; i < subFolders.length; i++) {
        if (subFolders[i] instanceof Folder) log("  📁 " + subFolders[i].name);
    }
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        log("\n--- SƏHİFƏ " + pageNum + " YOXLANIR ---");
        var pageFolder = new Folder(rootFolder.fsName + "/page" + pageNum);
        log("Qovluq: " + pageFolder.fsName + "  Mövcuddur: " + pageFolder.exists);
        if (!pageFolder.exists) { log("⚠️ Bu qovluq tapılmadı!"); continue; }
        var allFiles = pageFolder.getFiles();
        log("  Ümumi fayl sayı: " + allFiles.length);
        for (var f = 0; f < allFiles.length; f++) { if (allFiles[f] instanceof File) log("    " + allFiles[f].name); }
    }
    log("\n═══════════════════════════════");
    log("TEST TAMAMLANDI");
    log("═══════════════════════════════");
    alert("Test tamamlandı. Konsola baxın (ExtendScript Toolkit).");
};

// Main run
btnRun.onClick = function() {
    debugLog = [];
    try {
        log("═══════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI");
        log("═══════════════════════════════");

        var rootPath = etFolder.text;
        if (!rootPath || rootPath === "") { alert("⚠️ Zəhmət olmasa qovluq seçin!"); return; }
        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) { alert("❌ Seçilmiş qovluq mövcud deyil!"); return; }

        var cols = parseInt(ddlColumns.selection.text) || 2;
        var titleFontName = ddlTitleFont.selection ? ddlTitleFont.selection.text : null;
        var bodyFontName = ddlBodyFont.selection ? ddlBodyFont.selection.text : null;
        var titleSize = parseFloat(etTitleSize.text) || 14;
        var bodySize = parseFloat(etBodySize.text) || 10;

        txtProgress.text = "İşləyir...";
        win.update();

        var totalPlaced = 0;
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(rootFolder.fsName + "/page" + pageNum);
            log("\n═══ SƏHİFƏ " + pageNum + " (index: " + pageIndex + ") ═══");
            if (!pageFolder.exists) { log("⚠️ Qovluq tapılmadı: " + pageFolder.fsName); continue; }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            log("📄 .txt fayl sayı: " + txtFiles.length);
            if (txtFiles.length === 0) { log("⚠️ Heç bir .txt fayl yoxdur"); continue; }

            var page = doc.pages[pageIndex];
            log("Səhifə obyekti: " + page.name);

            // səhifə təmizlənir: rectangles, textFrames, images, və daha etibarlı bütün page items
            try {
                clearPageContent(page);
                log("  Səhifə təmizləndi");
            } catch (e) {
                log("  Səhifə təmizlənməsində xəta: " + e.toString());
            }

            var bounds = page.bounds;
            var margin = page.marginPreferences;
            var usableW = (bounds[3] - bounds[1]) - margin.left - margin.right;
            var usableH = (bounds[2] - bounds[0]) - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            txtProgress.text = "Səhifə " + pageNum + " işlənir... (" + txtFiles.length + " element)";
            win.update();

            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                log("\n  ➤ Element " + (i+1) + "/" + txtFiles.length + ": " + txtFiles[i].name);

                var content = readTextFile(txtFiles[i]);
                if (!content || content.length === 0) { log("    ⚠��� Mətn boşdur"); continue; }

                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed !== "") cleanLines.push(trimmed);
                }
                if (cleanLines.length === 0) { log("    ⚠️ Təmiz sətirlər yoxdur"); continue; }

                var title = cleanLines[0] || "Başlıqsız";
                var bodyLines = [];
                for (var b = 1; b < cleanLines.length; b++) bodyLines.push(cleanLines[b]);
                var body = bodyLines.join("\r");

                log("    📌 Başlıq: " + title.substring(0, 50));
                log("    📝 Mətn: " + body.length + " simvol");

                // Şəkillər
                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);
                log("    🖼️ Şəkil: " + imgFiles.length + " ədəd (qrup " + groupNum + ")");

                var currentY = y;
                var padding = 6;

                // ŞƏKİLLƏR yerləşdir
                if (imgFiles.length > 0) {
                    var imgHeight = cellH * 0.35;
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgWidth = (cellW - padding * 2) / imgCols;

                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        var imgX = x + padding + (imgCol * imgWidth);
                        var imgY = currentY + padding + (imgRow * (imgHeight / 2));
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [
                                imgY,
                                imgX,
                                imgY + (imgHeight / 2) - padding,
                                imgX + imgWidth - padding
                            ];
                            rect.place(imgFiles[j]);
                            rect.fit(FitOptions.FILL_PROPORTIONALLY);
                            log("      ✓ Şəkil yerləşdi: " + imgFiles[j].name);
                            totalPlaced++;
                        } catch (e) {
                            log("      ✗ Şəkil xətası: " + e.toString());
                        }
                    }
                    currentY += imgHeight + padding;
                }

                // Başlıq
                var titleTrimmed = title.replace(/^\s+|\s+$/g, '');
                if (titleTrimmed !== "") {
                    try {
                        var titleFrame = page.textFrames.add();
                        var titleHeight = titleSize + 8;
                        titleFrame.geometricBounds = [
                            currentY,
                            x + padding,
                            currentY + titleHeight,
                            x + cellW - padding
                        ];
                        titleFrame.contents = title;
                        applyFontToFrame(titleFrame, titleFontName, titleSize);
                        currentY += titleHeight + padding;
                        log("      ✓ Başlıq yerləşdi");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Başlıq xətası: " + e.toString());
                    }
                }

                // Mətn
                var bodyTrimmed = body.replace(/^\s+|\s+$/g, '');
                if (bodyTrimmed !== "") {
                    try {
                        var textFrame = page.textFrames.add();
                        textFrame.geometricBounds = [
                            currentY,
                            x + padding,
                            y + cellH - padding,
                            x + cellW - padding
                        ];
                        textFrame.contents = body;
                        applyFontToFrame(textFrame, bodyFontName, bodySize);
                        log("      ✓ Mətn yerləşdi");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Mətn xətası: " + e.toString());
                    }
                }
            } // end for each txtFile
        } // end for pages

        log("\n═══════════════════════════════");
        log("YERLƏŞDİRMƏ TAMAMLANDI");
        log("Cəmi yerləşdirilən element: " + totalPlaced);
        log("═══════════════════════════════");
        txtProgress.text = "✅ Tamamlandı! " + totalPlaced + " element yerləşdirildi";
        alert("✅ Tamamlandı!\n\n" + totalPlaced + " element yerləşdirildi.\n\nKonsola baxın (ExtendScript Toolkit)");
    } catch (e) {
        log("❌ XƏTA: " + e.toString());
        alert("❌ Xəta: " + e.toString());
        txtProgress.text = "Xəta baş verdi!";
    }
};

// ---------------------------
// Helpers (readTextFile, getNumberedFiles, findImageFiles)
// ---------------------------

function readTextFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        if (file.open("r")) {
            var content = file.read();
            file.close();
            if (content && content.length > 0 && content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
            return content;
        }
    } catch (e) {
        $.writeln("Fayl oxuma xətası: " + e.toString());
    }
    return "";
}

function getNumberedFiles(folder, filterRegex) {
    if (!folder || !folder.exists) return [];
    var allFiles = folder.getFiles();
    var filtered = [];
    for (var i = 0; i < allFiles.length; i++) {
        try {
            if (allFiles[i] instanceof File && filterRegex.test(allFiles[i].name)) filtered.push(allFiles[i]);
        } catch(e){}
    }
    filtered.sort(function(a, b) {
        var numA = parseInt((a.name.match(/^\d+/) || ["0"])[0], 10) || 0;
        var numB = parseInt((b.name.match(/^\d+/) || ["0"])[0], 10) || 0;
        return numA - numB;
    });
    return filtered;
}

function findImageFiles(folder, groupNum) {
    if (!folder || !folder.exists) return [];
    var pattern = new RegExp("^" + groupNum + "[-_]?(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    var allFiles = folder.getFiles();
    var result = [];
    for (var i = 0; i < allFiles.length; i++) {
        try {
            if (allFiles[i] instanceof File && pattern.test(allFiles[i].name)) result.push(allFiles[i]);
        } catch(e){}
    }
    result.sort(function(a, b) {
        var matchA = (a.name.match(/[-_](\d+)\./) || [0,0])[1];
        var matchB = (b.name.match(/[-_](\d+)\./) || [0,0])[1];
        var numA = parseInt(matchA,10) || 0;
        var numB = parseInt(matchB,10) || 0;
        return numA - numB;
    });
    return result;
}

// ---------------------------
// Safe clearPageContent (robust removal of page items, skip master page items)
// ---------------------------
function clearPageContent(page) {
    try {
        var all = page.allPageItems;
        if (!all || all.length === 0) return;
        var removed = 0;
        for (var i = all.length - 1; i >= 0; i--) {
            var it = all[i];
            if (!it) continue;
            // skip master page items
            var isMaster = null;
            try { isMaster = !!it.isMasterPageItem; } catch(e) { isMaster = null; }
            if (isMaster === true) continue;
            // try to remove
            try { it.remove(); removed++; } catch(e) { $.writeln("clearPageContent remove error: " + e.toString()); }
        }
        $.writeln("clearPageContent: removed " + removed + " items");
    } catch (e) {
        $.writeln("clearPageContent error: " + e.toString());
    }
}

// ---------------------------
// Sample structure and placeholder image creation (use .fsName for paths)
// ---------------------------
function createSampleStructure(rootFolder) {
    for (var p = 2; p <= 8; p++) {
        var pageDir = new Folder(rootFolder.fsName + "/page" + p);
        if (!pageDir.exists) pageDir.create();
        // text files
        for (var i = 1; i <= 4; i++) {
            var txtName = i + ".txt";
            var txtFile = new File(pageDir.fsName + "/" + txtName);
            var sampleTitle = "Sample Başlıq " + i + " (səhifə " + p + ")";
            var sampleBody = "Bu, nümunə mətnidir.\r\nSəhifə: " + p + "\r\nElement: " + i + "\r\n\nMətnin bir neçə sətri buradadır.";
            try {
                txtFile.encoding = "UTF-8";
                txtFile.open("w");
                txtFile.write(sampleTitle + "\r\n" + sampleBody);
                txtFile.close();
            } catch (e) { $.writeln("TXT yazma xətası: " + e.toString()); }
        }
        // images
        for (var g = 1; g <= 3; g++) {
            var imgCount = (g % 2 === 0) ? 2 : 1;
            for (var im = 1; im <= imgCount; im++) {
                var imgName = g + "-" + im + ".jpg";
                var imgFile = new File(pageDir.fsName + "/" + imgName);
                if (!imgFile.exists) {
                    try { createPlaceholderImage(pageDir, imgName, 800, 600, (p + g + im)); }
                    catch (e) { $.writeln("Şəkil yaradılma xətası: " + e.toString()); }
                }
            }
        }
    }
}

function createPlaceholderImage(folder, filename, w, h, seed) {
    var dupDoc = app.documents.add();
    try {
        // set small page size proportionally
        dupDoc.documentPreferences.pageWidth = w / 10;
        dupDoc.documentPreferences.pageHeight = h / 10;
        var pg = dupDoc.pages[0];
        var rect = pg.rectangles.add();
        rect.geometricBounds = [0, 0, dupDoc.documentPreferences.pageHeight, dupDoc.documentPreferences.pageWidth];
        // color generation (convert 0-255 to percent for process colors)
        var r = (seed * 53) % 256;
        var g = (seed * 97) % 256;
        var b = (seed * 149) % 256;
        var swName = "sample_sw_" + r + "_" + g + "_" + b;
        var sw = null;
        try {
            sw = dupDoc.colors.add({name: swName, model: ColorModel.process, colorValue: [r/255*100, g/255*100, b/255*100]});
        } catch (e) {
            try { sw = dupDoc.colors.item(swName); } catch(e) { sw = null; }
        }
        if (sw) rect.fillColor = sw;
        var tf = pg.textFrames.add();
        tf.geometricBounds = [dupDoc.documentPreferences.pageHeight / 4, dupDoc.documentPreferences.pageWidth / 8, dupDoc.documentPreferences.pageHeight * 3 / 4, dupDoc.documentPreferences.pageWidth * 7 / 8];
        tf.contents = filename + "\r\nPlaceholder";
        try { tf.parentStory.appliedFont = app.fonts.item(0); } catch(e) {}
        tf.parentStory.pointSize = 12;
        try { tf.parentStory.justification = Justification.CENTER_ALIGN; } catch(e) {}

        var outFile = new File(folder.fsName + "/" + filename);
        var jpgPref = app.jpegExportPreferences;
        try {
            jpgPref.jpegQuality = JPEGOptionsQuality.HIGH;
            jpgPref.exportResolution = 150;
        } catch(e) {}
        dupDoc.exportFile(ExportFormat.JPG, outFile, false);
    } finally {
        try { dupDoc.close(SaveOptions.NO); } catch(e) {}
    }
}

// ensure the global palette is cleared on close
win.onClose = function() {
    try { $.global.qezetPlacerWin = null; } catch(e) {}
};

// show
try {
    win.center();
    win.show();
} catch (e) {
    alert("Pəncərə göstərilmə xətası: " + e.toString());
    $.writeln(e.toString());
}