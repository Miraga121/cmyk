#target "indesign"
#targetengine "session"

// === GLOBAL CONFIG ===
var pageConfigs = [];
for (var i = 0; i < 8; i++) {
    pageConfigs[i] = {
        textFrames: 3,
        imageFrames: 2,
        titleFrames: 1,
        gridColumns: 3,
        kolontitulHeight: 20, // Kolontitul hündürlüyü artıq istifadə edilmir, lakin GUI-də qalır
        isSpecial: (i === 0 || i === 7),
        titleFont: "Arial Bold",
        textFont: "Arial",
        titleColor: "Black",
        textColor: "Black",
        textFile: null,
        imageFiles: [],
        folderPath: "" // Yeni: Hər səhifə üçün qovluq yolu
    };
}

// === GUI YARAT ===
var win = new Window("dialog", "A3 Qəzet Çərçivə Planlaşdırıcısı v2.0");
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [500, 400];

// TAB 1: ƏSAS
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 15;

var pageSelector = tab1.add("dropdownlist", undefined, ["Səhifə 1", "Səhifə 2", "Səhifə 3", "Səhifə 4", "Səhifə 5", "Səhifə 6", "Səhifə 7", "Səhifə 8"]);
pageSelector.selection = 0;

var specialGroup = tab1.add("group");
specialGroup.orientation = "row";
var chkPage1 = specialGroup.add("checkbox", undefined, "Səhifə 1 xüsusi");
var chkPage8 = specialGroup.add("checkbox", undefined, "Səhifə 8 xüsusi");
chkPage1.value = true;
chkPage8.value = true;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 15;
grpFolder.spacing = 10;
grpFolder.add("statictext", undefined, "Səhifə qovluğu (məs: page1/):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [450, 30];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 35;

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Səhifə qovluğunu seçin");
    if (folder) {
        etFolder.text = folder.fsName;
        pageConfigs[pageSelector.selection.index].folderPath = folder.fsName;
    }
};

var params = tab1.add("group");
params.orientation = "column";
params.spacing = 10;

function addParam(parent, label, defaultValue) {
    var grp = parent.add("group");
    grp.orientation = "row";
    grp.add("statictext", undefined, label).preferredSize.width = 150;
    var et = grp.add("edittext", undefined, defaultValue);
    et.characters = 3;
    return et;
}

var txtText = addParam(params, "Mətn çərçivə sayı:", "3");
var txtImage = addParam(params, "Şəkil çərçivə sayı:", "2");
var txtTitle = addParam(params, "Başlıq sayı:", "1");
var txtKolon = addParam(params, "Kolontitul hünd. (mm):", "20");

var gridLabel = params.add("statictext", undefined, "Grid sütunları:");
var ddlGrid = params.add("dropdownlist", undefined, ["2", "3", "4", "5"]);
ddlGrid.selection = 1;

// TAB 2: TİPOQRAFİYA
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column";
tab2.alignChildren = ["fill", "top"];
tab2.spacing = 15;

var fontGroup = tab2.add("panel", undefined, "Font və Rəng");
fontGroup.orientation = "column";
fontGroup.alignChildren = "left";

var ddlTitleFont = fontGroup.add("dropdownlist", undefined, ["Arial Bold", "Times New Roman Bold", "Helvetica Bold"]);
ddlTitleFont.selection = 0;

var ddlTextFont = fontGroup.add("dropdownlist", undefined, ["Arial", "Times New Roman", "Helvetica"]);
ddlTextFont.selection = 0;

var ddlTitleColor = fontGroup.add("dropdownlist", undefined, ["Black", "Red", "Blue", "Green"]);
ddlTitleColor.selection = 0;

var ddlTextColor = fontGroup.add("dropdownlist", undefined, ["Black", "Gray", "Dark Blue"]);
ddlTextColor.selection = 0;

// TAB 3: ŞƏKİLLƏR (Sadə saxlanıldı)
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column";
tab3.alignChildren = ["fill", "top"];
tab3.spacing = 15;

var grpFitOptions = tab3.add("group");
grpFitOptions.add("statictext", undefined, "Yerləşdirmə:");
var ddlFitOptions = grpFitOptions.add("dropdownlist", undefined, ["Proporsional doldur", "Çərçivəyə sığdır", "Məzmunu sığdır"]);
ddlFitOptions.selection = 0;

var chkImageBorder = tab3.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et");
chkImageBorder.value = true;

// DÜYMƏLƏR
var grpButtons = win.add("group");
grpButtons.orientation = "row";
grpButtons.alignment = ["fill", "bottom"];
grpButtons.spacing = 10;

var btnCreateNew = grpButtons.add("button", undefined, "✨ Yeni Sənəd Layoutu Yarat");
var btnApplyAll = grpButtons.add("button", undefined, "🔄 Bütün Səhifələrə Tətbiq Et");
var btnApplySelected = grpButtons.add("button", undefined, "📄 Seçili Səhifəyə Tətbiq Et");
var btnCancel = grpButtons.add("button", undefined, "❌ Bağla");

var txtProgress = win.add("statictext", undefined, "Hazır...");

// === GUI DƏYİŞİKLİKLƏRİ YADDA SAXLA ===
pageSelector.onChange = function () {
    saveCurrentConfig();
    loadConfig(pageSelector.selection.index);
};

chkPage1.onClick = function () { pageConfigs[0].isSpecial = this.value; };
chkPage8.onClick = function () { pageConfigs[7].isSpecial = this.value; };

function saveCurrentConfig() {
    var idx = pageSelector.selection.index;
    pageConfigs[idx] = {
        textFrames: parseInt(txtText.text) || 3,
        imageFrames: parseInt(txtImage.text) || 2,
        titleFrames: parseInt(txtTitle.text) || 1,
        kolontitulHeight: parseInt(txtKolon.text) || 20,
        gridColumns: parseInt(ddlGrid.selection.text) || 3,
        isSpecial: (idx === 0 && chkPage1.value) || (idx === 7 && chkPage8.value),
        titleFont: ddlTitleFont.selection.text,
        textFont: ddlTextFont.selection.text,
        titleColor: ddlTitleColor.selection.text,
        textColor: ddlTextColor.selection.text,
        folderPath: etFolder.text
    };
}

function loadConfig(idx) {
    var cfg = pageConfigs[idx];
    txtText.text = cfg.textFrames;
    txtImage.text = cfg.imageFrames;
    txtTitle.text = cfg.titleFrames;
    txtKolon.text = cfg.kolontitulHeight;
    ddlGrid.selection = cfg.gridColumns - 2;
    ddlTitleFont.selection = ddlTitleFont.find(cfg.titleFont);
    ddlTextFont.selection = ddlTextFont.find(cfg.textFont);
    ddlTitleColor.selection = ddlTitleColor.find(cfg.titleColor);
    ddlTextColor.selection = ddlTextColor.find(cfg.textColor);
    etFolder.text = cfg.folderPath;
}

function ensureColor(doc, name, value) {
    var color = doc.colors.itemByName(name);
    if (!color.isValid) {
        color = doc.colors.add({name: name, model: ColorModel.PROCESS, space: ColorSpace.CMYK, colorValue: value || [0, 0, 0, 100]});
    }
    return color;
}

// === LAYOUT TƏTBİQİ ===
function applyLayout(doc, selectedPageIndex) {
    if (!checkA3Format(doc)) {
        if (!confirm("Sənəd A3 formatında deyil. Davam etmək istəyirsiniz?")) return;
    }

    var startPage = (selectedPageIndex !== undefined) ? selectedPageIndex : 0;
    var endPage = (selectedPageIndex !== undefined) ? selectedPageIndex + 1 : Math.min(doc.pages.length, pageConfigs.length);

    for (var p = startPage; p < endPage; p++) {
        var page = doc.pages[p];
        var config = pageConfigs[p];
        var pageFolder = new Folder(config.folderPath);
        if (pageFolder.exists) {
            config.textFile = getNumberedFiles(pageFolder, /\.txt$/i)[0] || null;
            config.imageFiles = getNumberedFiles(pageFolder, /\.(jpe?g|png)$/i);
        }
        setupPage(page, config, p + 1, doc);
    }
    
    txtProgress.text = "✅ Tətbiq olundu (" + (endPage - startPage) + " səhifə)";
    alert("✅ Çərçivələr tətbiq olundu.");
}

function checkA3Format(doc) {
    var page = doc.pages[0];
    var width = UnitValue(page.bounds[3] - page.bounds[1], "pt").as("mm");
    var height = UnitValue(page.bounds[2] - page.bounds[0], "pt").as("mm");
    // Portrait A3: 297mm x 420mm
    return (Math.round(width) === 297 && Math.round(height) === 420) ||
           (Math.round(width) === 420 && Math.round(height) === 297); // Landscape
}

// === DÜYMƏ MƏNTİQLƏRİ ===
btnCreateNew.onClick = function () {
    saveCurrentConfig();
    var doc = app.documents.add();
    doc.documentPreferences.pageWidth = "297mm"; // Portrait A3
    doc.documentPreferences.pageHeight = "420mm";
    doc.documentPreferences.facingPages = true;
    doc.documentPreferences.pagesPerDocument = 8;
    doc.viewPreferences.horizontalMeasurementUnits = MeasurementUnits.MILLIMETERS;
    doc.viewPreferences.verticalMeasurementUnits = MeasurementUnits.MILLIMETERS;
    applyLayout(doc);
};

btnApplyAll.onClick = function () {
    saveCurrentConfig();
    if (!app.documents.length) {
        alert("❌ Aktiv sənəd yoxdur.");
        return;
    }
    applyLayout(app.activeDocument);
};

btnApplySelected.onClick = function () {
    saveCurrentConfig();
    if (!app.documents.length) {
        alert("❌ Aktiv sənəd yoxdur.");
        return;
    }
    var idx = pageSelector.selection.index;
    if (idx >= app.activeDocument.pages.length) {
        alert("❌ Seçili səhifə mövcud deyil.");
        return;
    }
    applyLayout(app.activeDocument, idx);
};

// === FRAME YERLƏŞDİRMƏ ===
function setupPage(page, config, pageNum, doc) {
    var bounds = page.bounds; // [y1, x1, y2, x2] = [0, 0, height, width]
    var margin = page.marginPreferences;
    var contentTop = margin.top;
    var contentLeft = margin.left;
    var contentBottom = bounds[2] - margin.bottom;
    var contentRight = bounds[3] - margin.right;

    var totalFrames = config.textFrames + config.imageFrames + config.titleFrames;
    if (totalFrames === 0) return;

    var cols = config.gridColumns;
    var rows = Math.ceil(totalFrames / cols);
    var cellW = (contentRight - contentLeft) / cols;
    var cellH = (contentBottom - contentTop) / rows;

    var frameIndex = 0;
    var gutter = 5;

    // Başlıqlar
    for (var i = 0; i < config.titleFrames; i++) {
        addFrame(page, contentTop, contentLeft, cellW, cellH, frameIndex, cols, "BAŞLIQ " + (i+1), "title", config, doc, gutter);
        frameIndex++;
    }

    // Mətnlər
    for (var i = 0; i < config.textFrames; i++) {
        var content = config.textFile ? config.textFile : "MƏTN SAHƏSİ " + (i+1);
        addFrame(page, contentTop, contentLeft, cellW, cellH, frameIndex, cols, content, "text", config, doc, gutter);
        frameIndex++;
    }

    // Şəkillər
    for (var i = 0; i < config.imageFrames; i++) {
        var imgFile = config.imageFiles[i] || null;
        addFrame(page, contentTop, contentLeft, cellW, cellH, frameIndex, cols, imgFile, "image", config, doc, gutter);
        frameIndex++;
    }
}

function addFrame(page, top, left, w, h, index, cols, content, type, config, doc, gutter) {
    var row = Math.floor(index / cols);
    var col = index % cols;
    var y1 = top + row * h + gutter;
    var x1 = left + col * w + gutter;
    var y2 = y1 + h - 2 * gutter;
    var x2 = x1 + w - 2 * gutter;

    if (type === "image") {
        var rect = page.rectangles.add({geometricBounds: [y1, x1, y2, x2]});
        rect.strokeWeight = chkImageBorder.value ? 1 : 0;
        rect.strokeColor = doc.swatches.itemByName("Black");
        if (content && content.exists) {
            rect.place(content);
            var fitOption = [FitOptions.FILL_PROPORTIONALLY, FitOptions.FIT_CONTENT_TO_FRAME, FitOptions.FIT_FRAME_TO_CONTENT][ddlFitOptions.selection.index];
            rect.fit(fitOption);
        }
    } else {
        var tf = page.textFrames.add({geometricBounds: [y1, x1, y2, x2]});
        if (content instanceof File && content.exists) {
            tf.place(content);
        } else {
            tf.contents = content;
        }
        tf.parentStory.appliedFont = (type === "title") ? config.titleFont : config.textFont;
        tf.parentStory.pointSize = (type === "title") ? 18 : 11;
        tf.parentStory.justification = (type === "title") ? Justification.CENTER_ALIGN : Justification.LEFT_ALIGN;
        tf.parentStory.fillColor = ensureColor(doc, (type === "title") ? config.titleColor : config.textColor);
    }
}

function getNumberedFiles(folder, filterRegex) {
    var files = folder.getFiles(function(f) { return f instanceof File && filterRegex.test(f.name); });
    files.sort(function(a, b) {
        var numA = parseInt(a.name.match(/^\d+/)) || 0;
        var numB = parseInt(b.name.match(/^\d+/)) || 0;
        return numA - numB;
    });
    return files;
}

win.center();
win.show();