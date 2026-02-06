#target "indesign"
#targetengine "session"

// === GLOBAL CONFIG ===
// Konfiqurasiya hələ də 8 səhifə üçün saxlanılır, lakin tətbiq yalnız mövcud səhifələrə ediləcək.
var pageConfigs = [];
for (var i = 0; i < 8; i++) {
    pageConfigs[i] = {
        textFrames: 3,
        imageFrames: 2,
        titleFrames: 1,
        gridColumns: 3,
        // Kolontitul hündürlüyü artıq istifadə edilmir, lakin GUI-də qalır
        kolontitulHeight: 20, 
        isSpecial: (i === 0 || i === 7),
        titleFont: "Arial Bold",
        textFont: "Arial",
        titleColor: "Black",
        textColor: "Black",
        textFile: null,
        imageFiles: []
    };
}

// === GUI YARAT ===
var win = new Window("palette", "A3 Qəzet Çərçivə Planlaşdırıcısı", undefined, {resizeable: true});
win.orientation = "row";
win.alignChildren = "top";

// Sol panel
var sidebar = win.add("group");
sidebar.orientation = "column";
sidebar.alignChildren = "left";
sidebar.preferredSize.width = 300;

var pageSelector = sidebar.add("dropdownlist", undefined, ["Səhifə 1", "Səhifə 2", "Səhifə 3", "Səhifə 4", "Səhifə 5", "Səhifə 6", "Səhifə 7", "Səhifə 8"]);
pageSelector.selection = 0;

var specialGroup = sidebar.add("group");
specialGroup.orientation = "row";
var chkPage1 = specialGroup.add("checkbox", undefined, "Səhifə 1 xüsusi");
var chkPage8 = specialGroup.add("checkbox", undefined, "Səhifə 8 xüsusi");
chkPage1.value = true;
chkPage8.value = true;

var params = sidebar.add("group");
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
// txtKolon qalır, lakin istifadə edilməyəcək
var txtKolon = addParam(params, "Kolontitul hünd. (mm):", "20"); 

var gridLabel = params.add("statictext", undefined, "Grid sütunları:");
var ddlGrid = params.add("dropdownlist", undefined, ["2", "3", "4", "5"]);
ddlGrid.selection = 1;

// Font və rəng seçimi
var fontGroup = sidebar.add("panel", undefined, "Font və Rəng");
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

// Fayl seçimi
var fileGroup = sidebar.add("panel", undefined, "Fayl Seçimi");
fileGroup.orientation = "column";
fileGroup.alignChildren = "left";

var btnTextFile = fileGroup.add("button", undefined, "📄 Mətn Faylı Seç");
var btnImageFiles = fileGroup.add("button", undefined, "🖼️ Şəkil Faylları Seç");

btnTextFile.onClick = function () {
    var file = File.openDialog("Mətn faylı seç (.txt)", "*.txt");
    if (file) pageConfigs[pageSelector.selection.index].textFile = file;
};

btnImageFiles.onClick = function () {
    var files = File.openDialog("Şəkil faylları seç (.jpg/.png)", "*.jpg;*.png", true);
    if (files) pageConfigs[pageSelector.selection.index].imageFiles = files;
};

// YENİ: İki düymə üçün qrup
var btnGroup = sidebar.add("group");
btnGroup.orientation = "column";

var btnCreateNew = btnGroup.add("button", undefined, "✨ Yeni Sənəd Layoutu Yarat");
btnCreateNew.preferredSize.height = 30;

var btnApplyExisting = btnGroup.add("button", undefined, "🔄 Mövcud Sənədə Çərçivələri Tətbiq Et");
btnApplyExisting.preferredSize.height = 30;


// === GUI dəyişiklikləri yadda saxla ===
pageSelector.onChange = function () {
    saveCurrentConfig();
    var idx = pageSelector.selection.index;
    var cfg = pageConfigs[idx];
    txtText.text = cfg.textFrames;
    txtImage.text = cfg.imageFrames;
    txtTitle.text = cfg.titleFrames;
    txtKolon.text = cfg.kolontitulHeight;
    
    var gridIndex = cfg.gridColumns - 2;
    if (gridIndex >= 0 && gridIndex < ddlGrid.items.length) {
        ddlGrid.selection = gridIndex;
    } else {
        ddlGrid.selection = 1; 
    }
    
    ddlTitleFont.selection = ["Arial Bold", "Times New Roman Bold", "Helvetica Bold"].indexOf(cfg.titleFont);
    ddlTextFont.selection = ["Arial", "Times New Roman", "Helvetica"].indexOf(cfg.textFont);
    ddlTitleColor.selection = ["Black", "Red", "Blue", "Green"].indexOf(cfg.titleColor);
    ddlTextColor.selection = ["Black", "Gray", "Dark Blue"].indexOf(cfg.textColor);
};

chkPage1.onClick = function () { pageConfigs[0].isSpecial = this.value; };
chkPage8.onClick = function () { pageConfigs[7].isSpecial = this.value; };

function saveCurrentConfig() {
    var idx = pageSelector.selection.index;
    pageConfigs[idx] = {
        textFrames: parseInt(txtText.text) || 0,
        imageFrames: parseInt(txtImage.text) || 0,
        titleFrames: parseInt(txtTitle.text) || 0,
        kolontitulHeight: parseInt(txtKolon.text) || 10,
        gridColumns: parseInt(ddlGrid.selection.text) || 3,
        isSpecial: (idx === 0 && chkPage1.value) || (idx === 7 && chkPage8.value),
        titleFont: ddlTitleFont.selection.text,
        textFont: ddlTextFont.selection.text,
        titleColor: ddlTitleColor.selection.text,
        textColor: ddlTextColor.selection.text,
        textFile: pageConfigs[idx].textFile,
        imageFiles: pageConfigs[idx].imageFiles
    };
}

function ensureColor(doc, name) {
    try {
        return doc.colors.itemByName(name);
    } catch (e) {
        return doc.colors.add({name: name, model: ColorModel.PROCESS, colorValue: [0, 0, 0, 100]}); 
    }
}

// === ƏSAS LAYOUT TƏTBİQİ MƏNTİQİ ===
function applyLayout(doc) {
    var maxPages = Math.min(doc.pages.length, pageConfigs.length); // Mövcud səhifə sayı (və ya max 8)

    // Hər səhifə üçün layoutu qur
    for (var p = 0; p < maxPages; p++) {
        setupPage(doc.pages[p], pageConfigs[p], p + 1, doc);
    }
    
    alert("✅ Çərçivələr uğurla tətbiq olundu. (" + maxPages + " səhifə)");
}


// YENİ DÜYMƏ MƏNTİQLƏRİ:
btnCreateNew.onClick = function () {
    try {
        saveCurrentConfig();
        // Yeni sənəd yarat, A3 ölçüsü default qəzet ölçüsü kimi
        var doc = app.documents.add({
             pageWidth: "420mm", // A3
             pageHeight: "297mm", // A3
             facingPages: false,
             pagesPerDocument: 8 // 8 səhifəlik qəzet layoutu üçün
        });
        applyLayout(doc);
    } catch (e) {
        alert("Yeni Sənəd Xətası: " + e.toString());
    }
};

btnApplyExisting.onClick = function () {
    try {
        saveCurrentConfig();
        if (app.documents.length === 0) {
            alert("❌ Aktiv sənəd yoxdur. Zəhmət olmasa bir sənəd açın və ya 'Yeni Layout Yarat' düyməsindən istifadə edin.");
            return;
        }
        var doc = app.activeDocument;
        applyLayout(doc); // Aktiv sənədə tətbiq et
    } catch (e) {
        alert("Mövcud Sənəd Xətası: " + e.toString());
    }
};

// === FRAME YERLƏŞDİRMƏ FUNKSİYALARI ===

function setupPage(page, config, pageNum, doc) {
    // Səhifənin kənar boşluqlarını (margins) kontent sahəsi kimi istifadə edin
    // bounds[0]=Top, bounds[1]=Left, bounds[2]=Bottom, bounds[3]=Right
    var bounds = page.marginPreferences.properties; 
    
    // Kontent sahəsinin koordinatları (Pt vahidində)
    var contentTop = bounds.top;
    var contentBottom = page.documentOffset + page.bounds[2] - bounds.bottom; // page.bounds[2] səhifənin ümumi hündürlüyüdür
    var contentLeft = bounds.left;
    var contentRight = page.bounds[3] - bounds.right;
    
    var totalFrames = config.textFrames + config.imageFrames + config.titleFrames;
    if (totalFrames === 0) return;

    var cols = config.gridColumns;
    var rows = Math.ceil(totalFrames / cols);
    var cellW = (contentRight - contentLeft) / cols;
    var cellH = (contentBottom - contentTop) / rows;

    var frameIndex = 0;
    var textFilesIndex = 0; 
    var imageFilesIndex = 0; 

    // Başlıq Çərçivələri
    for (var i = 0; i < config.titleFrames; i++) {
        addFrame(page, contentTop, contentLeft, cellW, cellH, frameIndex, cols, "BAŞLIQ " + (i+1), "title", config, doc);
        frameIndex++;
    }

    // Mətn Çərçivələri
    for (var i = 0; i < config.textFrames; i++) {
        var content = "MƏTN SAHƏSİ " + (i+1);
        if (config.textFile && config.textFile.exists && textFilesIndex === 0) {
            content = config.textFile; 
            textFilesIndex++;
        }
        addFrame(page, contentTop, contentLeft, cellW, cellH, frameIndex, cols, content, "text", config, doc);
        frameIndex++;
    }

    // Şəkil Çərçivələri
    for (var i = 0; i < config.imageFrames; i++) {
        var imgFile = config.imageFiles[imageFilesIndex];
        addFrame(page, contentTop, contentLeft, cellW, cellH, frameIndex, cols, imgFile, "image", config, doc);
        
        imageFilesIndex = (imageFilesIndex + 1) % (config.imageFiles.length > 0 ? config.imageFiles.length : 1); 
        frameIndex++;
    }
}

function addFrame(page, top, left, w, h, index, cols, content, type, config, doc) {
    var row = Math.floor(index / cols);
    var col = index % cols;
    var y1 = top + row * h;
    var x1 = left + col * w;
    var y2 = y1 + h;
    var x2 = x1 + w;
    var gutter = 5; // Çərçivələr arasında kiçik bir boşluq (5pt)

    // Çərçivə sahəsinə gutter-i tətbiq edin
    var finalBounds = [y1 + gutter, x1 + gutter, y2 - gutter, x2 - gutter];


    if (type === "image") {
        var rect = page.rectangles.add();
        rect.geometricBounds = finalBounds;
        rect.strokeWeight = 1;
        rect.strokeColor = doc.swatches.itemByName("Black");
        rect.fillColor = doc.swatches.itemByName("Paper");
        
        if (content && content.exists) {
            rect.place(content);
            rect.fit(FitOptions.PROPORTIONALLY); 
        }
    } else {
        var tf = page.textFrames.add();
        tf.geometricBounds = finalBounds;
        
        if (typeof content === 'string') {
             tf.contents = content;
        } else if (content instanceof File && content.exists) {
             tf.place(content);
        } else {
             tf.contents = "MƏTN SAHƏSİ";
        }

        try {tf.parentStory.appliedFont = (type === "title") ? config.titleFont : config.textFont;} catch(e) {}
        tf.parentStory.pointSize = (type === "title") ? 18 : 11;
        tf.parentStory.justification = (type === "title") ? Justification.CENTER_ALIGN : Justification.LEFT_ALIGN;
        tf.fillColor = doc.swatches.itemByName("Paper");
        tf.parentStory.fillColor = (type === "title") ? ensureColor(doc, config.titleColor) : ensureColor(doc, config.textColor);
    }
}
win.show();