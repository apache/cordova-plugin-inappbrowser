oxide.addMessageHandler("EXECUTE", function(msg) {
    var code = msg.args.code;
    try {
        msg.reply({result: eval(code)});
    } catch(e) {
        msg.error("Code threw exception: \"" + e + "\"");
    }
});
