#targetengine "session"

// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v3.1 — STİL PAKETİ İLƏ
//  InDesign 19.0+ / 20.0+ uyğun
// ═══════════════════════════════════════════════════════════

if (parseFloat(app.version) < 14.0) {
    alert("Bu skript InDesign 19.0+ üçün nəzərdə tutulub!\nHal-hazırki versiya: " + app.version);
    exit();
}

if (!app.documents.length) { alert("Sənəd açın!"); exit(); }
var doc = app.activeDocument;

var debugLog = [], totalPlaced = 0, totalErrors = 0;
function log(m) { debugLog.push(m); $.writeln(m); }

log("InDesign versiyası: " + app.version);

// ═══════════════════════════════════════════════════════════
//  STİL İDARƏETMƏSİ
// ═══════════════════════════════════════════════════════════

function createParagraphStyle(name, baseStyle, settings) {
    var style = doc.paragraphStyles.item(name);
    if (!style.isValid) style = doc.paragraphStyles.add({ name: name });
    if (baseStyle) style.basedOn = baseStyle;
    for (var key in settings) {
        try {
            style[key] = settings[key];
        } catch(e) {}
    }
    return style;
}

function createCharacterStyle(name, settings) {
    var style = doc.characterStyles.item(name);
    if (!style.isValid) style = doc.characterStyles.add({ name: name });
    for (var key in settings) {
        try {
            style[key] = settings[key];
        } catch(e) {}
    }
    return style;
}

function createObjectStyle(name, settings) {
    var style = doc.objectStyles.item(name);
    if (!style.isValid) style = doc.objectStyles.add({ name: name });
    for (var key in settings) {
        try {
            style[key] = settings[key];
        } catch(e) {}
    }
    return style;
}

var baseTextStyle, titleStyle, subtitleStyle, emphasisStyle, imageObjectStyle;

function setupStyles() {
    log("Stil iyerarxiyası qurulur...");

    baseTextStyle = createParagraphStyle("Qəzet_Əsas_Mətn", null, {
        pointSize: 10,
        leading: 12,
        justification: Justification.LEFT_ALIGN
    });

    titleStyle = createParagraphStyle("Qəzet_Başlıq", baseTextStyle, {
        pointSize: 16,
        fontStyle: "Bold",
        spaceAfter: 6
    });

    subtitleStyle = createParagraphStyle("Qəzet_Altbaşlıq", baseTextStyle, {
        pointSize: 12,
        fontStyle: "Italic",
        spaceAfter: 4
    });

    emphasisStyle = createCharacterStyle("Qəzet_Vurğu", {
        fontStyle: "Bold"
    });

    imageObjectStyle = createObjectStyle("Qəzet_Şəkil", {
        strokeWeight: 0.5
    });

    log("Stil iyerarxiyası tamamlandı.");
}

function exportStylePack() {
    var pack = {
        version: "3.1",
        baseSize: baseTextStyle.pointSize,
        baseLeading: baseTextStyle.leading,
        titleSize: titleStyle.pointSize,
        titleSpaceAfter: titleStyle.spaceAfter,
        subtitleSize: subtitleStyle.pointSize,
        imageBorder: imageObjectStyle.strokeWeight
    };

    var file = File.saveDialog("Stil paketini saxla", "JSON:*.json");
    if (!file) return;
    if (!file.name.match(/\.json$/i)) file = new File(file.fsName + ".json");

    try {
        file.encoding = "UTF-8";
        file.open("w");
        file.write(JSON.stringify(pack, null, 2));
        file.close();
        log("Stil paketi saxlandı: " + file.fsName);
        alert("✅ Stil paketi saxlandı!\n" + file.fsName);
    } catch (e) {
        alert("❌ Xəta: " + e);
    }
}

function importStylePack() {
    var file = File.openDialog("Stil paketi seçin", "JSON:*.json");
    if (!file) return;

    try {
        file.encoding = "UTF-8";
        file.open("r");
        var data = JSON.parse(file.read());
        file.close();

        baseTextStyle.pointSize = data.baseSize || 10;
        baseTextStyle.leading = data.baseLeading || 12;
        titleStyle.pointSize = data.titleSize || 16;
        titleStyle.spaceAfter = data.titleSpaceAfter || 6;
        subtitleStyle.pointSize = data.subtitleSize || 12;
        imageObjectStyle.strokeWeight = data.imageBorder || 0.5;

        log("Stil paketi yükləndi: " + file.fsName);
        alert("✅ Stil paketi yükləndi!\n" + file.fsName);
        updateGUIFromStyles();
    } catch (e) {
        alert("❌ Xəta: " + e);
    }
}

// ═══════════════════════════════════════════════════════════
//  GUI
// ═══════════════════════════════════════════════════════════

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v3.1");
win.orientation = "column"; win.spacing = 10; win.margins = 20;

var tabPanel = win.add("tabbedpanel");
tabPanel.preferredSize = [520, 420];

// TAB 1: ƏSAS
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column"; tab1.spacing = 10;

var grpFolder = tab1.add("panel", undefined, "Qovluq");
grpFolder.margins = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2, page3... olan):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [470, 30];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç");
btnBrowse.preferredSize.height = 35;

var grpLayout = tab1.add("panel", undefined, "Layout");
grpLayout.margins = 10;
var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Sütun:");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1;

var grpImg = grpLayout.add("group");
grpImg.add("statictext", undefined, "Şəkil sahəsi %:");
var sliderImg = grpImg.add("slider", undefined, 40, 20, 60);
sliderImg.preferredSize.width = 200;
var txtImg = grpImg.add("statictext", undefined, "40%");
txtImg.preferredSize.width = 50;

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

// TAB 2: TİPOQRAFİYA
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column"; tab2.spacing = 15;

var grpBaseSize = tab2.add("group");
grpBaseSize.add("statictext", undefined, "Əsas Mətn Ölçüsü:");
var ddlBaseSize = grpBaseSize.add("dropdownlist", undefined, ["8", "9", "10", "11", "12"]);
ddlBaseSize.selection = 2;

var grpTitleSize = tab2.add("group");
grpTitleSize.add("statictext", undefined, "Başlıq Ölçüsü:");
var ddlTitleSize = grpTitleSize.add("dropdownlist", undefined, ["14", "16", "18", "20", "24"]);
ddlTitleSize.selection = 1;

var chkBold = tab2.add("checkbox", undefined, "Başlıqlar qalın");
chkBold.value = true;

// TAB 3: ŞƏKİL
var tab3 = tabPanel.add("tab", undefined, "Şəkil");
tab3.orientation = "column"; tab3.spacing = 15;

var chkBorder = tab3.add("checkbox", undefined, "Şəkillərə sərhəd");
chkBorder.value = true;

var grpBorderW = tab3.add("group");
grpBorderW.add("statictext", undefined, "Sərhəd qalınlığı:");
var ddlBorderW = grpBorderW.add("dropdownlist", undefined, ["0.5", "1", "1.5", "2"]);
ddlBorderW.selection = 1;

// TAB 4: STİL PAKETİ
var tab4 = tabPanel.add("tab", undefined, "Stil Paketi");
tab4.orientation = "column"; tab4.alignChildren = "center"; tab4.spacing = 30;
tab4.margins = 40;

tab4.add("statictext", undefined, "Stil ayarlarını saxlayıb yükləyin").graphics.font = ScriptUI.newFont("dialog", "Bold", 12);

var btnExport = tab4.add("button", undefined, "💾 Stil Paketi Saxla");
btnExport.preferredSize = [250, 50];

var btnImport = tab4.add("button", undefined, "📂 Stil Paketi Yüklə");
btnImport.preferredSize = [250, 50];

// TAB 5: ƏLAVƏ
var tab5 = tabPanel.add("tab", undefined, "Əlavə");
tab5.orientation = "column"; tab5.spacing = 10;

var grpExtra = tab5.add("panel", undefined, "Əlavə Seçimlər");
grpExtra.margins = 10;
var chkClear = grpExtra.add("checkbox", undefined, "Mövcud elementləri sil");
var chkLayer = grpExtra.add("checkbox", undefined, "Hər səhifə üçün layer yarat");

// ƏSAS DÜYMƏLƏR
var grpButtons = win.add("group");
grpButtons.alignment = "center"; grpButtons.spacing = 15;

var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [120, 40];

var btnRun = grpButtons.add("button", undefined, "✅ Yerləşdir");
btnRun.preferredSize = [150, 40];

var btnCancel = grpButtons.add("button", undefined, "❌ Bağla", {name: "cancel"});
btnCancel.preferredSize = [120, 40];

var txtProgress = win.add("statictext", undefined, "Hazır... Versiya: " + app.version);
txtProgress.preferredSize = [500, 25];

// ═══════════════════════════════════════════════════════════
//  HELPER FUNKSIYALAR
// ═══════════════════════════════════════════════════════════

function readFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        var c = file.read();
        file.close();
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

function updateGUIFromStyles() {
    if (!baseTextStyle || !baseTextStyle.isValid) return;
    ddlBaseSize.selection = ddlBaseSize.find(baseTextStyle.pointSize.toString()) || 2;
    ddlTitleSize.selection = ddlTitleSize.find(titleStyle.pointSize.toString()) || 1;
    ddlBorderW.selection = ddlBorderW.find(imageObjectStyle.strokeWeight.toString()) || 1;
}

// ═══════════════════════════════════════════════════════════
//  EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

sliderImg.onChanging = function() { txtImg.text = Math.round(this.value) + "%"; };

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluq");
    if (folder) {
        etFolder.text = folder.fsName;
        txtProgress.text = "Qovluq: " + folder.name;
    }
};

btnExport.onClick = function() { exportStylePack(); };
btnImport.onClick = function() { importStylePack(); };

btnTest.onClick = function() {
    debugLog = [];
    log("TEST - InDesign " + app.version);
    
    var root = etFolder.text;
    if (!root) { alert("Qovluq seçin!"); return; }
    
    var rootFolder = new Folder(root);
    if (!rootFolder.exists) { alert("Qovluq yoxdur!"); return; }
    
    var totalTxt = 0, totalImg = 0;
    for (var p = 2; p <= 8; p++) {
        var pf = new Folder(rootFolder + "/page" + p);
        if (pf.exists) {
            var txt = getFiles(pf, /\.txt$/i).length;
            var img = getFiles(pf, /\.(jpe?g|png|tiff?)$/i).length;
            log("Səh " + p + ": " + txt + " txt, " + img + " img");
            totalTxt += txt;
            totalImg += img;
        }
    }
    alert("✅ Test:\n\n" + totalTxt + " mətn fayl\n" + totalImg + " şəkil fayl");
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
        
        // Parametrləri yenilə
        baseTextStyle.pointSize = parseInt(ddlBaseSize.selection.text) || 10;
        baseTextStyle.leading = baseTextStyle.pointSize * 1.2;
        titleStyle.pointSize = parseInt(ddlTitleSize.selection.text) || 16;
        imageObjectStyle.strokeWeight = parseFloat(ddlBorderW.selection.text) || 1;
        
        var cols = parseInt(ddlColumns.selection.text) || 2;
        var imgRatio = Math.round(sliderImg.value) / 100;
        var padding = parseInt(ddlPad.selection.text) || 5;
        
        log("Parametrlər: " + cols + " sütun, " + Math.round(imgRatio*100) + "% img");
        
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
            log("Fayl: " + txtFiles.length);
            
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
            
            txtProgress.text = "Səhifə " + pageNum + " işlənir...";
            
            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;
                
                log("  " + txtFiles[i].name);
                
                var content = readFile(txtFiles[i]);
                if (!content || content.length === 0) continue;
                
                var lines = content.split(/\r?\n/);
                var clean = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var tr = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (tr !== "") clean.push(lines[ln]);
                }
                
                if (clean.length === 0) continue;
                
                var title = clean[0] || "";
                var bodyArr = [];
                for (var b = 1; b < clean.length; b++) bodyArr.push(clean[b]);
                var body = bodyArr.join("\r");
                
                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgs = findImgs(pf, groupNum);
                
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
                            rect.place(imgs[j]);
                            
                            try { rect.fit(FitOptions.FILL_PROPORTIONALLY); } catch(fe) {}
                            
                            // Stil tətbiq et
                            try { rect.appliedObjectStyle = imageObjectStyle; } catch(e) {}
                            
                            if (chkBorder.value) {
                                rect.strokeWeight = imageObjectStyle.strokeWeight;
                                try {
                                    rect.strokeColor = doc.swatches.item("Black");
                                } catch(e) {
                                    rect.strokeColor = doc.swatches[0];
                                }
                            } else {
                                rect.strokeWeight = 0;
                            }
                            
                            totalPlaced++;
                        } catch(e) {
                            totalErrors++;
                        }
                    }
                    curY += imgH + padding;
                }
                
                // BAŞLIQ
                var titleTr = title.replace(/^\s+|\s+$/g, '');
                if (titleTr !== "" && titleTr.length > 0) {
                    try {
                        var tf = page.textFrames.add();
                        tf.geometricBounds = [curY, x + padding, curY + titleStyle.pointSize + 12, x + cellW - padding];
                        tf.contents = title;
                        
                        // Stil tətbiq et
                        try {
                            tf.parentStory.paragraphs[0].appliedParagraphStyle = titleStyle;
                        } catch(styleErr) {
                            tf.parentStory.characters.everyItem().pointSize = titleStyle.pointSize;
                            if (chkBold.value) {
                                try {
                                    var bf = app.fonts.item("Arial\tBold");
                                    if (!bf.isValid) bf = app.fonts.item("Arial-Bold");
                                    if (bf.isValid) tf.parentStory.characters.everyItem().appliedFont = bf;
                                } catch(e) {}
                            }
                        }
                        
                        curY += titleStyle.pointSize + 14;
                        totalPlaced++;
                    } catch(e) {
                        totalErrors++;
                    }
                }
                
                // MƏTN
                var bodyTr = body.replace(/^\s+|\s+$/g, '');
                if (bodyTr !== "" && bodyTr.length > 0) {
                    try {
                        var bf = page.textFrames.add();
                        bf.geometricBounds = [curY, x + padding, y + cellH - padding, x + cellW - padding];
                        bf.contents = body;
                        
                        // Stil tətbiq et
                        try {
                            bf.parentStory.paragraphs.everyItem().appliedParagraphStyle = baseTextStyle;
                        } catch(styleErr) {
                            bf.parentStory.characters.everyItem().pointSize = baseTextStyle.pointSize;
                        }
                        
                        totalPlaced++;
                    } catch(e) {
                        totalErrors++;
                    }
                }
            }
        }
        
        log("\nTAMAM: " + totalPlaced + " element, " + totalErrors + " xəta");
        txtProgress.text = "✅ Tamamlandı: " + totalPlaced + " / " + totalErrors;
        alert("✅ Tamamlandı!\n\n" + totalPlaced + " element yerləşdirildi\n" + totalErrors + " xəta\n\nVersiya: " + app.version);
        win.close();
        
    } catch(e) {
        log("KRİTİK: " + e);
        alert("❌ XƏTA: " + e);
    }
};

// ═══════════════════════════════════════════════════════════
//  BAŞLAT
// ═══════════════════════════════════════════════════════════

setupStyles();
win.center();
win.show();