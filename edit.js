// jshint esversion: 6

const UBIQUITY_SETTINGS = "ubiquity-settings";

var scriptNamespace = window.location.search? decodeURI(window.location.search.substring(1)): "default";

// inserts stub (example command)
function insertExampleStub() {

    var stubs = {
  'insertnotifystub': // simple notify command 
`/* This is a template command. */
CmdUtils.CreateCommand({
    name: "1example",
    argument: [{role: "object", nountype: noun_arb_text, label: "words"}],
    description: "A short description of your command.",
    author: "Your Name",
    icon: "res/icon-24.png",
    execute: function execute({object: {text}}) {
        CmdUtils.notify("Execute:Your input is: " + text);
        CmdUtils.closePopup();
    },
    preview: function preview(pblock, {object: {text}}) {
        pblock.innerHTML = "Preview:Your input is " + text + ".";
    },
});

`
, 'insertsearchstub': // simple search / preview command (e. g. using ajax)
`/* This is a template command. */
CmdUtils.CreateCommand({
    name: "2example",
    argument: [{role: "object", nountype: noun_arb_text, label: "words"}],
    description: "Commence DuckGoGo search.",
    icon: "http://www.duckduckgo.com/favicon.ico",
    execute: function execute({object: {text}}) {   
        CmdUtils.addTab("https://duckduckgo.com/?q=" + encodeURIComponent(text));
        CmdUtils.closePopup();
    },
    preview: function preview(pblock, {object: {text}}) {
        var url = "https://duckduckgo.com/html?q=" + encodeURIComponent(text);
        CmdUtils.ajaxGet(url, function(data) {
            pblock.innerHTML = jQuery("#links", data).html(); 
        });
    },
});

`
, 'insertenhsearchstub': // enhanced search / preview command
`/* This is a template command. */
CmdUtils.makeSearchCommand({
  name: ["3example"],
  description: "Searches quant.com",
  author: {name: "Your Name", email: "your-mail@example.com"},
  icon: "https://www.qwant.com/favicon-152.png?1503916917494",
  url: "https://www.qwant.com/?q={QUERY}&t=all",
  prevAttrs: {zoom: 0.75, scroll: [100/*x*/, 0/*y*/], anchor: ["c_13", "c_22"]},
});

`
    };

    var stub = stubs[this.id];
    //editor.replaceRange(stub, editor.getCursor());
    editor.session.insert(editor.getCursorPosition(), stub);

    //editor.setValue( stub + editor.getValue() );
    saveScripts();
    return false;
}

// evaluates and saves scripts from editor
function saveScripts() {
    var customscripts = editor.getValue();

    if (scriptNamespace === UBIQUITY_SETTINGS) {
        chrome.storage.local.set(JSON.parse(customscripts));
    }
    else {
        // save
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get('customscripts', function (result) {
                result.customscripts[scriptNamespace] = {scripts: customscripts};
                chrome.storage.local.set(result);
                console.log(result);
            });
        }

        // eval
        try {
            $("#info").html("evaluated!");
                eval(customscripts);
        } catch (e) {
            $("#info").html("<span style='background-color:red'>" + e.message + "</span>");
        }
        CmdUtils.loadCustomScripts();
    }

    // download link
    var a = document.getElementById("download");
    var file = new Blob([customscripts], {type: "text/plain"});
    a.href = URL.createObjectURL(file);
    a.download = scriptNamespace + (scriptNamespace === UBIQUITY_SETTINGS? ".json": ".js");
}

editor = ace.edit("code");
editor.setTheme("ace/theme/monokai");
editor.getSession().setMode("ace/mode/javascript");

CmdUtils.getPref("keyboardScheme", keyboardScheme => {
    if (keyboardScheme !== "ace")
        editor.setKeyboardHandler("ace/keyboard/" + keyboardScheme);
});

editor.setPrintMarginColumn (120);

editor.on("blur", saveScripts);
editor.on("change", saveScripts);

$("#script-namespaces").change(() => {
    saveScripts();
    chrome.storage.local.get('customscripts', function(result) {
        scriptNamespace = $("#script-namespaces").val();
        editor.setValue(result.customscripts[scriptNamespace].scripts || "", -1);
    });
});

$("#create-namespace").click(() => {
    if (scriptNamespace === UBIQUITY_SETTINGS)
        return;

    let name = prompt("Name: ");
    if (name) {
        chrome.storage.local.get('customscripts', function(result) {
            ADD_NAME: {
                saveScripts();

                for (let n in result.customscripts) {
                    if (n.toLowerCase() == name.toLowerCase()) {
                        scriptNamespace = n;
                        $("#script-namespaces").val(n);
                        editor.setValue(result.customscripts[scriptNamespace].scripts || "", -1);
                        break ADD_NAME;
                    }
                }

                editor.setValue("");

                scriptNamespace = name;
                $("#script-namespaces").append($("<option></option>")
                    .attr("value", name)
                    .text(name))
                    .val(name);
            }
        });
    }
});

$("#delete-namespace").click(() => {
    if (scriptNamespace !== "default" && scriptNamespace !== UBIQUITY_SETTINGS)
        if (confirm("Are you sure?")) {
            chrome.storage.local.get('customscripts', function(result) {
                delete result.customscripts[scriptNamespace];
                chrome.storage.local.set(result);
                $('option:selected', $("#script-namespaces")).remove();

                scriptNamespace = $("#script-namespaces").val();
                editor.setValue(result.customscripts[scriptNamespace].scripts || "", -1);
            });
        }
});

$("#insertnotifystub").click( insertExampleStub );
$("#insertsearchstub").click( insertExampleStub );
$("#insertenhsearchstub").click( insertExampleStub );

// load scrtips
if (typeof chrome !== 'undefined' && chrome.storage) {
    if (scriptNamespace === UBIQUITY_SETTINGS)
        chrome.storage.local.get(undefined, function(result) {
            $("#script-namespaces").prop("disabled", "disabled");
            if (result) {
                editor.setValue(JSON.stringify(result, null, 2), -1);
                alert("Here be dragons!");
            }
        });
    else
        chrome.storage.local.get('customscripts', function(result) {
            var sorted = Object.keys(result.customscripts).sort(function (a, b) {
                if (a.toLocaleLowerCase() < b.toLocaleLowerCase())
                    return -1;
                if (a.toLocaleLowerCase() > b.toLocaleLowerCase())
                    return 1;
                return 0;
            });
            for (let n of sorted)
                if (n !== "default")
                    $("#script-namespaces").append($("<option></option>")
                        .attr("value",n)
                        .text(n));
            $("#script-namespaces").val(scriptNamespace);

            editor.setValue(result.customscripts[scriptNamespace].scripts || "", -1);
            saveScripts();
        });
}
