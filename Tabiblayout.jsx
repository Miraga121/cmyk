#targetengine "session"

// ======================= Sənəd yoxlaması =======================
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// ======================= Debug log =======================
var debugLog = [];
function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// ======================= GUI =======================
var win = new Window("palette", "Qəzet Məzmun Yerləşdiricisi — Dizayn Optimallaşdırılmış", undefined, {resizeable:true});
win.orientation = "column";
win.alignChildren = ["fill","top"];
win.spacing = 10;
win.margins = 12;

// Qovluq paneli
var grpFolder = win.add("panel", undefined, "Qovluq");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill","top"];
grpFolder.margins = 8;
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olmalıdır):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [480, 26];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize = [160, 28];

// Grid və opsiyalar
var grpOptions = win.add("group");
grpOptions.orientation = "row";
grpOptions.alignChildren = ["left","center"];

grpOptions.add("statictext", undefined, "Grid sütun:");
var ddlColumns = grpOptions.add("dropdownlist", undefined, ["1","2","3","4"]);
ddlColumns.selection = 1;
ddlColumns.preferredSize = [60,24];

var chkAutoClean = grpOptions.add("checkbox", undefined, "Yerləşdirmədən əvvəl mövcud səhifəni təmizlə");
chkAutoClean.value = true;
chkAutoClean.preferredSize = [300,24];

// İndividual dizayn opsiyaları (sabitləşdirilmiş)
var grpDesign = win.add("panel", undefined, "Dizayn (sabit)");
grpDesign.margins = 8;
grpDesign.orientation = "column";
grpDesign.add("statictext", undefined, "Font: Arial (təmin edilir)");
grpDesign.add("statictext", undefined, "Başlıq ölçüsü: 14pt | Mətn ölçüsü: 10pt | Şəkil zonası: hüceyrənin ~35% hündürlüyü");

// Buttons
var grpBtn = win.add("group");
grpBtn.alignment = "center";
var btnTest = grpBtn.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [120,32];
var btnRun = grpBtn.add("button", undefined, "✅ Məzmunu Yerləşdir");
btnRun.preferredSize = [160,36];
var btnClose = grpBtn.add("button", undefined, "❌ Bağla");
btnClose.preferredSize = [100,32];

// Progress
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [480,22];

// Browse event
btnBrowse.onClick = function() {
    var f = Folder.selectDialog("Ana qovluğu seçin (page2, page3 ... olan)");
    if (f) {
        etFolder.text = f.fsName;
        txtProgress.text = "Qovluq seçildi: " + f.name;
    }
};

// Close
btnClose.onClick = function() { win.close(); };

// ======================= Helper funksiyalar =======================

// UTF-8 mətn oxuma
function readTextFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        var content = file.read();
        file.close();
        if (content && content.length && content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        return content;
    } catch (e) {
        log("Fayl oxuma xətası: " + e.toString());
        return "";
    }
}

// .txt və s. faylları nömrəyə görə sırala
function getNumberedFiles(folder, filterRegex) {
    var all = folder.getFiles();
    var out = [];
    for (var i=0;i<all.length;i++){
        if (all[i] instanceof File && filterRegex.test(all[i].name)) out.push(all[i]);
    }
    out.sort(function(a,b){
        var na = parseInt((a.name.match(/^\d+/)||[0])[0]) || 0;
        var nb = parseInt((b.name.match(/^\d+/)||[0])[0]) || 0;
        return na - nb;
    });
    return out;
}

// Şəkil fayllarını tap (pattern: groupNum-<index>.<ext>)
function findImageFiles(folder, groupNum) {
    var pattern = new RegExp("^" + groupNum + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    var all = folder.getFiles();
    var res = [];
    for (var i=0;i<all.length;i++){
        if (all[i] instanceof File && pattern.test(all[i].name)) res.push(all[i]);
    }
    res.sort(function(a,b){
        var ma = a.name.match(/-(\d+)\./);
        var mb = b.name.match(/-(\d+)\./);
        var na = ma ? parseInt(ma[1]) : 0;
        var nb = mb ? parseInt(mb[1]) : 0;
        return na - nb;
    });
    return res;
}

// Səhifəni təmizləmək (textFrames, rectangles, placed graphics)
function cleanPage(page) {
    try {
        log("🔄 Təmizlənir: " + page.name);
        // Remove textFrames
        for (var t = page.textFrames.length - 1; t >= 0; t--) {
            try { page.textFrames[t].remove(); } catch(e) { }
        }
        // Remove rectangles (often images are in rectangles)
        for (var r = page.rectangles.length - 1; r >= 0; r--) {
            try { page.rectangles[r].remove(); } catch(e) { }
        }
        // Remove any remaining graphics parents
        for (var g = page.allGraphics.length - 1; g >= 0; g--) {
            try { page.allGraphics[g].parent.remove(); } catch(e) { }
        }
        log("✅ Təmizləndi: " + page.name);
    } catch (e) {
        log("Təmizləmə xətası: " + e.toString());
    }
}

// Arial fontu əldə et (fall back cəhdləri)
function getArialFont(style) {
    // style: "Regular" or "Bold"
    var tries = [
        "Arial\t" + style,
        "Arial-" + style,
        "Arial" + style,
        (style === "Bold" ? "Arial-BoldMT" : "ArialMT"),
        "Helvetica\t" + style
    ];
    for (var i=0;i<tries.length;i++) {
        try {
            var f = app.fonts.item(tries[i]);
            if (f && f.isValid) return f;
        } catch(e) {}
    }
    // fallback to first font available
    try { return app.fonts[0]; } catch(e) { return null; }
}

// Dinamik image grid sütun/qat hesabla
function computeGrid(n) {
    // minimal 1, daha balanslı: cols = ceil(sqrt(n))
    var cols = Math.ceil(Math.sqrt(Math.max(1, n)));
    if (cols > n) cols = n;
    var rows = Math.ceil(n / cols);
    return {cols: cols, rows: rows};
}

// ======================= Test düyməsi =======================
btnTest.onClick = function() {
    debugLog = [];
    log("TEST BAŞLADI");
    var rootPath = etFolder.text;
    if (!rootPath) { alert("Qovluq seçin!"); return; }
    var root = new Folder(rootPath);
    if (!root.exists) { alert("Qovluq yoxdur!"); return; }

    // Qovluqlar siyahısı
    var subs = root.getFiles();
    var msg = "Ana qovluqda " + subs.length + " element var.\n\nAlt qovluqlardan bəzilərinin adları:\n";
    var shown = 0;
    for (var i=0;i<subs.length && shown<10;i++) {
        if (subs[i] instanceof Folder) {
            msg += " - " + subs[i].name + "\n";
            shown++;
        }
    }
    log(msg);
    alert("Test tamamlandı!\nKonsolda ətraflı görünür.");
};

// ======================= Run düyməsi (əsas) =======================
btnRun.onClick = function() {
    debugLog = [];
    try {
        var rootPath = etFolder.text;
        if (!rootPath) { alert("Qovluq seçin!"); return; }
        var root = new Folder(rootPath);
        if (!root.exists) { alert("Seçilmiş qovluq mövcud deyil!"); return; }

        var cols = parseInt(ddlColumns.selection.text) || 2;
        txtProgress.text = "İşləyir...";
        win.update();

        var totalPlaced = 0;
        var fontRegular = getArialFont("Regular");
        var fontBold = getArialFont("Bold");

        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(root + "/page" + pageNum);
            if (!pageFolder.exists) {
                log("⚠ Qovluq mövcud deyil: page" + pageNum);
                continue;
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            if (txtFiles.length === 0) {
                log("⚠ Heç .txt faylı yoxdur: page" + pageNum);
                continue;
            }

            var page = doc.pages[pageIndex];
            if (!page) { log("⚠ Səhifə obyekti tapılmadı: index " + pageIndex); continue; }

            // Avtomatik təmizlə seçilibsə, sil
            if (chkAutoClean.value) cleanPage(page);

            // Sahə ölçüləri və grid hesabı
            var bounds = page.bounds; // [y1, x1, y2, x2]
            var margin = page.marginPreferences || {top:36, left:36, bottom:36, right:36};
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rowsNeeded = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rowsNeeded;

            log("Səhifə: " + pageNum + " | fayl: " + txtFiles.length + " | grid: " + cols + "x" + rowsNeeded);
            txtProgress.text = "Səhifə " + pageNum + " işlənir...";
            win.update();

            // Hər txt fayl üçün
            for (var i = 0; i < txtFiles.length; i++) {
                var rowIndex = Math.floor(i / cols);
                var colIndex = i % cols;
                var x = startX + colIndex * cellW;
                var y = startY + rowIndex * cellH;
                var padding = Math.max(4, Math.round(cellW * 0.03)); // nisbətən dinamik padding

                var txtFile = txtFiles[i];
                var content = readTextFile(txtFile);
                if (!content || content.length === 0) { log("Boş fayl: " + txtFile.name); continue; }

                // Sətirləri təmizləyək
                var lines = content.split(/\r?\n/);
                var clean = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var tr = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (tr !== "") clean.push(tr);
                }
                if (clean.length === 0) { log("Təmiz sətir yoxdur: " + txtFile.name); continue; }

                var title = clean[0] || "";
                var body = clean.slice(1).join("\r");

                // Şəkilləri tap
                var groupNum = parseInt((txtFile.name.match(/^\d+/) || [0])[0]) || (i+1);
                var imgs = findImageFiles(pageFolder, groupNum);
                var imgCount = imgs.length;

                // Şəkil zonası hündürlüyü (hüceyrənin yüzdəsi)
                var imgAreaRatio = 0.35; // ~35%
                var imgAreaHeight = Math.round(cellH * imgAreaRatio);
                var currentY = y;

                // ================= Image placement — dinamik grid =================
                if (imgCount > 0) {
                    var grid = computeGrid(imgCount); // {cols, rows}
                    var imgCols = grid.cols;
                    var imgRows = grid.rows;

                    // hesabla hər şəkilin ölçüsü
                    var totalHPad = padding * (imgCols + 1);
                    var totalVPad = padding * (imgRows + 1);
                    var imgW = Math.max(10, Math.round((cellW - totalHPad) / imgCols));
                    var imgH = Math.max(10, Math.round((imgAreaHeight - totalVPad) / imgRows));

                    // mərkəzləşdirmək üçün startX offset (şəklin tam eni < cellW)
                    var imgStartX = x + Math.round((cellW - (imgW * imgCols + padding * (imgCols + 1))) / 2) + padding;
                    var imgStartY = currentY + padding;

                    for (var k = 0; k < imgCount; k++) {
                        var ic = k % imgCols;
                        var ir = Math.floor(k / imgCols);
                        var px = imgStartX + ic * (imgW + padding);
                        var py = imgStartY + ir * (imgH + padding);

                        try {
                            var r = page.rectangles.add();
                            // geometricBounds: [y1, x1, y2, x2]
                            r.geometricBounds = [py, px, py + imgH, px + imgW];
                            r.strokeWeight = 0;
                            r.place(imgs[k]);
                            try { r.fit(FitOptions.FILL_PROPORTIONALLY); } catch(fe){}
                            totalPlaced++;
                        } catch(e) {
                            log("Şəkil yerləşdirmə xətası: " + e.toString());
                        }
                    }
                    currentY += imgAreaHeight + padding;
                }

                // ================= Title placement =================
                if (title && title.length) {
                    try {
                        var titleH = 18; // fixed height for title area
                        var tf = page.textFrames.add();
                        tf.geometricBounds = [currentY, x + padding, currentY + titleH, x + cellW - padding];
                        tf.contents = title;
                        try { tf.parentStory.characters.everyItem().appliedFont = fontBold; } catch(e){}
                        try { tf.parentStory.characters.everyItem().pointSize = 14; } catch(e){}
                        tf.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
                        currentY += titleH + Math.round(padding/2);
                        totalPlaced++;
                    } catch(e) { log("Başlıq xətası: " + e.toString()); }
                }

                // ================= Body placement =================
                if (body && body.length) {
                    try {
                        var bf = page.textFrames.add();
                        bf.geometricBounds = [currentY, x + padding, y + cellH - padding, x + cellW - padding];
                        bf.contents = body;
                        try { bf.parentStory.characters.everyItem().appliedFont = fontRegular; } catch(e){}
                        try { bf.parentStory.characters.everyItem().pointSize = 10; } catch(e){}
                        bf.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
                        totalPlaced++;
                    } catch(e) { log("Mətn xətası: " + e.toString()); }
                }
            } // end for each txt file (i)
        } // end for each page

        txtProgress.text = "✅ Tamamlandı! " + totalPlaced + " element yerləşdirildi";
        alert("✅ Tamamlandı!\n" + totalPlaced + " element yerləşdirildi.\nKonsolda ətraflı jurnal var.");
        log("Tamamlandı — yerləşdirildi: " + totalPlaced);

    } catch (e) {
        log("KRİTİK XƏTA: " + e.toString());
        if (e.line) log("Sətir: " + e.line);
        alert("❌ Xəta: " + e.toString() + (e.line ? ("\nSətir: " + e.line) : ""));
        txtProgress.text = "Xəta baş verdi!";
    }
};

// End of script UI
win.center();
win.show();
