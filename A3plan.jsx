#targetengine "session"

// ----------------------------------------------------
// GLOBAL QURULUŞ VƏ TƏYİNATLAR
// ----------------------------------------------------

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!");
    exit();
}

// Skriptin BÜTÜN ölçü hesablamaları üçün istifadə ediləcək vahid
var UNIT = MeasurementUnits.POINTS; 

// Log funksiyası
var debugLog = [];
function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// ----------------------------------------------------
// HELPER FUNKSIYALAR
// ----------------------------------------------------

function readFile(f) {
    if (!f.exists) return "";
    try {
        f.encoding = "UTF-8";
        f.open("r");
        var c = f.read();
        f.close();
        // BOM (Byte Order Mark) silinməsi
        if (c.charCodeAt(0) === 0xFEFF) c = c.slice(1);
        return c;
    } catch(e) { return ""; }
}

function getFiles(folder, regex) {
    var all = folder.getFiles();
    var res = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i] instanceof File && regex.test(all[i].name)) {
            res.push(all[i]);
        }
    }
    // Faylları ədədi ardıcıllıqla sıralama
    res.sort(function(a, b) {
        var na = parseInt(a.name.match(/^\d+/)) || 0;
        var nb = parseInt(b.name.match(/^\d+/)) || 0;
        return na - nb;
    });
    return res;
}

function findImgs(folder, num) {
    var pattern = new RegExp("^" + num + "-(\\d+)\\.(jpe?g|png|tiff?|gif)$", "i");
    var all = folder.getFiles();
    var res = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i] instanceof File && pattern.test(all[i].name)) {
            res.push(all[i]);
        }
    }
    // Əlavə şəkilləri nömrəyə görə sıralama
    res.sort(function(a, b) {
        var ma = a.name.match(/-(\d+)\./);
        var mb = b.name.match(/-(\d+)\./);
        var na = ma ? parseInt(ma[1]) : 0;
        var nb = mb ? parseInt(mb[1]) : 0;
        return na - nb;
    });
    return res;
}

// ----------------------------------------------------
// GUI YARADILMASI
// ----------------------------------------------------

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.2 (19.0 Uyğunluq)");
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 15;
win.margins = 20;

// Qovluq
var grpFolder = win.add("panel", undefined, "Qovluq");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 15;
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [450, 30];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç");

// Layout
var grpLayout = win.add("panel", undefined, "Layout");
grpLayout.orientation = "column";
grpLayout.alignChildren = ["fill", "top"];
grpLayout.margins = 15;

var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Sütun:");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1;

var grpImg = grpLayout.add("group");
grpImg.add("statictext", undefined, "Şəkil sahəsi %:");
var sliderImg = grpImg.add("slider", undefined, 40, 20, 60);
var txtImg = grpImg.add("statictext", undefined, "40%");
txtImg.preferredSize = [50, 20];
sliderImg.onChanging = function() {
    txtImg.text = Math.round(this.value) + "%";
};

var grpPad = grpLayout.add("group");
grpPad.add("statictext", undefined, "Boşluq pt:");
var ddlPad = grpPad.add("dropdownlist", undefined, ["0", "3", "5", "8"]);
ddlPad.selection = 2;

// Font
var grpFont = win.add("panel", undefined, "Font");
grpFont.orientation = "column";
grpFont.alignChildren = ["fill", "top"];
grpFont.margins = 15;

var grpTitle = grpFont.add("group");
grpTitle.add("statictext", undefined, "Başlıq:");
var ddlTitleSize = grpTitle.add("dropdownlist", undefined, ["12", "14", "16", "18"]);
ddlTitleSize.selection = 2;

var grpBody = grpFont.add("group");
grpBody.add("statictext", undefined, "Mətn:");
var ddlBodySize = grpBody.add("dropdownlist", undefined, ["8", "9", "10", "11"]);
ddlBodySize.selection = 2;

var chkBold = grpFont.add("checkbox", undefined, "Başlıq qalın");
chkBold.value = true;

// Səhifələr
var grpPages = win.add("panel", undefined, "Səhifələr");
grpPages.orientation = "row";
grpPages.alignChildren = ["left", "top"];
grpPages.margins = 15;

var chkPages = [];
for (var p = 2; p <= 8; p++) {
    var chk = grpPages.add("checkbox", undefined, "S" + p);
    chk.value = true;
    chkPages.push(chk);
}

// Seçimlər
var grpOpt = win.add("panel", undefined, "Seçimlər");
grpOpt.orientation = "column";
grpOpt.alignChildren = ["fill", "top"];
grpOpt.margins = 15;

var chkClear = grpOpt.add("checkbox", undefined, "Mövcud çərçivələri sil");
var chkBorder = grpOpt.add("checkbox", undefined, "Şəkillərə sərhəd");
chkBorder.value = true;
var chkLayer = grpOpt.add("checkbox", undefined, "Layer yarat");

// Düymələr
var grpBtn = win.add("group");
var btnTest = grpBtn.add("button", undefined, "🔍 Test");
var btnRun = grpBtn.add("button", undefined, "✅ Yerləşdir");
var btnCancel = grpBtn.add("button", undefined, "❌ Bağla", {name: "cancel"});

var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [450, 25];

// ----------------------------------------------------
// EVENT HANDLERS
// ----------------------------------------------------

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluq");
    if (folder) etFolder.text = folder.fsName;
};

btnTest.onClick = function() {
    debugLog = [];
    log("TEST BAŞLADI");

    var root = etFolder.text;
    if (!root) { alert("Qovluq seçin!"); return; }

    var rootFolder = new Folder(root);
    if (!rootFolder.exists) { alert("Qovluq yoxdur!"); return; }

    var total = 0;
    for (var p = 2; p <= 8; p++) {
        var pf = new Folder(rootFolder + "/page" + p);
        if (pf.exists) {
            var txt = getFiles(pf, /\.txt$/i).length;
            var img = getFiles(pf, /\.(jpe?g|png|tiff?)$/i).length;
            log("Səh " + p + ": " + txt + " txt, " + img + " img");
            total += txt + img;
        }
    }
    alert("Test: " + total + " fayl tapıldı (Ətraflı konsolda)");
};

// ----------------------------------------------------
// ❌ IN DESIGN 19.0 ÜÇÜN DÜZƏLİŞLƏR BURADA TƏTBİQ OLUNUB
// ----------------------------------------------------

btnRun.onClick = function() {
    debugLog = [];
    
    // 1. Ölçü Vahidi Dəyişikliyini Saxla və Tətbiq et (19.0 üçün vacib addım)
    var originalUnit = app.scriptPreferences.measurementUnit;
    app.scriptPreferences.measurementUnit = UNIT; // POINTS (GLOBAL TƏYİNAT)

    try {
        var root = etFolder.text;
        if (!root) { alert("Qovluq seçin!"); return; }

        var rootFolder = new Folder(root);
        if (!rootFolder.exists) { alert("Qovluq yoxdur!"); return; }

        var cols = parseInt(ddlColumns.selection.text);
        var imgRatio = Math.round(sliderImg.value) / 100;
        var padding = parseInt(ddlPad.selection.text);
        var titleSize = parseInt(ddlTitleSize.selection.text);
        var bodySize = parseInt(ddlBodySize.selection.text);

        log("START: " + cols + " sütun, Padding: " + padding + "pt");

        // 2. "Black" rənginin varlığını yoxlama və ya yaratma (Mümkün ReferenceError qarşısını alır)
        var blackColor = doc.swatches.item("Black");
        if (!blackColor.isValid) {
            blackColor = doc.colors.add({name:"Black", model:ColorModel.PROCESS, space:ColorSpace.CMYK, colorValue:[0,0,0,100]});
        }

        var placed = 0;

        for (var pi = 1; pi <= 7; pi++) {
            if (!chkPages[pi - 1].value) continue;

            var pageNum = pi + 1;
            var pf = new Folder(rootFolder + "/page" + pageNum);
            if (!pf.exists) continue;

            var page = doc.pages[pi];
            
            // Layer yaratma
            if (chkLayer.value) {
                try {
                    var ln = "Səhifə " + pageNum + " Məzmunu";
                    var layer = doc.layers.item(ln);
                    if (!layer.isValid) layer = doc.layers.add({name: ln});
                    doc.activeLayer = layer;
                } catch(e) { log("Layer xətası: " + e); }
            }
            
            // Mövcud elementləri sil
            if (chkClear.value) {
                var items = page.allPageItems;
                for (var it = items.length - 1; it >= 0; it--) {
                    try { items[it].remove(); } catch(e) {}
                }
            }

            var txtFiles = getFiles(pf, /\.txt$/i);
            if (txtFiles.length === 0) continue;

            var bounds = page.bounds;
            var margin = page.marginPreferences;
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            txtProgress.text = "Səhifə " + pageNum + " (" + txtFiles.length + " element)...";
            win.update();

            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                var content = readFile(txtFiles[i]);
                if (!content) continue;

                var lines = content.split(/\r?\n/);
                var clean = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var tr = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (tr !== "") {
                        clean.push(tr);
                    }
                }
                if (clean.length === 0) continue;

                var title = clean[0] || "";
                var bodyArr = clean.slice(1);
                var body = bodyArr.join("\r");

                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgs = findImgs(pf, groupNum);

                var curY = y;
                var elementGroup = [];

                // Şəkillər
                if (imgs.length > 0) {
                    var imgH = cellH * imgRatio;
                    var imgCols = Math.min(imgs.length, 2);
                    
                    var imgTotalW = cellW - padding * 2; 
                    var imgW = (imgTotalW - padding * (imgCols - 1)) / imgCols;
                    
                    var imgRows = (imgs.length > 2) ? 2 : 1;
                    var singleImgH = (imgH - padding * (imgRows + 1)) / imgRows;

                    for (var j = 0; j < imgs.length && j < 4; j++) {
                        var ic = j % imgCols;
                        var ir = Math.floor(j / imgCols);
                        
                        var ix = x + padding + (ic * (imgW + padding));
                        var iy = curY + padding + (ir * (singleImgH + padding));

                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [iy, ix, iy + singleImgH, ix + imgW]; 
                            rect.place(imgs[j]);
                            rect.fit(FitOptions.FILL_PROPORTIONALLY);
                            rect.fit(FitOptions.CENTER_CONTENT);

                            if (chkBorder.value) {
                                rect.strokeWeight = 1;
                                rect.strokeColor = blackColor; // Təyin olunmuş rəng istifadə olunur
                            } else {
                                rect.strokeWeight = 0;
                            }
                            elementGroup.push(rect);
                            placed++;
                        } catch(e) { log("Img err: " + e); }
                    }
                    curY += imgH;
                }

                // Başlıq
                if (title !== "") {
                    try {
                        var tf = page.textFrames.add();
                        tf.geometricBounds = [curY, x + padding, curY + titleSize * 2 + 10, x + cellW - padding];
                        tf.contents = title;

                        var story = tf.parentStory;
                        story.characters.everyItem().pointSize = titleSize;
                        
                        if (chkBold.value) {
                            // 3. Etibarlı font tətbiqi
                            story.paragraphs.everyItem().fontStyle = "Bold"; 
                        }
                        
                        tf.fit(FitOptions.FRAME_TO_CONTENT);
                        curY = tf.geometricBounds[2] + padding;
                        elementGroup.push(tf);
                        placed++;
                    } catch(e) { log("Title err: " + e); }
                }

                // Mətn
                if (body !== "") {
                    try {
                        var bf = page.textFrames.add();
                        bf.geometricBounds = [curY, x + padding, y + cellH - padding, x + cellW - padding];
                        bf.contents = body;
                        
                        var story = bf.parentStory;
                        story.characters.everyItem().pointSize = bodySize;
                        story.paragraphs.everyItem().justification = Justification.LEFT_JUSTIFIED;
                        
                        elementGroup.push(bf);
                        placed++;
                    } catch(e) { log("Body err: " + e); }
                }
                
                // Qruplaşdırma
                if (elementGroup.length > 0) {
                    try {
                        page.groups.add(elementGroup);
                    } catch(e) { 
                        log("Qruplaşdırma xətası: " + e); 
                    }
                }
            }
        }

        log("DONE: " + placed + " element");
        txtProgress.text = "✅ " + placed + " element";
        alert("✅ " + placed + " element yerləşdirildi!");
        win.close();

    } catch(e) {
        alert("❌ Kritik Xəta: " + e.toString() + "\nSətir: " + e.line);
        log("ERROR: " + e.toString() + " (Sətir: " + e.line + ")");
    } finally {
        // Orijinal ölçü vahidini bərpa etmə (sistemdə qalmasın)
        app.scriptPreferences.measurementUnit = originalUnit; 
    }
};

// ----------------------------------------------------
// PƏNCƏRƏ GÖSTƏRİLMƏSİ
// ----------------------------------------------------
win.center();
win.show();