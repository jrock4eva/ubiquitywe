// jshint esversion: 6

const UBIQUITY_SETTINGS = "ubiquity-settings";

var scriptNamespace = window.location.search? decodeURI(window.location.search.substring(1)): "default";

// inserts stub (example command)
function insertExampleStub() {

    var stubs = {
  'insertcommandstub':
`/* This is a template command. */
CmdUtils.CreateCommand({
    name: "my-command",
    argument: [{role: "object", nountype: noun_arb_text, label: "text"}],
    description: "A short description of your command.",
    author: "Your Name",
    icon: "res/icon-24.png",
    execute: function execute({object: {text}}) {
        CmdUtils.notify("Your input is: " + text);
        CmdUtils.closePopup();
    },
    preview: function preview(pblock, {object: {text}}) {
        pblock.innerHTML = "Your input is " + text + ".";
    },
});

`
, 'insertsearchstub': // simple search / preview command (e. g. using ajax)
`/* This is a template command. */
CmdUtils.makeSearchCommand({
    name: "my-search-command",
    url: "http://www.example.com/find?q=%s",
    defaultUrl: "http://www.example.com",
    arguments: [{role: "object", nountype: noun_arb_text, label: "query"}],
    timeout: 1000,
    icon: "res/icon-24.png",
    parser: {
        container  : ".css > .selector", // result item container
        title      : ".css > .selector", // result item title
        thumbnail  : ".css > .selector", // result item thumbnail
      //body       : ".css > .selector", // result item summary
        maxResults : 10,
    },
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
        let settings;
        try {
            settings = JSON.parse(customscripts)
        }
        catch (e) {
            console.log(e);
            return;
        }

        console.log(settings);
        if (settings)
            chrome.storage.local.set(settinяs);
        else
            chrome.storage.local.clear();
    }
    else {
        // save
        if (typeof chrome !== 'undefined' && chrome.storage) {
            CmdUtils.getPref("customscripts", all_scripts => {
                if (!all_scripts)
                    all_scripts = {};
                all_scripts[scriptNamespace] = {scripts: customscripts};
                CmdUtils.setPref("customscripts", all_scripts);
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

function setNamespaceScripts(all_scripts, namespace) {
    let namespace_scripts = all_scripts[namespace];
    if (namespace_scripts)
        editor.setValue(namespace_scripts.scripts || "", -1);
    else
        editor.setValue("");
}

$("#script-namespaces").change(() => {
    saveScripts();
    CmdUtils.getPref("customscripts", all_scripts => {
        if (!all_scripts)
            all_scripts = {};
        scriptNamespace = $("#script-namespaces").val();
        setNamespaceScripts(all_scripts, scriptNamespace);
    });
});

$("#create-namespace").click(() => {
    if (scriptNamespace === UBIQUITY_SETTINGS)
        return;

    let name = prompt("Name: ");
    if (name) {

        CmdUtils.getPref("customscripts", all_scripts => {
            ADD_NAME: {
                saveScripts();

                for (let n in all_scripts) {
                    if (n.toLowerCase() == name.toLowerCase()) {
                        scriptNamespace = n;
                        $("#script-namespaces").val(n);
                        setNamespaceScripts(all_scripts, scriptNamespace)
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
            CmdUtils.getPref("customscripts", all_scripts => {
                delete all_scripts[scriptNamespace];
                CmdUtils.setPref("customscripts", all_scripts, );
                $('option:selected', $("#script-namespaces")).remove();

                scriptNamespace = $("#script-namespaces").val();
                setNamespaceScripts(all_scripts, scriptNamespace);
            });
        }
});

$("#insertcommandstub").click( insertExampleStub );
$("#insertsearchstub").click( insertExampleStub );

// load scrtips
if (typeof chrome !== 'undefined' && chrome.storage) {
    if (scriptNamespace === UBIQUITY_SETTINGS)
        chrome.storage.local.get(undefined, function(result) {
            $("#script-namespaces").prop("disabled", "disabled");
            if (result) {
                editor.setValue(JSON.stringify(result, null, 2), -1);
                //alert("Here be dragons!");
            }
        });
    else
        CmdUtils.getPref("customscripts", all_scripts => {
            var sorted = Object.keys(all_scripts).sort(function (a, b) {
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

            setNamespaceScripts(all_scripts, scriptNamespace);
            saveScripts();
        });
}
