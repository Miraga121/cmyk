#targetengine "session"

// QƏZET MƏZMUN YERLƏŞDİRİCİSİ v2.2 — InDesign 19.x Uyğun
// Uyğunluq: InDesign 19.x (ExtendScript)
// Yeniləmə: 2025-11-12
// FİKS:
// - allPageItems → page.pageItems (InDesign 19 API)
// - geometricBounds array-lər düzəldildi
// - Font tətbiq etmə xətaları işləndi
// - Text frame overflow daha etibarlı

#targetengine "session"

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Heç olmasa 8 səhifə olmalıdır — hal-hazırda: " + doc.pages.length);
    exit();
}

// Global
var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;

function log(msg) {
    debugLog.push(msg);
    try { $.writeln(msg); } catch(e) {}
}

// SIMPLE CONFIG DEFAULTS
var defaults = {
    columns: 2,
    imageRatio: 40,
    padding: 5,
    titleSize: 14,
    bodySize: 10,
    overflowMode: "Avto-resize",
    maxLinked: 3,
    minFontSize: 8,
    firstColExtraPercent: 0
};

// UI
var win = new Window("dialog", "Qəzet Yerləşdiricisi v2.2 (19.x)", undefined, {resizeable:true});
win.orientation = "column";
win.alignChildren = ["fill","top"];
win.margins = 12;
win.spacing = 8;

var tabPanel = win.add("tabbedpanel");
tabPanel.preferredSize = [620,520];
tabPanel.alignChildren = ["fill","fill"];

// TAB: Əsas
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column"; tab1.alignChildren = ["fill","top"]; tab1.spacing = 8;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.margins = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ...):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [560,28];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 26;

var grpLayout = tab1.add("panel", undefined, "Layout");
grpLayout.margins = 10;
var gCols = grpLayout.add("group");
gCols.add("statictext", undefined, "Grid sütun sayı:");
var ddlColumns = gCols.add("dropdownlist", undefined, ["1","2","3","4"]);
ddlColumns.selection = defaults.columns - 1;
ddlColumns.preferredSize = [80,22];

var gFirstCol = grpLayout.add("group");
gFirstCol.add("statictext", undefined, "İlk sütun əlavə genişlik (%):");
var etFirstCol = gFirstCol.add("edittext", undefined, defaults.firstColExtraPercent.toString());
etFirstCol.preferredSize = [60,22];
var chkEnableFirstCol = gFirstCol.add("checkbox", undefined, "Aktiv et");
chkEnableFirstCol.value = false;

var gImg = grpLayout.add("group");
gImg.add("statictext", undefined, "Şəkil sahəsi (% hüceyrə hündürlüyü):");
var sliderImg = gImg.add("slider", undefined, defaults.imageRatio, 20, 60);
sliderImg.preferredSize = [300,22];
var txtImg = gImg.add("statictext", undefined, defaults.imageRatio + "%");
txtImg.preferredSize = [40,22];
sliderImg.onChanging = function(){ txtImg.text = Math.round(this.value) + "%"; };

var gPad = grpLayout.add("group");
gPad.add("statictext", undefined, "Padding (pt):");
var ddlPadding = gPad.add("dropdownlist", undefined, ["0","3","5","8","10"]);
ddlPadding.selection = 2;
ddlPadding.preferredSize = [80,22];

// page selection
var grpPages = tab1.add("panel", undefined, "Səhifələr (page2..page8)");
grpPages.margins = 10;
var chkPages = [];
var row1 = grpPages.add("group");
row1.orientation = "row";
for (var p=2;p<=8;p++){
    var c = row1.add("checkbox", undefined, "S." + p);
    c.value = true;
    chkPages.push(c);
}
var rowBtns = grpPages.add("group");
var btnAll = rowBtns.add("button", undefined, "Hamısını seç"); 
btnAll.onClick = function(){ for(var i=0;i<chkPages.length;i++) chkPages[i].value = true; };
var btnNone = rowBtns.add("button", undefined, "Hamısını götür"); 
btnNone.onClick = function(){ for(var i=0;i<chkPages.length;i++) chkPages[i].value = false; };

// TAB: Tipoqrafiya
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column"; tab2.alignChildren = ["fill","top"]; tab2.spacing = 8;

var grpTitle = tab2.add("panel", undefined, "Başlıq");
grpTitle.margins = 10;
var rowTitle = grpTitle.add("group");
rowTitle.add("statictext", undefined, "Font ölçüsü:");
var ddlTitleSize = rowTitle.add("dropdownlist", undefined, ["12","14","16","18","20","24"]);
ddlTitleSize.selection = 1;
ddlTitleSize.preferredSize = [80,22];
rowTitle.add("statictext", undefined, "Hizalama:");
var ddlTitleAlign = rowTitle.add("dropdownlist", undefined, ["Sol","Mərkəz","Sağ"]);
ddlTitleAlign.selection = 0;
ddlTitleAlign.preferredSize = [100,22];
var chkTitleBold = grpTitle.add("checkbox", undefined, "Qalın (Bold)");
chkTitleBold.value = true;

var grpBody = tab2.add("panel", undefined, "Mətn");
grpBody.margins = 10;
var rowBody = grpBody.add("group");
rowBody.add("statictext", undefined, "Font ölçüsü:");
var ddlBodySize = rowBody.add("dropdownlist", undefined, ["8","9","10","11","12","14"]);
ddlBodySize.selection = 2;
ddlBodySize.preferredSize = [80,22];
rowBody.add("statictext", undefined, "Hizalama:");
var ddlBodyAlign = rowBody.add("dropdownlist", undefined, ["Sol","İki tərəfə","Mərkəz"]);
ddlBodyAlign.selection = 1;
ddlBodyAlign.preferredSize = [120,22];

// TAB: ŞƏKİLLƏR
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column"; tab3.alignChildren = ["fill","top"]; tab3.spacing = 8;
var grpImgSet = tab3.add("panel", undefined, "Parametrlər");
grpImgSet.margins = 10;
var rowFit = grpImgSet.add("group");
rowFit.add("statictext", undefined, "Yerləşdirmə:");
var ddlFit = rowFit.add("dropdownlist", undefined, ["Proporsional doldur","Çərçivəyə sığdır"]);
ddlFit.selection = 0;
ddlFit.preferredSize = [180,22];
var chkImgBorder = grpImgSet.add("checkbox", undefined, "Şəkil sərhədi");
chkImgBorder.value = true;
var rowBW = grpImgSet.add("group");
rowBW.add("statictext", undefined, "Sərhəd qalınlığı (pt):");
var ddlBW = rowBW.add("dropdownlist", undefined, ["0.5","1","2","3"]); 
ddlBW.selection = 1; 
ddlBW.preferredSize = [80,22];

// TAB: ƏLAVƏ
var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column"; tab4.alignChildren = ["fill","top"]; tab4.spacing = 8;
var grpExtra = tab4.add("panel", undefined, "Seçimlər");
grpExtra.margins = 10;
var chkClear = grpExtra.add("checkbox", undefined, "Mövcud elementləri sil");
chkClear.value = true;
var chkLayers = grpExtra.add("checkbox", undefined, "Hər səhifə üçün layer yarat");

// Bottom buttons
var btnGroup = win.add("group");
btnGroup.alignment = "right";
var btnTest = btnGroup.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [110,36];
var btnRun = btnGroup.add("button", undefined, "✅ Yerləşdir");
btnRun.preferredSize = [140,36];
var btnClose = btnGroup.add("button", undefined, "❌ Bağla", {name:"cancel"});
btnClose.preferredSize = [100,36];

var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [600,22];

// ============= HELPER FUNCTIONS =============

function readTextFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return "";
        var content = file.read();
        file.close();
        if (content && content.length > 0 && content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    } catch (e) {
        log("Fayl oxuma xətası: " + file.name + " — " + e.message);
        return "";
    }
}

function getNumberedFiles(folder, filterRegex) {
    if (!folder || !folder.exists) return [];
    try {
        var all = folder.getFiles();
        if (!all || all.length === 0) return [];
        var out = [];
        for (var i = 0; i < all.length; i++) {
            try {
                if (all[i] instanceof File && filterRegex.test(all[i].name)) {
                    out.push(all[i]);
                }
            } catch(e){}
        }
        out.sort(function(a,b){
            var na = parseInt(a.name.match(/^\d+/)) || 0;
            var nb = parseInt(b.name.match(/^\d+/)) || 0;
            return na - nb;
        });
        return out;
    } catch (e) {
        log("getNumberedFiles error: " + e.message);
        return [];
    }
}

function findImageFiles(folder, groupNum) {
    if (!folder || !folder.exists) return [];
    try {
        var pattern = new RegExp("^" + groupNum + "[-_]?(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$","i");
        var all = folder.getFiles();
        if (!all || all.length === 0) return [];
        var res = [];
        for (var i = 0; i < all.length; i++) {
            try {
                if (all[i] instanceof File && pattern.test(all[i].name)) {
                    res.push(all[i]);
                }
            } catch(e){}
        }
        res.sort(function(a,b){
            var ma = a.name.match(/[-_](\d+)\./);
            var mb = b.name.match(/[-_](\d+)\./);
            var na = ma ? parseInt(ma[1]) : 0;
            var nb = mb ? parseInt(mb[1]) : 0;
            return na - nb;
        });
        return res;
    } catch (e) {
        log("findImageFiles error: " + e.message);
        return [];
    }
}

// FIX: InDesign 19 page clearing (InDesign 19-da .allPageItems əvəzinə .pageItems)
function clearPageContent(page) {
    try {
        if (!page) {
            log("❌ clearPageContent: page nəll-dür");
            return false;
        }
        
        // InDesign 19.x uyğun API
        var items = page.pageItems;
        if (!items) {
            log("⚠️ pageItems mövcud deyil");
            return false;
        }

        log("  Silinəcək element sayı: " + items.length);
        
        // Ters sırada sil (son elementdən başla)
        for (var i = items.length - 1; i >= 0; i--) {
            try {
                if (items[i] && items[i].isValid) {
                    items[i].remove();
                }
            } catch(e) {
                // Hər elementin silinməsi uğursuz ola bilər, davam et
            }
        }
        
        log("  ✓ Səhifə əvvəlki məzmundan təmizləndi");
        return true;
    } catch (e) {
        log("❌ clearPageContent xətası: " + e.message);
        return false;
    }
}

// UI events
btnBrowse.onClick = function() {
    var f = Folder.selectDialog("Ana qovluğu seçin");
    if (f) {
        etFolder.text = f.fsName;
        txtProgress.text = "Qovluq seçildi: " + f.name;
    }
};

btnTest.onClick = function() {
    debugLog = [];
    log("═══════════════════════════════════════");
    log("TEST BAŞLADI");
    log("═══════════════════════════════════════");
    
    var root = new Folder(etFolder.text);
    if (!root || !root.exists) {
        alert("Qovluq mövcud deyil: " + etFolder.text);
        return;
    }
    
    log("Ana qovluq: " + root.fsName);
    var totalTxt = 0, totalImg = 0;
    
    for (var p = 2; p <= 8; p++) {
        var fld = new Folder(root + "/page" + p);
        if (!fld.exists) {
            log("⚠️ page" + p + " yoxdur");
            continue;
        }
        
        var txtArr = getNumberedFiles(fld, /\.txt$/i);
        var imgArr = getNumberedFiles(fld, /\.(jpe?g|png|tiff?|gif|bmp)$/i);
        
        log("✓ page" + p + ": " + txtArr.length + " txt, " + imgArr.length + " img");
        totalTxt += txtArr.length;
        totalImg += imgArr.length;
    }
    
    log("═══════════════════════════════════════");
    log("CƏMI: " + totalTxt + " mətn, " + totalImg + " şəkil");
    log("═══════════════════════════════════════");
    
    alert("Test tamamlandı!\n\n" + totalTxt + " mətn faylı\n" + totalImg + " şəkil faylı\n\nKonsola baxın qruplandırma üçün.");
};

// CORE PLACEMENT LOGIC — InDesign 19.x FIX
btnRun.onClick = function() {
    debugLog = [];
    totalPlaced = 0;
    totalErrors = 0;
    
    try {
        log("═══════════════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI — " + new Date().toString());
        log("═══════════════════════════════════════");

        var root = new Folder(etFolder.text);
        if (!root || !root.exists) {
            alert("❌ Ana qovluq seçin");
            return;
        }

        var cols = parseInt(ddlColumns.selection.text) || 2;
        var padding = parseFloat(ddlPadding.selection.text) || 5;
        var titleSize = parseInt(ddlTitleSize.selection.text) || defaults.titleSize;
        var bodySize = parseInt(ddlBodySize.selection.text) || defaults.bodySize;
        var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
        var bodyAlign = [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];
        var fitOption = ddlFit.selection.index === 0 ? FitOptions.FILL_PROPORTIONALLY : FitOptions.CONTENT_TO_FRAME;
        
        var imgRatio = Math.round(sliderImg.value) / 100;
        var shouldClear = chkClear.value;
        var shouldLayers = chkLayers.value;

        log("Konfiguratsiya:");
        log("  Sütun: " + cols + " | Padding: " + padding);
        log("  Başlıq: " + titleSize + "pt | Mətn: " + bodySize + "pt");
        log("  Şəkil nisbəti: " + Math.round(imgRatio * 100) + "%");
        log("  Təmizləmə: " + (shouldClear ? "AÇIQ" : "KAPAL"));

        var processedPages = 0;

        // SƏHIFƏ DÖNGÜSÜ
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            if (!chkPages[pageIndex - 1].value) continue;
            
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(root + "/page" + pageNum);
            
            log("\n╔════════════════════════════════════╗");
            log("║ SƏHİFƏ " + pageNum);
            log("╚════════════════════════════════════╝");
            
            if (!pageFolder.exists) {
                log("❌ Qovluq yoxdur: " + pageFolder.fsName);
                continue;
            }

            var page = doc.pages[pageIndex];
            if (!page || !page.isValid) {
                log("❌ Səhifə direktli deyil (index: " + pageIndex + ")");
                continue;
            }

            // SƏHIFƏ TEMİZLƏMƏSİ
            if (shouldClear) {
                log("🧹 Səhifə təmizlənir...");
                clearPageContent(page);
                $.sleep(200);
            }

            // LAYER YARATMAQ
            if (shouldLayers) {
                try {
                    var lname = "Səh. " + pageNum;
                    var layer = doc.layers.itemByName(lname);
                    if (!layer || !layer.isValid) {
                        layer = doc.layers.add({name: lname});
                    }
                    doc.activeLayer = layer;
                    log("✓ Layer: " + lname);
                } catch(e) {
                    log("⚠️ Layer xətası: " + e.message);
                }
            }

            // MƏTN FАЙ LAR ÜNÜN TAPİLMASI
            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            if (!txtFiles || txtFiles.length === 0) {
                log("❌ Heç bir .txt fayl yoxdur");
                continue;
            }

            log("📄 Mətn faylları: " + txtFiles.length);

            // SƏHIFƏ ÖLÇÜLƏRÎ
            var bounds = page.bounds;
            var margin = page.marginPreferences;
            
            if (!margin) {
                margin = {top: 12.7, left: 12.7, bottom: 12.7, right: 12.7};
            }

            var usableW = (bounds[3] - bounds[1]) - margin.left - margin.right;
            var usableH = (bounds[2] - bounds[0]) - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            log("Səhifə: " + usableW.toFixed(1) + " × " + usableH.toFixed(1));

            // GRID HESABLAMASI
            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            log("Grid: " + cols + " sütun × " + rows + " sətir");
            log("Hüceyrə: " + cellW.toFixed(1) + " × " + cellH.toFixed(1));

            txtProgress.text = "Səhifə " + pageNum + ": " + txtFiles.length + " element işlənir...";
            win.update();

            // MƏZMUN DÖNGÜsÜ
            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + (col * cellW);
                var y = startY + (row * cellH);

                log("\n  ➤ " + (i + 1) + "/" + txtFiles.length + ": " + txtFiles[i].name);
                log("    Grid: [" + row + "," + col + "] @ (" + x.toFixed(1) + "," + y.toFixed(1) + ")");

                // MƏTN OXUMA
                var content = readTextFile(txtFiles[i]);
                if (!content || content.length === 0) {
                    log("    ⚠️ Mətn boşdur");
                    continue;
                }

                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed) cleanLines.push(trimmed);
                }

                if (cleanLines.length === 0) {
                    log("    ⚠️ Təmiz sətirlər yoxdur");
                    continue;
                }

                var title = cleanLines[0] || "";
                var bodyLines = cleanLines.slice(1);
                var body = bodyLines.join("\r");

                log("    📌 Başlıq: " + title.substring(0, 50));
                log("    📝 Mətn: " + body.length + " simvol");

                // ŞƏKİLLƏR
                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);

                log("    🖼️ Şəkillər: " + imgFiles.length);

                var currentY = y;

                // ŞƏKIL YERLƏŞDIRMƏ
                if (imgFiles && imgFiles.length > 0) {
                    var imgH = cellH * imgRatio;
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgW = (cellW - padding * 2) / imgCols;

                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        var imgX = x + padding + (imgCol * imgW);
                        var imgY = currentY + padding + (imgRow * (imgH / 2));

                        try {
                            // FIX: geometricBounds array düzəlişi
                            var rect = page.rectangles.add();
                            var imgFrameH = (imgH / 2) - padding;
                            var imgFrameW = imgW - padding;

                            // [top, left, bottom, right]
                            rect.geometricBounds = [imgY, imgX, imgY + imgFrameH, imgX + imgFrameW];

                            rect.place(imgFiles[j]);
                            try { rect.fit(fitOption); } catch(e){}

                            if (chkImgBorder.value) {
                                try {
                                    rect.strokeWeight = parseFloat(ddlBW.selection.text);
                                    var blackSwatch = doc.swatches.itemByName("Black");
                                    if (blackSwatch) rect.strokeColor = blackSwatch;
                                } catch(e){}
                            } else {
                                rect.strokeWeight = 0;
                            }

                            log("      ✓ Şəkil: " + imgFiles[j].name);
                            totalPlaced++;
                        } catch(e) {
                            log("      ✗ Şəkil xətası: " + e.message);
                            totalErrors++;
                        }
                    }
                    currentY += (imgH + padding);
                }

                // BAŞLIQ YERLƏŞDIRMƏ
                if (title && title.length > 0) {
                    try {
                        var titleH = titleSize + 8;
                        var tFrame = page.textFrames.add();

                        // [top, left, bottom, right]
                        tFrame.geometricBounds = [currentY, x + padding, currentY + titleH, x + cellW - padding];
                        tFrame.contents = title;

                        // Font tətbiqi — safe try/catch
                        try {
                            if (chkTitleBold.value) {
                                var fonts = app.fonts;
                                var boldFont = null;
                                
                                // Arial Bold axtarış
                                for (var f = 0; f < fonts.length; f++) {
                                    if (fonts[f].name.indexOf("Arial") !== -1 && fonts[f].name.indexOf("Bold") !== -1) {
                                        boldFont = fonts[f];
                                        break;
                                    }
                                }
                                
                                if (boldFont) {
                                    tFrame.parentStory.characters.everyItem().appliedFont = boldFont;
                                }
                            }
                        } catch(e) {
                            log("      ⚠️ Bold font xətası, adi istifadə edilir");
                        }

                        tFrame.parentStory.characters.everyItem().pointSize = titleSize;
                        tFrame.parentStory.paragraphs.everyItem().justification = titleAlign;

                        currentY += (titleH + padding);
                        log("    ✓ Başlıq yerləşdi");
                        totalPlaced++;
                    } catch(e) {
                        log("    ✗ Başlıq xətası: " + e.message);
                        totalErrors++;
                    }
                }

                // MƏTN YERLƏŞDIRMƏ
                if (body && body.length > 0) {
                    try {
                        var bottom = y + cellH - padding;
                        var availHeight = bottom - currentY;

                        if (availHeight > 10) {
                            var tFrame = page.textFrames.add();

                            // [top, left, bottom, right]
                            tFrame.geometricBounds = [currentY, x + padding, bottom, x + cellW - padding];
                            tFrame.contents = body;

                            try {
                                tFrame.parentStory.characters.everyItem().pointSize = bodySize;
                            } catch(e){}

                            try {
                                tFrame.parentStory.paragraphs.everyItem().justification = bodyAlign;
                            } catch(e){}

                            log("    ✓ Mətn yerləşdi");
                            totalPlaced++;
                        } else {
                            log("    ⚠️ Mətn üçün sahə yoxdur");
                        }
                    } catch(e) {
                        log("    ✗ Mətn xətası: " + e.message);
                        totalErrors++;
                    }
                }
            } // txtFiles loop

            processedPages++;
        } // pages loop

        log("\n═══════════════════════════════════════");
        log("✅ YERLƏŞDİRMƏ TAMAMLANDI");
        log("═══════════════════════════════════════");
        log("İşlənmiş səhifə: " + processedPages);
        log("Yerləşdirilən element: " + totalPlaced);
        log("Xətalar: " + totalErrors);
        log("═══════════════════════════════════════");

        txtProgress.text = "✅ " + totalPlaced + " element | " + totalErrors + " xəta";

        alert("✅ TAMAMLANDI!\n\n" +
              "Səhifə: " + processedPages + "\n" +
              "Element: " + totalPlaced + "\n" +
              "Xəta: " + totalErrors + "\n\n" +
              "Detallar üçün konsola baxın.");

    } catch (e) {
        log("❌ CİDDİ XƏTA");
        log("Mesaj: " + e.message);
        log("Sətir: " + (e.line || "bilinmir"));

        alert("❌ XƏTA!\n\n" + e.message + "\n\nKonsola baxın.");
        txtProgress.text = "❌ Xəta!";
    }
};

win.center();
win.show();