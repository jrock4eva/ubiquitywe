{
    const MS_TRANSLATOR_LIMIT = 1e4;

    function defaultLanguage(code2name, exclude) {
        for (let code of [chrome.i18n.getUILanguage()].concat(CmdUtils.acceptLanguages)) {
            if (!(code = code.trim())) continue;
            code = (/^(..-)(..)$/i.test(code)
                ? RegExp.$1.toLowerCase() + RegExp.$2.toUpperCase()
                : code.slice(0, 2).toLowerCase());
            if (code === exclude) continue;
            let name = code2name[code];
            if (name) return {name: name, code: code}
        }
        return {name: code2name["en"], code: "en"}
    }

    function translate(target, from, to, back) {
        if (!to) return void
            msTranslator("Detect", {text: target.text}, function detected(code) {
                translate(target, from, defaultLanguage(noun_type_lang_microsoft.MS_LANGS_REV, code).code, back)
            });
        let {html} = target
        // bitbucket#29: The API doesn't like apostrophes HTML-escaped.
        ~html.indexOf('<') || (html = html.replace(/&#39;/g, "'"));
        msTranslator("Translate", {
            contentType: "text/html", text: html, from: from, to: to,
        }, back)
    }

    function msTranslator(method, params, back) {
        params.appId = CmdUtils.microsoftTranslatorAppId;
        console.log(params.appId);
        $.ajax({
            url: "http://api.microsofttranslator.com/V2/Ajax.svc/" + method,
            data: params,
            success : function mst_ok(json) { back(JSON.parse(json)) },
            error   : function mst_ng() {
                displayMessage({title: "Microsoft Translator", text: "(>_<)"})
            },
        })
    }

    CmdUtils.CreateCommand({
        name: "translate",
        uuid: "43599939-571E-4EBF-AF64-8AD6F39C7B79",
        description: "Translates from one language to another using <a href='https://www.bing.com/translator'>Bing Translator</a>.",
        _namespace: "Translation",
        icon: "res/translate_bing.ico",
        arguments: {
            object: noun_arb_text,
            source: noun_type_lang_microsoft,
            goal: noun_type_lang_microsoft
        },
        builtIn: true,
        previewDelay: 1000,
        help:
            `<span class="syntax">Syntax</span>
            <ul class="syntax">
                <li><b>translate</b> {[<b>this</b>] | <i>text</i>} [<b>from</b> <i>language</i>] [<b>to</b> <i>language</i>]</li>
            </ul>
            <span class="arguments">Arguments</span><br>
            <ul class="syntax">
                <li>- <b>from, to</b> - a valid language name supported by Bing Translator</li>
            </ul>
            <span class="arguments">Example</span>
            <ul class="syntax">
                <li><b>translate</b> <i>mother</i> <b>from</b> <i>english</i> <b>to</b> <i>chinese</i></li>
            </ul>
            <p>It works on the selected text in any web page, but there is a limit (a couple of paragraphs)
                to how much it can translate at once.
                If you want to translate a lot of text, use <i>translate-page</i> command instead.</p>`,
        author: "satyr",
        execute: function translate_execute({object, goal, source}) {
            let from = "", to = "";

            if (source && source.data)
                from = source.data;

            if (goal && goal.data)
                to = goal.data;

            if (object.text && object.text.length <= MS_TRANSLATOR_LIMIT)
                translate(object, from, to, CmdUtils.setSelection.bind(CmdUtils));
            else
                CmdUtils.deblog("Error performing translation: no text or text exceeded limits");
        },
        preview: function translate_preview(pblock, {object, goal, source}) {
            let limitExceeded = object.text.length > MS_TRANSLATOR_LIMIT;
            let from = "", to = "";

            if (source && source.data)
                from = source.data;

            if (goal && goal.data)
                to = goal.data;

            if (!object.text || limitExceeded) {
                let ph = "";
                if (limitExceeded)
                    ph += '<p><em class="error">' +
                        _("The text you selected exceeds the API limit.") +
                        '</em>';
                pblock.innerHTML = ph;
                return;
            }

            pblock.innerHTML = _("Translating the selected text...");
            translate(
                object, from, to,
                CmdUtils.previewCallback(pblock, function show(html) {
                    pblock.innerHTML = html
                }))
        }
    });


    CmdUtils.CreateCommand({
        names: ["translate-page"],
        uuid: "9A6DFBFE-3BB6-4131-996A-25FB0E9B7A26",
        _namespace: "Translation",
        description: `Translates a whole page to the specified language using 
                        <a href="http://translate.google.com">Google Translate</a>.`,
        icon: "res/translate_google.ico",
        author: "satyr",
        builtIn: true,
        arguments: {
            object: noun_arb_text,
            goal: noun_type_lang_google,
        },
        execute: function gtranslate_execute({object, goal}) {
            if (!object.text)
                object.text = CmdUtils.getLocation();

            Utils.openUrlInBrowser(
                "http://translate.google.com/translate" +
                Utils.paramsToString({
                    u: object.text,
                    tl: goal.data || "en",
                }));
        },
        preview: function gtranslate_preview(pb, {object, goal}) {
            if (!object.text)
                object.text = CmdUtils.getLocation();

            let url = (object && object.text)? Utils.escapeHtml(object.text): "";
            let lang = (goal && goal.text && goal.text !== object.text)? goal.text: "English";

            pb.innerHTML =`Translates <i>${url}</i> to <strong>${lang}</strong>.`;
        },
    })
}