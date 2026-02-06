// test_dialog.jsx
// Sadə Test: düyməyə basıldığında alert göstərilməlidir.

(function(){
    // Qısa test pəncərəsi — modal dialog
    var w = new Window("dialog", "Test Dialog");
    w.orientation = "column";
    w.alignChildren = ["fill","top"];
    var btn = w.add("button", undefined, "Bas məni");
    btn.onClick = function() {
        alert("✓ Btn click işləyir!");
    };
    var closeBtn = w.add("button", undefined, "Bağla");
    closeBtn.onClick = function() {
        w.close();
    };
    w.center();
    w.show();
})();