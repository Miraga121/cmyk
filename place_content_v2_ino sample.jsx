#targetengine "session"

// InDesign versiyasını yoxla
var indesignVersion = parseFloat(app.version);
var isVersion19 = (indesignVersion >= 14 && indesignVersion < 15); // 19.x
var isVersion20 = (indesignVersion >= 15); // 20.x

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nVersiya: " + app.version);
    exit();
}

var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;

function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

log("InDesign versiyası: " + app.version + (isVersion19 ? " (19.x rejimi)" : isVersion20 ? " (20.x rejimi)" : ""));

// GUI
var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.1");
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

var tabPanel = win.add("tabbedpanel");
tabPanel.preferredSize = [500, 400];

// TAB 1: ƏSAS
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 10;

var grpFolder = tab1.add("panel", undefined, "Qovluq");
grpFolder.orientation = "column";
grpFolder.margins = 10;
grpFolder.add("statictext", undefined, "Ana qovluq:");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [450, 30];
var btnBrowse = grpFolder.add("button", undefined, "📁 Seç");

var grpLayout = tab1.add("panel", undefined, "Layout");
grpLayout.orientation = "column";
grpLayout.margins = 10;

var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Sütun:");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1;

var grpImg = grpLayout.add("group");
grpImg.add("statictext", undefined, "Şəkil %:");
var sliderImg = grpImg.add("slider", undefined, 40, 20, 60);
var txtImg = grpImg.add("statictext", undefined, "40%");
sliderImg.onChanging = function() { txtImg.text = Math.round(this.value) + "%"; };

var grpPad = grpLayout.add("group");
grpPad.add("statictext", undefined, "Boşluq:");
var ddlPad = grpPad.add("dropdownlist", undefined, ["0", "3", "5", "8"]);
ddlPad.selection = 2;

var grpPages = tab1.add("panel", undefined, "Səhifələr");
grpPages.orientation = "row";
grpPages.margins = 10;
var chkPages = [];
for (var p = 2; p <= 8; p++) {
    var chk = grpPages.add("checkbox", undefined, "S" + p);
    chk.value = true;
    chkPages.push(chk);
}

// TAB 2: FONT
var tab2 = tabPanel.add("tab", undefined, "Font");
tab2.orientation = "column";
tab2.alignChildren = ["fill", "top"];
tab2.spacing = 10;

var grpTitle = tab2.add("panel", undefined, "Başlıq");
grpTitle.orientation = "column";
grpTitle.margins = 10;
var grpTS = grpTitle.add("group");
grpTS.add("statictext", undefined, "Ölçü:");
var ddlTitleSize = grpTS.add("dropdownlist", undefined, ["12", "14", "16", "18"]);
ddlTitleSize.selection = 2;
var chkBold = grpTitle.add("checkbox", undefined, "Qalın");
chkBold.value = true;

var grpBody = tab2.add("panel", undefined, "Mətn");
grpBody.orientation = "column";
grpBody.margins = 10;
var grpBS = grpBody.add("group");
grpBS.add("statictext", undefined, "Ölçü:");
var ddlBodySize = grpBS.add("dropdownlist", undefined, ["8", "9", "10", "11"]);
ddlBodySize.selection = 2;

// TAB 3: ŞƏKIL
var tab3 = tabPanel.add("tab", undefined, "Şəkil");
tab3.orientation = "column";
tab3.alignChildren = ["fill", "top"];
tab3.spacing = 10;

var grpImg2 = tab3.add("panel", undefined, "Şəkil Ayarları");
grpImg2.orientation = "column";
grpImg2.margins = 10;
var chkBorder = grpImg2.add("checkbox", undefined, "Sərhəd əlavə et");
chkBorder.value = true;

// TAB 4: ƏLAVƏ
var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column";
tab4.alignChildren = ["fill", "top"];
tab4.spacing = 10;

var grpExtra = tab4.add("panel", undefined, "Əlavə");
grpExtra.orientation = "column";
grpExtra.margins = 10;
var chkClear = grpExtra.add("checkbox", undefined, "Mövcud elementi sil");
var chkLayer = grpExtra.add("checkbox", undefined, "Layer yarat");

// DÜYMƏLƏR
var grpBtn = win.add("group");
var btnTest = grpBtn.add("button", undefined, "🔍 Test");
var btnRun = grpBtn.add("button", undefined, "✅ Yerləşdir");
var btnCancel = grpBtn.add("button", undefined, "❌ Bağla", {name: "cancel"});

var txtProgress = win.add("statictext", undefined, "Hazır... Versiya: " + app.version);
txtProgress.preferredSize = [480, 25];

// HELPER FUNKSIYALAR
function readFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        var c = file.read();
        file.close();
        if (c.charCodeAt(0) === 0xFEFF) c = c.slice(1);
        return c;
    } catch(e) {
        log("Oxuma xətası: " + e);
        return "";
    }
}

function getFiles(folder, regex) {
    var all = folder.getFiles();
    var res = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i] instanceof File && regex.test(all[i].name)) {
            res.push(all[i]);
        }
    }
    res.sort(function(a, b) {
        var na = parseInt(a.name.match(/^\d+/)) || 0;
        var nb = parseInt(b.name.match(/^\d+/)) || 0;
        return na - nb;
    });
    return res;
}

function findImgs(folder, num) {
    var pattern = new RegExp("^" + num + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    var all = folder.getFiles();
    var res = [];
    for (var i = 0; i < all.length; i++) {
        if (all[i] instanceof File && pattern.test(all[i].name)) {
            res.push(all[i]);
        }
    }
    res.sort(function(a, b) {
        var ma = a.name.match(/-(\d+)\./);
        var mb = b.name.match(/-(\d+)\./);
        return (ma ? parseInt(ma[1]) : 0) - (mb ? parseInt(mb[1]) : 0);
    });
    return res;
}

// EVENTS
btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluq");
    if (folder) etFolder.text = folder.fsName;
};

btnTest.onClick = function() {
    debugLog = [];
    log("TEST - InDesign " + app.version);
    
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
    alert("Test: " + total + " fayl\n\nVersiya: " + app.version);
};

btnRun.onClick = function() {
    debugLog = [];
    totalPlaced = 0;
    totalErrors = 0;
    
    try {
        log("BAŞLADI - InDesign " + app.version);
        
        var root = etFolder.text;
        if (!root) { alert("Qovluq seçin!"); return; }
        
        var rootFolder = new Folder(root);
        if (!rootFolder.exists) { alert("Qovluq yoxdur!"); return; }
        
        var cols = parseInt(ddlColumns.selection.text) || 2;
        var imgRatio = Math.round(sliderImg.value) / 100;
        var padding = parseInt(ddlPad.selection.text) || 5;
        var titleSize = parseInt(ddlTitleSize.selection.text) || 16;
        var bodySize = parseInt(ddlBodySize.selection.text) || 10;
        
        log("Parametrlər: " + cols + " sütun, " + Math.round(imgRatio*100) + "% img, " + padding + "pt pad");
        
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            if (!chkPages[pageIndex - 1].value) continue;
            
            var pageNum = pageIndex + 1;
            var pf = new Folder(rootFolder + "/page" + pageNum);
            
            log("\nSƏHİFƏ " + pageNum);
            
            if (!pf.exists) {
                log("Qovluq yoxdur");
                continue;
            }
            
            var page = doc.pages[pageIndex];
            
            if (chkClear.value) {
                var items = page.allPageItems;
                for (var it = items.length - 1; it >= 0; it--) {
                    try { items[it].remove(); } catch(e) {}
                }
            }
            
            if (chkLayer.value) {
                try {
                    var ln = "Səhifə " + pageNum;
                    var layer = doc.layers.item(ln);
                    if (!layer.isValid) layer = doc.layers.add({name: ln});
                    doc.activeLayer = layer;
                } catch(e) {}
            }
            
            var txtFiles = getFiles(pf, /\.txt$/i);
            log("Fayl sayı: " + txtFiles.length);
            
            if (txtFiles.length === 0) continue;
            
            var bounds = page.bounds;
            var margin = page.marginPreferences;
            
            var usableW = bounds[3] - bounds[1] - (margin.left || 42.5) - (margin.right || 42.5);
            var usableH = bounds[2] - bounds[0] - (margin.top || 42.5) - (margin.bottom || 42.5);
            var startX = bounds[1] + (margin.left || 42.5);
            var startY = bounds[0] + (margin.top || 42.5);
            
            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;
            
            log("Grid: " + cellW.toFixed(1) + " x " + cellH.toFixed(1));
            
            txtProgress.text = "Səhifə " + pageNum + "...";
            // win.update(); - InDesign 19.0-da modal dialog yaradır, silirik
            
            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;
                
                log("\n  ➤ " + txtFiles[i].name);
                
                var content = readFile(txtFiles[i]);
                log("    Mətn: " + (content ? content.length : 0) + " simvol");
                
                if (!content || content.length === 0) {
                    log("    Boşdur!");
                    continue;
                }
                
                var lines = content.split(/\r?\n/);
                var clean = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var tr = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (tr !== "") clean.push(lines[ln]);
                }
                
                log("    Sətirlər: " + lines.length + " → " + clean.length);
                
                if (clean.length === 0) {
                    log("    Təmiz sətir yoxdur!");
                    continue;
                }
                
                var title = clean[0] || "";
                var bodyArr = [];
                for (var b = 1; b < clean.length; b++) bodyArr.push(clean[b]);
                var body = bodyArr.join("\r");
                
                log("    Başlıq: '" + title.substring(0, 30) + "'");
                log("    Mətn: " + body.length + " simvol");
                
                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgs = findImgs(pf, groupNum);
                log("    Şəkil: " + imgs.length);
                
                var curY = y;
                
                // ŞƏKİLLƏR
                if (imgs.length > 0) {
                    var imgH = cellH * imgRatio;
                    var imgCols = Math.min(imgs.length, 2);
                    var imgW = (cellW - padding * 2) / imgCols;
                    
                    for (var j = 0; j < imgs.length && j < 4; j++) {
                        var ic = j % imgCols;
                        var ir = Math.floor(j / imgCols);
                        var ix = x + padding + (ic * imgW);
                        var iy = curY + padding + (ir * (imgH / 2));
                        
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [iy, ix, iy + (imgH/2) - padding, ix + imgW - padding];
                            
                            log("      Şəkil bounds: [" + rect.geometricBounds.join(",") + "]");
                            
                            rect.place(imgs[j]);
                            
                            // Fit - InDesign 19.0 uyğun
                            try {
                                rect.fit(FitOptions.FILL_PROPORTIONALLY);
                            } catch(fe) {
                                log("      Fit xətası: " + fe);
                            }
                            
                            if (chkBorder.value) {
                                rect.strokeWeight = 1;
                                try {
                                    rect.strokeColor = doc.swatches.item("Black");
                                } catch(e) {
                                    rect.strokeColor = doc.swatches[0];
                                }
                            }
                            
                            log("      ✓ Şəkil OK");
                            totalPlaced++;
                        } catch(e) {
                            log("      ✗ Şəkil xətası: " + e);
                            totalErrors++;
                        }
                    }
                    curY += imgH + padding;
                }
                
                // BAŞLIQ
                var titleTr = title.replace(/^\s+|\s+$/g, '');
                if (titleTr !== "" && titleTr.length > 0) {
                    log("    → Başlıq yerləşdirilir");
                    try {
                        var tf = page.textFrames.add();
                        var titleBounds = [curY, x + padding, curY + titleSize + 12, x + cellW - padding];
                        
                        log("      Bounds: [" + titleBounds.join(",") + "]");
                        
                        tf.geometricBounds = titleBounds;
                        tf.contents = title;
                        
                        log("      Məzmun OK: " + tf.contents.length);
                        
                        // Font
                        try {
                            tf.parentStory.characters.everyItem().pointSize = titleSize;
                            
                            if (chkBold.value) {
                                try {
                                    var bf = app.fonts.item("Arial\tBold");
                                    if (!bf.isValid) bf = app.fonts.item("Arial-Bold");
                                    if (bf.isValid) {
                                        tf.parentStory.characters.everyItem().appliedFont = bf;
                                    } else {
                                        tf.parentStory.characters.everyItem().fontStyle = "Bold";
                                    }
                                } catch(fontErr) {
                                    log("      Font xətası: " + fontErr);
                                }
                            }
                        } catch(styleErr) {
                            log("      Stil xətası: " + styleErr);
                        }
                        
                        curY += titleSize + 14;
                        log("      ✓ Başlıq OK");
                        totalPlaced++;
                    } catch(e) {
                        log("      ✗ BAŞLIQ XƏTASI: " + e + " (sətir: " + (e.line || "?") + ")");
                        totalErrors++;
                    }
                } else {
                    log("    Başlıq boşdur");
                }
                
                // MƏTN
                var bodyTr = body.replace(/^\s+|\s+$/g, '');
                if (bodyTr !== "" && bodyTr.length > 0) {
                    log("    → Mətn yerləşdirilir");
                    try {
                        var bf = page.textFrames.add();
                        var bodyBounds = [curY, x + padding, y + cellH - padding, x + cellW - padding];
                        
                        log("      Bounds: [" + bodyBounds.join(",") + "]");
                        
                        bf.geometricBounds = bodyBounds;
                        bf.contents = body;
                        
                        log("      Məzmun OK: " + bf.contents.length);
                        
                        try {
                            bf.parentStory.characters.everyItem().pointSize = bodySize;
                        } catch(styleErr) {
                            log("      Stil xətası: " + styleErr);
                        }
                        
                        log("      ✓ Mətn OK");
                        totalPlaced++;
                    } catch(e) {
                        log("      ✗ MƏTN XƏTASI: " + e + " (sətir: " + (e.line || "?") + ")");
                        totalErrors++;
                    }
                } else {
                    log("    Mətn boşdur");
                }
            }
        }
        
        log("\nTAMAM: " + totalPlaced + " element, " + totalErrors + " xəta");
        txtProgress.text = "✅ " + totalPlaced + " / " + totalErrors;
        alert("✅ " + totalPlaced + " element\n❌ " + totalErrors + " xəta\n\nVersiya: " + app.version);
        win.close();
        
    } catch(e) {
        log("KRİTİK XƏTA: " + e + " (sətir: " + (e.line || "?") + ")");
        alert("❌ XƏTA: " + e + "\n\nSətir: " + (e.line || "?") + "\n\nVersiya: " + app.version);
    }
};

win.center();
win.show();