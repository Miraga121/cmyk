// Qəzet Məzmun Yerləşdiricisi — Sample yaradıcı və səhifələri təmizləyən versiya
// İstifadəçi: Miri313-cmyk
// Tarix: 2025-10-20
// Dəyişikliklər: sample struktur yaradıcı, səhifə təmizləmə, font/size seçimləri

#targetengine "session"

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}
var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// Debug log funksiyası
var debugLog = [];
function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// UI
var win = new Window("palette", "Qəzet Məzmun Yerləşdiricisi", undefined, {resizeable: true});
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 12;

// Qovluq seçimi
var grpFolder = win.add("group");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olacaq):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [420, 26];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 28;

// Grid seçimi
var grpGrid = win.add("group");
grpGrid.orientation = "row";
grpGrid.spacing = 10;
grpGrid.add("statictext", undefined, "Grid Sütun Sayı:");
var ddlColumns = grpGrid.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1; // 2 default
ddlColumns.preferredSize = [80, 22];

// Font və ölçü seçimləri
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

// Buttons: sample, test, run
var grpBtns = win.add("group");
grpBtns.orientation = "row";
grpBtns.spacing = 8;
var btnSample = grpBtns.add("button", undefined, "🧪 Sample Yarat");
btnSample.preferredSize.height = 30;
var btnTest = grpBtns.add("button", undefined, "🔍 Test Et (Debug)");
btnTest.preferredSize.height = 30;
var btnRun = grpBtns.add("button", undefined, "✅ Məzmunu Yerləşdir");
btnRun.preferredSize.height = 36;

// Progress və info
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [420, 22];

// Doldur: font siyahısı (ilk 80 font-u göstər)
(function populateFonts() {
    try {
        var fonts = [];
        for (var i = 0; i < app.fonts.length && i < 80; i++) {
            try {
                fonts.push(app.fonts[i].name);
            } catch (e) {}
        }
        // prefills if fonts array is empty
        if (fonts.length === 0) {
            fonts = ["Arial\tRegular", "Arial\tBold", "TimesNewRomanPSMT", "Helvetica"];
        }
        fonts = removeDuplicates(fonts);
        for (var f = 0; f < fonts.length; f++) {
            ddlTitleFont.add("item", fonts[f]);
            ddlBodyFont.add("item", fonts[f]);
        }
        ddlTitleFont.selection = 0;
        ddlBodyFont.selection = 0;
    } catch (e) {
        log("Font siyahısı alınarkən xəta: " + e.toString());
    }
})();

function removeDuplicates(arr) {
    var seen = {};
    var out = [];
    for (var i = 0; i < arr.length; i++) {
        if (!seen[arr[i]]) {
            seen[arr[i]] = true;
            out.push(arr[i]);
        }
    }
    return out;
}

// Browse
btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olacaq)");
    if (folder) {
        etFolder.text = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

// Sample yaradıcı
btnSample.onClick = function() {
    var rootPath = etFolder.text;
    if (!rootPath || rootPath === "") {
        alert("⚠️ Zəhmət olmasa ana qovluğu seçin (sample burada yaradılacaq).");
        return;
    }
    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) {
        if (!rootFolder.create()) {
            alert("❌ Ana qovluq yaradıla bilmədi: " + rootPath);
            return;
        }
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

// Test funksiyası - qovluq və faylları yoxlayır
btnTest.onClick = function() {
    debugLog = [];
    log("═══════════════════════════════");
    log("TEST BAŞLADI");
    log("═══════════════════════════════");
    
    var rootPath = etFolder.text;
    if (!rootPath || rootPath === "") {
        alert("⚠️ Zəhmət olmasa qovluq seçin!");
        return;
    }

    var rootFolder = new Folder(rootPath);
    log("Ana qovluq: " + rootFolder.fsName);
    log("Mövcuddur: " + rootFolder.exists);
    
    if (!rootFolder.exists) {
        alert("❌ Qovluq mövcud deyil!");
        return;
    }

    var subFolders = rootFolder.getFiles();
    log("\nAna qovluqdakı elementlər:");
    for (var i = 0; i < subFolders.length; i++) {
        if (subFolders[i] instanceof Folder) {
            log("  📁 " + subFolders[i].name);
        }
    }

    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        log("\n--- SƏHİFƏ " + pageNum + " YOXLANIR ---");
        var pageFolder = new Folder(rootFolder + "/page" + pageNum);
        log("Qovluq: " + pageFolder.fsName + "  Mövcuddur: " + pageFolder.exists);
        if (!pageFolder.exists) {
            log("⚠️ Bu qovluq tapılmadı!");
            continue;
        }
        var allFiles = pageFolder.getFiles();
        log("  Ümumi fayl sayı: " + allFiles.length);
        for (var f = 0; f < allFiles.length; f++) {
            if (allFiles[f] instanceof File) log("    " + allFiles[f].name);
        }
    }

    log("\n═══════════════════════════════");
    log("TEST TAMAMLANDI");
    log("═══════════════════════════════");
    alert("Test tamamlandı. Konsola baxın (ExtendScript Toolkit).");
};

// Run: əsas yerləşdirmə — səhifələri təmizləyir və sonra yerləşdirir
btnRun.onClick = function() {
    debugLog = [];
    try {
        log("═══════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI");
        log("═══════════════════════════════");
        
        var rootPath = etFolder.text;
        if (!rootPath || rootPath === "") {
            alert("⚠️ Zəhmət olmasa qovluq seçin!");
            return;
        }
        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) {
            alert("❌ Seçilmiş qovluq mövcud deyil!");
            return;
        }
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
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            log("\n═══ SƏHİFƏ " + pageNum + " (index: " + pageIndex + ") ═══");
            if (!pageFolder.exists) {
                log("⚠️ Qovluq tapılmadı: " + pageFolder.fsName);
                continue;
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            log("📄 .txt fayl sayı: " + txtFiles.length);
            if (txtFiles.length === 0) {
                log("⚠️ Heç bir .txt fayl yoxdur");
                continue;
            }

            var page = doc.pages[pageIndex];
            log("Səhifə obyekti: " + page.name);

            // səhifə təmizlənir: rectangles, textFrames, images
            try {
                clearPageContent(page);
                log("  Səhifə təmizləndi");
            } catch (e) {
                log("  Səhifə təmizlənməsində xətа: " + e.toString());
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
                if (!content || content.length === 0) {
                    log("    ⚠️ Mətn boşdur");
                    continue;
                }

                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed !== "") cleanLines.push(trimmed);
                }
                if (cleanLines.length === 0) {
                    log("    ⚠️ Təmiz sətirlər yoxdur");
                    continue;
                }

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
            }
        }

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

// Helpers

function readTextFile(file) {
    if (!file.exists) return "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        var content = file.read();
        file.close();
        if (content.length > 0 && content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        return content;
    } catch (e) {
        $.writeln("Fayl oxuma xətası: " + e.toString());
        return "";
    }
}

function getNumberedFiles(folder, filterRegex) {
    var allFiles = folder.getFiles();
    var filtered = [];
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && filterRegex.test(allFiles[i].name)) filtered.push(allFiles[i]);
    }
    filtered.sort(function(a, b) {
        var numA = parseInt(a.name.match(/^\d+/)) || 0;
        var numB = parseInt(b.name.match(/^\d+/)) || 0;
        return numA - numB;
    });
    return filtered;
}

// findImageFiles: daha elastik (3-1.jpg və ya 3_1.jpg və ya 3-1.JPG)
function findImageFiles(folder, groupNum) {
    var pattern = new RegExp("^" + groupNum + "[-_]?(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    var allFiles = folder.getFiles();
    var result = [];
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && pattern.test(allFiles[i].name)) result.push(allFiles[i]);
    }
    result.sort(function(a, b) {
        var matchA = a.name.match(/[-_](\d+)\./);
        var matchB = b.name.match(/[-_](\d+)\./);
        var numA = matchA ? parseInt(matchA[1]) : 0;
        var numB = matchB ? parseInt(matchB[1]) : 0;
        return numA - numB;
    });
    return result;
}

// Səhifəni təmizləmə
function clearPageContent(page) {
    try {
        if (page.rectangles && page.rectangles.length > 0) {
            page.rectangles.everyItem().remove();
        }
    } catch (e) {}
    try {
        if (page.textFrames && page.textFrames.length > 0) {
            page.textFrames.everyItem().remove();
        }
    } catch (e) {}
    try {
        if (page.ovals && page.ovals.length > 0) {
            page.ovals.everyItem().remove();
        }
    } catch (e) {}
    // anchored/other objects might remain; this clears main common containers
}

// Font tətbiqi fayla
function applyFontToFrame(frame, fontName, fontSize) {
    try {
        if (fontName) {
            try {
                frame.parentStory.characters.everyItem().appliedFont = app.fonts.item(fontName);
            } catch (e) {
                // fallback to first system font
                try { frame.parentStory.characters.everyItem().appliedFont = app.fonts.item(0); } catch(e) {}
            }
        }
    } catch (e) {}
    try {
        if (fontSize) frame.parentStory.characters.everyItem().pointSize = fontSize;
    } catch (e) {}
    try {
        frame.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
    } catch (e) {}
}

// Sample struktur yaradıcı: page2..page8 altında .txt fayllar və placeholder jpg-lər yaradır.
// Placeholder şəkilləri InDesign-da kiçik temp sənədlər yaradıb export edir (beləliklə real .jpg alınır).
function createSampleStructure(rootFolder) {
    for (var p = 2; p <= 8; p++) {
        var pageDir = new Folder(rootFolder + "/page" + p);
        if (!pageDir.exists) pageDir.create();
        // hər page üçün 4 mətn nümunəsi
        for (var i = 1; i <= 4; i++) {
            var txtName = i + ".txt";
            var txtFile = new File(pageDir + "/" + txtName);
            var sampleTitle = "Sample Başlıq " + i + " (səhifə " + p + ")";
            var sampleBody = "Bu, nümunə mətnidir.\r\nSəhifə: " + p + "\r\nElement: " + i + "\r\n\nMətnin bir neçə sətri buradadır.";
            try {
                txtFile.encoding = "UTF-8";
                txtFile.open("w");
                txtFile.write(sampleTitle + "\r\n" + sampleBody);
                txtFile.close();
            } catch (e) {
                $.writeln("TXT yazma xətası: " + e.toString());
            }
        }
        // hər group üçün 1-2 şəkil yarad (məsələn: group i -> files: i-1.jpg, i-2.jpg)
        for (var g = 1; g <= 3; g++) {
            var imgCount = (g % 2 === 0) ? 2 : 1;
            for (var im = 1; im <= imgCount; im++) {
                var imgName = g + "-" + im + ".jpg";
                var imgFile = new File(pageDir + "/" + imgName);
                // əgər fayl yoxdursa, yaradıb export et
                if (!imgFile.exists) {
                    try {
                        createPlaceholderImage(pageDir, imgName, 800, 600, (p + g + im));
                    } catch (e) {
                        $.writeln("Şəkil yaradılma xətası: " + e.toString());
                    }
                }
            }
        }
    }
}

// Placeholder image yaratmaq: kiçik temp sənəd yaradıb səhifəni JPG-ə export edir
function createPlaceholderImage(folder, filename, w, h, seed) {
    // create temp doc
    var dupDoc = app.documents.add();
    try {
        dupDoc.documentPreferences.pageWidth = w/10;
        dupDoc.documentPreferences.pageHeight = h/10;
        var pg = dupDoc.pages[0];
        var rect = pg.rectangles.add();
        rect.geometricBounds = [0,0, dupDoc.documentPreferences.pageHeight, dupDoc.documentPreferences.pageWidth];
        // rəng seçmək üçün seed istifadə et
        var r = (seed * 53) % 255;
        var g = (seed * 97) % 255;
        var b = (seed * 149) % 255;
        // yarat rbg swatch
        var swName = "sample_sw_" + r + "_" + g + "_" + b;
        var sw;
        try {
            sw = dupDoc.colors.add({name: swName, model: ColorModel.process, colorValue: [r/255*100, g/255*100, b/255*100]});
        } catch (e) {
            // əgər dəyişiklik alınmasa, istifadə et mövcud process swatch
            try { sw = dupDoc.colors.item(swName); } catch(e) { sw = null; }
        }
        if (sw) rect.fillColor = sw;
        // əlavə mətni yerləşdir
        var tf = pg.textFrames.add();
        tf.geometricBounds = [dupDoc.documentPreferences.pageHeight/4, dupDoc.documentPreferences.pageWidth/8, dupDoc.documentPreferences.pageHeight*3/4, dupDoc.documentPreferences.pageWidth*7/8];
        tf.contents = filename + "\r\nPlaceholder";
        try { tf.parentStory.appliedFont = app.fonts.item(0); } catch (e) {}
        tf.parentStory.pointSize = 12;
        tf.parentStory.justification = Justification.CENTER_ALIGN;

        // Export page as JPG
        var outFile = new File(folder + "/" + filename);
        var jpgPref = app.jpegExportPreferences;
        jpgPref.jpegQuality = JPEGOptionsQuality.HIGH;
        jpgPref.exportResolution = 150;
        dupDoc.exportFile(ExportFormat.JPG, outFile, false);
    } finally {
        // close without saving
        try { dupDoc.close(SaveOptions.NO); } catch (e) {}
    }
}

win.center();
win.show();