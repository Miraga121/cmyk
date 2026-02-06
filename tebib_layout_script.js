// InDesign Universal Layout Script - Bütün versiyalar üçün uyğun
// CS3, CS4, CS5, CS6, CC 2014+ dəstəyi

// Sənədin açıq olmasını yoxla
if (app.documents.length === 0) {
    alert("Zəhmət olmasa, açıq bir sənəd açın.");
    exit();
}

var doc = app.activeDocument;
var FRAME_CONFIG = [];

// InDesign versiyasını yoxla
var version = parseFloat(app.version);
var isOldVersion = version < 9.0; // CS6-dan əvvəlki versiyalar

// == VERSIYA UYĞUN FUNKSİYALAR ==

// Sadə alert debug
function showMessage(msg) {
    alert("DEBUG: " + msg);
}

// Layer yaratma/tapma - köhnə versiyalar üçün uyğun
function getOrCreateLayer(layerName) {
    try {
        // Mövcud layer-ləri yoxla
        for (var i = 0; i < doc.layers.length; i++) {
            if (doc.layers[i].name === layerName) {
                return doc.layers[i];
            }
        }
        // Tapılmazsa yeni yarat
        var newLayer = doc.layers.add();
        newLayer.name = layerName;
        return newLayer;
    } catch (e) {
        alert("Layer xətası: " + e.message);
        return doc.layers[0]; // İlk layer-i qaytar
    }
}

// Təməl frame yaratma funksiyası
function createSimpleFrame(x, y, width, height, content, layerName) {
    try {
        // Koordinatları yoxla
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
            alert("Koordinat xətası: x=" + x + ", y=" + y + ", w=" + width + ", h=" + height);
            return null;
        }
        
        if (width <= 0 || height <= 0) {
            alert("Ölçü xətası: En və uzunluq müsbət olmalıdır");
            return null;
        }

        // Layer götür
        var targetLayer = getOrCreateLayer(layerName);
        
        // Frame yarat - sadə üsul
        var frame = doc.textFrames.add();
        
        // Layer təyin et
        frame.itemLayer = targetLayer;
        
        // Koordinatları təyin et [top, left, bottom, right]
        frame.geometricBounds = [y, x, y + height, x + width];
        
        // Məzmun əlavə et
        if (content) {
            frame.contents = content;
        }
        
        return frame;
        
    } catch (e) {
        alert("Frame yaradılmadı: " + e.message);
        return null;
    }
}

// Şəkil rectangle yaratma
function createSimpleRectangle(x, y, width, height, layerName) {
    try {
        var targetLayer = getOrCreateLayer(layerName);
        var rect = doc.rectangles.add();
        rect.itemLayer = targetLayer;
        rect.geometricBounds = [y, x, y + height, x + width];
        
        // Çərçivə əlavə et
        rect.strokeWeight = 1;
        
        // Boz dolgu əlavə et
        try {
            if (!isOldVersion) {
                rect.fillColor = doc.swatches.itemByName("None");
            }
        } catch (e) {
            // Rəng problemi varsa keç
        }
        
        return rect;
    } catch (e) {
        alert("Rectangle yaradılmadı: " + e.message);
        return null;
    }
}

// Konfiqurasiyanı işlət
function processConfig() {
    var successCount = 0;
    var failCount = 0;
    
    for (var i = 0; i < FRAME_CONFIG.length; i++) {
        var config = FRAME_CONFIG[i];
        var element = null;
        
        if (config.type === "image") {
            element = createSimpleRectangle(
                parseFloat(config.x),
                parseFloat(config.y),
                parseFloat(config.width),
                parseFloat(config.height),
                config.layer
            );
        } else {
            element = createSimpleFrame(
                parseFloat(config.x),
                parseFloat(config.y),
                parseFloat(config.width),
                parseFloat(config.height),
                config.name,
                config.layer
            );
        }
        
        if (element) {
            successCount++;
        } else {
            failCount++;
        }
    }
    
    alert("Nəticə: " + successCount + " uğurlu, " + failCount + " uğursuz");
}

// Konfiqurasiyaya əlavə et
function addToConfig(x, y, w, h, name, layer, type) {
    FRAME_CONFIG.push({
        x: x,
        y: y,
        width: w,
        height: h,
        name: name,
        layer: layer,
        type: type || "text"
    });
}

// Sadə test layout
function createTestLayout() {
    FRAME_CONFIG = [];
    
    // Səhifə ölçülərini götür
    var pageW = doc.documentPreferences.pageWidth;
    var pageH = doc.documentPreferences.pageHeight;
    
    alert("Səhifə ölçüləri: " + pageW + " x " + pageH + " punkt");
    
    // Sadə elementlər əlavə et
    addToConfig(50, 50, 200, 80, "Test Başlıq", "Test_Layer", "text");
    addToConfig(50, 150, 150, 100, "Test Məqalə", "Test_Layer", "text");
    addToConfig(250, 150, 100, 100, "Test Şəkil", "Images", "image");
    
    alert("Test layout hazır: " + FRAME_CONFIG.length + " element");
}

// Avtomatik layout - sadələşdirilmiş
function createAutoLayout(articleCount) {
    FRAME_CONFIG = [];
    
    var pageW = doc.documentPreferences.pageWidth;
    var pageH = doc.documentPreferences.pageHeight;
    var margin = 36; // 0.5 inch = 36 punkt
    
    var workW = pageW - (margin * 2);
    var workH = pageH - (margin * 2);
    
    // Başlıq
    addToConfig(margin, margin, workW, 60, "Baş Başlıq", "Headers", "text");
    
    // Məqalələr
    var articleH = (workH - 100) / articleCount;
    var currentY = margin + 80;
    
    for (var i = 0; i < articleCount; i++) {
        addToConfig(
            margin,
            currentY,
            workW * 0.6, // 60% en
            articleH - 10,
            "Məqalə " + (i + 1),
            "Articles",
            "text"
        );
        
        // Şəkil əlavə et
        addToConfig(
            margin + (workW * 0.65),
            currentY,
            workW * 0.3, // 30% en
            Math.min(articleH - 10, 120),
            "Şəkil " + (i + 1),
            "Images",
            "image"
        );
        
        currentY += articleH;
    }
    
    alert("Avtomatik layout hazır: " + FRAME_CONFIG.length + " element");
}

// == SADƏ GUI ==
function showGUI() {
    var win = new Window("dialog", "Layout Yaradıcı - Sadə Versiya");
    win.orientation = "column";
    win.spacing = 15;
    win.margins = 20;

    // İnfo
    var infoGroup = win.add("group");
    infoGroup.add("statictext", undefined, "InDesign Versiya: " + app.version);

    // Test düymələri
    var testGroup = win.add("group");
    testGroup.orientation = "column";
    testGroup.alignChildren = "fill";
    
    var testBtn = testGroup.add("button", undefined, "Sadə Test Layout (3 element)");
    var autoBtn = testGroup.add("button", undefined, "Avtomatik Layout");
    
    // Məqalə sayı
    var articleGroup = win.add("group");
    articleGroup.add("statictext", undefined, "Məqalə sayı:");
    var articleField = articleGroup.add("edittext", undefined, "3");
    articleField.characters = 5;
    
    // Əsas düymələr
    var buttonGroup = win.add("group");
    var generateBtn = buttonGroup.add("button", undefined, "Yaradır");
    var clearBtn = buttonGroup.add("button", undefined, "Təmizlə");
    var cancelBtn = buttonGroup.add("button", undefined, "Bağla");

    // Hadisələr
    testBtn.onClick = function() {
        createTestLayout();
        alert("Test layout konfiqurasiyası hazır!");
    };
    
    autoBtn.onClick = function() {
        var count = parseInt(articleField.text) || 3;
        createAutoLayout(count);
    };
    
    generateBtn.onClick = function() {
        if (FRAME_CONFIG.length === 0) {
            alert("Əvvəlcə layout seçin!");
            return;
        }
        
        var confirmed = confirm("Layout yaradılsın? " + FRAME_CONFIG.length + " element əlavə ediləcək.");
        if (confirmed) {
            processConfig();
        }
    };
    
    clearBtn.onClick = function() {
        FRAME_CONFIG = [];
        alert("Konfiqurasiya təmizləndi");
    };
    
    cancelBtn.onClick = function() {
        win.close();
    };

    win.center();
    win.show();
}

// Birbaşa test üçün funksiya
function quickTest() {
    try {
        var frame = createSimpleFrame(100, 100, 200, 150, "Test Frame", "Test_Layer");
        if (frame) {
            alert("Test uğurlu! Frame yaradıldı.");
        } else {
            alert("Test uğursuz! Frame yaradılmadı.");
        }
    } catch (e) {
        alert("Test xətası: " + e.message);
    }
}

// ƏSAS İCRA
try {
    // İlk öncə sadə test et
    var doTest = confirm("Əvvəlcə sadə test edilsin?");
    if (doTest) {
        quickTest();
    }
    
    // GUI göstər
    showGUI();
    
} catch (mainError) {
    alert("Əsas xəta: " + mainError.message + "\n\nInDesign versiyasını yoxlayın: " + app.version);
}