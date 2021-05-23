export class HWIRoll extends Roll {
    constructor(...args) {
        super(...args);
        this.targetnumber = args[2];
        this.critical = false;
        this.success = false;
        this.flavortext = args[3];
    }

    /* -------------------------------------------- */
    /** @override */
    evaluate() {
        super.evaluate();

        this.success = this.total >= this.targetnumber;

        for (let i = 0; i < this.dice[0].results.length; i++) {
            const e1 = this.dice[0].results[i];
            for (let j = i + 1; j < this.dice[0].results.length; j++) {
                const e2 = this.dice[0].results[j];
                if (!e1.discarded && !e2.discarded) {
                    if (e1.result == e2.result) {
                        this.critical = true;
                    }
                }
            }
        }

        this.critical = this.critical && this.success;

        return this;
    }

    /* -------------------------------------------- */
    /** @override */
    roll() {
        return this.evaluate();
    }


    // /* -------------------------------------------- */
    // /** @override */
    // async render() {

    // }

    /* -------------------------------------------- */
    /** @override */
    toMessage(messageData = {}, { rollMode = null, create = true } = {}) {
        if (!this._rolled) this.evaluate();
        
        const rMode = rollMode || messageData.rollMode || game.settings.get("core", "rollMode");

        let template = "systems/hard-wired-island/templates/chat/roll-message.html"
        if (["gmroll", "blindroll"].includes(rMode)) {
            messageData.whisper = ChatMessage.getWhisperRecipients("GM");
        }
        if (rMode === "blindroll") messageData.blind = true;
        if (rMode === "selfroll") messageData.whisper = [game.user.id];


        // Prepare chat data
        messageData = mergeObject(
            {
                user: game.user._id,
                type: template,
                content: this.total,
                sound: CONFIG.sounds.dice,
            },
            messageData
        );
        messageData.roll = this;

        // Prepare message options
        const messageOptions = { rollMode: rMode };
        // Either create the message or just return the chat data
        return create ? CONFIG.ChatMessage.entityClass.create(messageData, messageOptions) : messageData;
    }


    /* -------------------------------------------- */
    /** @override */
    toJSON() {
        const json = super.toJSON();
        json.targetnumber = this.targetnumber;
        json.critical = this.critical;
        json.flavortext = this.flavorText;
        json.success = this.success;
        return json;
    }

    /** @override */
    static fromJSON(json) {
        const roll = super.fromJSON(json);
        roll.targetnumber = json.targetnumber;
        roll.critical = json.critical;
        roll.flavortext = json.flavorText;
        roll.success = json.success;
        return roll;
    }


    /** @override */
    static fromData(data) {
        const roll = super.fromData(data);
        roll.targetnumber = data.targetnumber;
        roll.critical = data.critical;
        roll.flavortext = data.flavorText;
        roll.success = data.success;
        return roll;
    }
}