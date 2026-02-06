#target "indesign"
#targetengine "session"

// === GLOBAL CONFIG ===
function getIndex(arr, value) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] === value) {
            return i;
        }
    }
    return -1; // Tapılmadıqda
}

var pageConfigs = [];
for (var i = 0; i < 8; i++) {
    pageConfigs[i] = {
        textFrames: 2,
        imageFrames: 1,
        titleFrames: 1,
        // GRID sütunları ləğv edildi, lakin məlumat saxlanılır
        kolontitulHeight: 20, 
        isSpecial: (i === 0 || i === 7),
        titleFont: "Arial Bold",
        textFont: "Arial",
        titleColor: "Black",
        textColor: "Black",
        textFile: null,
        imageFiles: [],
        // YENİ: Fərdi ölçülər array-ləri
        customTextDims: [], 
        customImageDims: [] 
    };
    // Default ölçülər
    pageConfigs[i].customTextDims.push({w: 120, h: 200});
    pageConfigs[i].customTextDims.push({w: 180, h: 200});
    pageConfigs[i].customImageDims.push({w: 150, h: 150});
}

// === GUI YARAT ===
var win = new Window("palette", "A3 Qəzet Fərdi Çərçivə Planlaşdırıcısı", undefined, {resizeable: true});
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

// Çərçivə sayı girişləri
function addParam(parent, label, defaultValue) {
    var grp = parent.add("group");
    grp.orientation = "row";
    grp.add("statictext", undefined, label).preferredSize.width = 150;
    var et = grp.add("edittext", undefined, defaultValue);
    et.characters = 3;
    return et;
}

var txtText = addParam(params, "Mətn çərçivə sayı:", "2");
var txtImage = addParam(params, "Şəkil çərçivə sayı:", "1");
var txtTitle = addParam(params, "Başlıq sayı:", "1");
var txtKolon = addParam(params, "Kolontitul hünd. (mm):", "20"); 

// DİNAMİK SAHƏ ÜÇÜN PANEL
var dimPanel = sidebar.add("panel", undefined, "Fərdi Çərçivə Ölçüləri (Pt)");
dimPanel.orientation = "column";
dimPanel.alignChildren = "fill";
var textDimGroup = dimPanel.add("group");
textDimGroup.orientation = "column";
var imageDimGroup = dimPanel.add("group");
imageDimGroup.orientation = "column";

// --- Dinamik GUI Funksiyası ---
function updateDimGUI(type, count, dimGroup, configArray) {
    dimGroup.children.length = 0; // Əvvəlki elementləri təmizlə
    var currentConfig = configArray[pageSelector.selection.index];
    var currentDims = (type === 'text') ? currentConfig.customTextDims : currentConfig.customImageDims;
    
    // Konfiqurasiya array-ni yeni sayla sinxronlaşdır
    while (currentDims.length < count) {
        currentDims.push({w: 100, h: 100}); // Yeni default
    }
    while (currentDims.length > count) {
        currentDims.pop();
    }
    
    for (var i = 0; i < count; i++) {
        var grp = dimGroup.add("group");
        grp.add("statictext", undefined, (type === 'text' ? "Mətn " : "Şəkil ") + (i+1) + ":").preferredSize.width = 60;
        
        grp.add("statictext", undefined, "W:").preferredSize.width = 15;
        var wEt = grp.add("edittext", undefined, currentDims[i].w);
        wEt.characters = 6;
        wEt.tag = type + "_w_" + i;
        
        grp.add("statictext", undefined, "H:").preferredSize.width = 15;
        var hEt = grp.add("edittext", undefined, currentDims[i].h);
        hEt.characters = 6;
        hEt.tag = type + "_h_" + i;
    }
    win.layout.layout(true);
}

// --- DDL Grid ləğv edildi, Font və Rəng Qalır ---
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


// --- Event Handlers ---

// Çərçivə sayı dəyişdikdə dinamik GUI-ni yenilə
txtText.onChange = function() {
    updateDimGUI('text', parseInt(txtText.text) || 0, textDimGroup, pageConfigs);
};
txtImage.onChange = function() {
    updateDimGUI('image', parseInt(txtImage.text) || 0, imageDimGroup, pageConfigs);
};


pageSelector.onChange = function () {
    saveCurrentConfig(); // Köhnə səhifəni yadda saxla
    var idx = pageSelector.selection.index;
    var cfg = pageConfigs[idx];

    // Yeni səhifənin dəyərlərini yüklə
    txtText.text = cfg.textFrames;
    txtImage.text = cfg.imageFrames;
    txtTitle.text = cfg.titleFrames;
    txtKolon.text = cfg.kolontitulHeight;
    
    // Dinamik GUI-ni yenilə
    updateDimGUI('text', cfg.textFrames, textDimGroup, pageConfigs);
    updateDimGUI('image', cfg.imageFrames, imageDimGroup, pageConfigs);
    
    // Font/Rəng yenilənməsi
    ddlTitleFont.selection = getIndex(["Arial Bold", "Times New Roman Bold", "Helvetica Bold"], cfg.titleFont);
    ddlTextFont.selection = getIndex(["Arial", "Times New Roman", "Helvetica"], cfg.textFont);
    ddlTitleColor.selection = getIndex(["Black", "Red", "Blue", "Green"], cfg.titleColor);
    ddlTextColor.selection = getIndex(["Black", "Gray", "Dark Blue"], cfg.textColor);
};

// İlk dəfə yüklənmə üçün
pageSelector.onChange(); 


chkPage1.onClick = function () { pageConfigs[0].isSpecial = this.value; };
chkPage8.onClick = function () { pageConfigs[7].isSpecial = this.value; };

function saveCustomDims(dimGroup, type, config) {
    var dims = [];
    for (var i = 0; i < dimGroup.children.length; i++) {
        var grp = dimGroup.children[i];
        var w = parseFloat(grp.children[2].text) || 100;
        var h = parseFloat(grp.children[4].text) || 100;
        dims.push({w: w, h: h});
    }
    if (type === 'text') config.customTextDims = dims;
    else config.customImageDims = dims;
}

function saveCurrentConfig() {
    var idx = pageSelector.selection.index;
    
    // Ölçü sahələrindəki dəyərləri yaddaşa yaz
    var currentConfig = pageConfigs[idx];
    saveCustomDims(textDimGroup, 'text', currentConfig);
    saveCustomDims(imageDimGroup, 'image', currentConfig);

    // Əsas konfiqurasiyanı yadda saxla
    currentConfig.textFrames = parseInt(txtText.text) || 0;
    currentConfig.imageFrames = parseInt(txtImage.text) || 0;
    currentConfig.titleFrames = parseInt(txtTitle.text) || 0;
    currentConfig.kolontitulHeight = parseInt(txtKolon.text) || 10;
    currentConfig.isSpecial = (idx === 0 && chkPage1.value) || (idx === 7 && chkPage8.value);
    currentConfig.titleFont = ddlTitleFont.selection.text;
    currentConfig.textFont = ddlTextFont.selection.text;
    currentConfig.titleColor = ddlTitleColor.selection.text;
    currentConfig.textColor = ddlTextColor.selection.text;
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
    var maxPages = Math.min(doc.pages.length, pageConfigs.length); 
    for (var p = 0; p < maxPages; p++) {
        setupPage(doc.pages[p], pageConfigs[p], p + 1, doc);
    }
    alert("✅ Çərçivələr uğurla tətbiq olundu. (" + maxPages + " səhifə)");
}


// YENİ DÜYMƏ MƏNTİQLƏRİ:
btnCreateNew.onClick = function () {
    try {
        saveCurrentConfig();
        var doc = app.documents.add({
             pageWidth: "420mm", 
             pageHeight: "297mm", 
             facingPages: false,
             pagesPerDocument: 8 
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
            alert("❌ Aktiv sənəd yoxdur. Zəhmət olmasa bir sənəd açın.");
            return;
        }
        var doc = app.activeDocument;
        applyLayout(doc); 
    } catch (e) {
        alert("Mövcud Sənəd Xətası: " + e.toString());
    }
};

// === FRAME YERLƏŞDİRMƏ FUNKSİYALARI (Fərdi ölçülərlə yenilənib) ===

function setupPage(page, config, pageNum, doc) {
    var bounds = page.marginPreferences.properties; 
    
    // Kontent sahəsinin koordinatları (Pt vahidində)
    var contentTop = bounds.top;
    var contentLeft = bounds.left;
    var contentBottom = page.documentOffset + page.bounds[2] - bounds.bottom;
    var contentRight = page.bounds[3] - bounds.right;
    
    var currentX = contentLeft;
    var currentY = contentTop;
    var maxHeightInRow = 0; 
    var maxContentWidth = contentRight - contentLeft;

    var textDimIndex = 0;
    var imageDimIndex = 0;
    var frameIndex = 0;
    var textFilesIndex = 0; 

    // Başlıq Çərçivələri (avtomatik ölçü)
    for (var i = 0; i < config.titleFrames; i++) {
        // Təxmini Başlıq sahəsi: Kontent eni, 50pt hündürlük
        var w = maxContentWidth; 
        var h = 50; 
        
        // Yerləşdirməni cari nöqtədən edirik
        var finalBounds = [currentY, currentX, currentY + h, currentX + w];
        addFrame(page, finalBounds, "BAŞLIQ " + (i+1), "title", config, doc);
        
        // Növbəti element üçün Y-i tənzimlə
        currentY += h + 5; 
        frameIndex++;
    }
    
    // Mətn Çərçivələri
    for (var i = 0; i < config.textFrames; i++) {
        var dim = config.customTextDims[textDimIndex] || {w: 100, h: 100};
        var w = dim.w;
        var h = dim.h;
        
        // Əgər növbəti çərçivə kontent sahəsinin enindən çoxdursa, yeni sətrə keç
        if (currentX + w > contentRight) {
            currentX = contentLeft; // X-i sıfırla
            currentY += maxHeightInRow + 5; // Y-i növbəti sətrə endir (5pt boşluq)
            maxHeightInRow = 0; // Yeni sətrin max hündürlüyünü sıfırla
        }
        
        var content = "MƏTN SAHƏSİ " + (i+1);
        if (config.textFile && config.textFile.exists && textFilesIndex === 0) {
            content = config.textFile; 
            textFilesIndex++;
        }
        
        var finalBounds = [currentY, currentX, currentY + h, currentX + w];
        addFrame(page, finalBounds, content, "text", config, doc);
        
        // Cari sətrin maksimum hündürlüyünü təyin et
        maxHeightInRow = Math.max(maxHeightInRow, h); 
        currentX += w + 5; // Növbəti element üçün X-i tənzimlə (5pt boşluq)
        textDimIndex = (textDimIndex + 1) % config.customTextDims.length;
        frameIndex++;
    }

    // Şəkil Çərçivələri (Mətn çərçivələrindən sonra əlavə olunur, yeni sətrə keçir)
    if (config.imageFrames > 0) {
        currentX = contentLeft; // Yeni sətrə keçid üçün X-i sıfırla
        currentY += maxHeightInRow + 5; 
        maxHeightInRow = 0;
    }

    for (var i = 0; i < config.imageFrames; i++) {
        var dim = config.customImageDims[imageDimIndex] || {w: 100, h: 100};
        var w = dim.w;
        var h = dim.h;
        
        if (currentX + w > contentRight) {
            currentX = contentLeft;
            currentY += maxHeightInRow + 5; 
            maxHeightInRow = 0;
        }

        var imgFile = config.imageFiles[imageFilesIndex];
        var finalBounds = [currentY, currentX, currentY + h, currentX + w];
        addFrame(page, finalBounds, imgFile, "image", config, doc);
        
        maxHeightInRow = Math.max(maxHeightInRow, h);
        currentX += w + 5; 
        
        imageDimIndex = (imageDimIndex + 1) % config.customImageDims.length; 
        imageFilesIndex = (imageFilesIndex + 1) % (config.imageFiles.length > 0 ? config.imageFiles.length : 1); 
        frameIndex++;
    }
}

function addFrame(page, finalBounds, content, type, config, doc) {
    var y1 = finalBounds[0];
    var x1 = finalBounds[1];
    var y2 = finalBounds[2];
    var x2 = finalBounds[3];
    var tf;

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
        tf = page.textFrames.add();
        tf.geometricBounds = finalBounds;
        
        if (typeof content === 'string') {
             tf.contents = content;
        } else if (content instanceof File && content.exists) {
             tf.place(content);
        } else {
             tf.contents = "MƏTN SAHƏSİ";
        }

        // Təhlükəsiz font və rəng tətbiqi
        try {tf.parentStory.appliedFont = (type === "title") ? config.titleFont : config.textFont;} catch(e) {}
        tf.parentStory.pointSize = (type === "title") ? 18 : 11;
        tf.parentStory.justification = (type === "title") ? Justification.CENTER_ALIGN : Justification.LEFT_ALIGN;
        tf.fillColor = doc.swatches.itemByName("Paper");
        tf.parentStory.fillColor = (type === "title") ? ensureColor(doc, config.titleColor) : ensureColor(doc, config.textColor);
    }
}
win.show();