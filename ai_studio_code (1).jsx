#targetengine "session"

// DIYAQNOSTIK SCRIPT - InDesign 19.0 API TEST
// Bu script problemi aydın edəcək

if (!app.documents.length) {
    alert("Sənəd açmalıyınız!");
    exit();
}

var doc = app.activeDocument;
var page = doc.pages[0]; // İlk səhifə

$.writeln("═══════════════════════════════════════");
$.writeln("DIYAQNOSTIK TEST BAŞLADI");
$.writeln("═══════════════════════════════════════");

$.writeln("\n1️⃣ SƏHIFƏ MALUMATı:");
$.writeln("   Page: " + page.name);
$.writeln("   Bounds: " + page.bounds);
$.writeln("   Valid: " + page.isValid);

$.writeln("\n2️⃣ MARJ MƏLUMATı:");
var margin = page.marginPreferences;
$.writeln("   Margins mövcud: " + (margin ? "BƏLI" : "XEYR"));
if (margin) {
    $.writeln("   Top: " + margin.top);
    $.writeln("   Left: " + margin.left);
    $.writeln("   Bottom: " + margin.bottom);
    $.writeln("   Right: " + margin.right);
}

$.writeln("\n3️⃣ MÖVCUD ELEMENTLƏR:");
$.writeln("   page.pageItems: " + (page.pageItems ? page.pageItems.length : "NULL"));

try {
    $.writeln("   page.allPageItems: " + page.allPageItems.length);
} catch(e) {
    $.writeln("   page.allPageItems: ERROR (" + e.message + ")");
}

$.writeln("   page.textFrames: " + (page.textFrames ? page.textFrames.length : "NULL"));
$.writeln("   page.rectangles: " + (page.rectangles ? page.rectangles.length : "NULL"));

$.writeln("\n4️⃣ TEXT FRAME ƏLAVƏ ETMƏ TESTİ:");
try {
    var testFrame = page.textFrames.add();
    $.writeln("   ✓ textFrames.add() işlədi");
    $.writeln("   Created: " + testFrame.name);
    
    // Bounds test
    $.writeln("\n5️⃣ BOUNDS TEST:");
    var testBounds = [100, 100, 200, 300];
    $.writeln("   Setting bounds: [" + testBounds + "]");
    testFrame.geometricBounds = testBounds;
    $.writeln("   Got bounds: [" + testFrame.geometricBounds + "]");
    
    // Content test
    $.writeln("\n6️⃣ MƏZMUN TEST:");
    testFrame.contents = "TEST MƏTN";
    $.writeln("   Contents: " + testFrame.contents);
    $.writeln("   ✓ Mətn əlavə edildi");
    
    // Font test
    $.writeln("\n7️⃣ FONT TEST:");
    try {
        var fonts = app.fonts;
        $.writeln("   Mövcud fontlar: " + fonts.length);
        for (var f = 0; f < Math.min(5, fonts.length); f++) {
            $.writeln("     - " + fonts[f].name);
        }
        
        // Arial axtarış
        var arialFound = false;
        for (var af = 0; af < fonts.length; af++) {
            if (fonts[af].name.indexOf("Arial") !== -1) {
                $.writeln("   ✓ Arial tapıldı: " + fonts[af].name);
                arialFound = true;
                break;
            }
        }
        if (!arialFound) $.writeln("   ⚠️ Arial tapılmadı!");
    } catch(fe) {
        $.writeln("   Font enumerate error: " + fe.message);
    }
    
    // Font tətbiqi
    $.writeln("\n8️⃣ FONT TƏTBİQİ TEST:");
    try {
        testFrame.parentStory.characters.everyItem().pointSize = 12;
        $.writeln("   ✓ Font size tətbiq edildi");
    } catch(fe) {
        $.writeln("   ✗ Font size error: " + fe.message);
    }
    
    // Sil
    testFrame.remove();
    $.writeln("\n✓ Test frame silindi");
    
} catch(e) {
    $.writeln("   ✗ ERROR: " + e.message);
    $.writeln("   Line: " + e.line);
}

$.writeln("\n9️⃣ SHAPE (RECTANGLE) ƏLAVƏ TEST:");
try {
    var testRect = page.rectangles.add();
    $.writeln("   ✓ rectangles.add() işlədi");
    testRect.geometricBounds = [50, 50, 150, 150];
    $.writeln("   ✓ Bounds tətbiq edildi");
    testRect.strokeWeight = 1;
    $.writeln("   ✓ Stroke tətbiq edildi");
    testRect.remove();
    $.writeln("   ✓ Rectangle silindi");
} catch(e) {
    $.writeln("   ✗ ERROR: " + e.message);
}

$.writeln("\n🔟 LAYER TEST:");
try {
    var testLayer = doc.layers.add({name: "TEST_LAYER"});
    $.writeln("   ✓ Layer yaradıldı: " + testLayer.name);
    testLayer.remove();
    $.writeln("   ✓ Layer silindi");
} catch(e) {
    $.writeln("   ✗ ERROR: " + e.message);
}

$.writeln("\n═══════════════════════════════════════");
$.writeln("TEST TAMAMLANDI");
$.writeln("═══════════════════════════════════════");

alert("Diyaqnostik test tamamlandı!\n\nConsole-da nəticələri görün:\nWindow → Utilities → ExtendScript Toolkit");