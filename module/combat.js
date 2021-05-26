import { HWIRoll } from "./roll/hwiRoll.js";

/**
 * Extend the base Combat entity.
 * @extends {Combat}
 */
export class HWICombat extends Combat {

    /** @override */
    async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
        let initiative = this;
        let promise = new Promise(async function (resolve, reject) {
            const id = randomID(); //do i need this

            let whosInitiative = initiative.combatant.name;

            if (Array.isArray(ids) && ids.length > 1) {
                whosInitiative = "Multiple Combatants";
            } else {
                // Make sure we are dealing with an array of ids
                ids = typeof ids === "string" ? [ids] : ids;
                const c = initiative.getCombatant(ids[0]);
                whosInitiative = c.actor.name;
            }

            const title = `Initiative Roll (Cool) for ${whosInitiative}`;
            const content = await renderTemplate("systems/hard-wired-island/templates/roll/initiative-popup.html", {});

            new Dialog({
                title,
                content,
                buttons: {
                    yes: {
                        icon: "<i class='fas fa-check'></i>",
                        label: "Roll",
                        callback: async (html) => {

                            const currentId = initiative.combatant._id;

                            const [updates] = ids.reduce(
                                (results, id, i) => {
                                    let [updates] = results;

                                    const c = initiative.getCombatant(id);
                                    if (!c || !c.owner) return resolve(results);

                                    let advAmount = parseInt(html.find('[name="advantage"]')[0].value) -
                                        parseInt(html.find('[name="disadvantage"]')[0].value);

                                    let diceAmount = 2 + parseInt(html.find('[name="boost"]')[0].value);
                                    if (c.actor.data.data.harm.serious.one) {
                                        diceAmount--;
                                    }
                                    diceAmount += Math.abs(advAmount);
                                    if (diceAmount < 0) { diceAmount = 0; }

                                    let bonus = parseInt(html.find('[name="specialties"]')[0].value) +
                                        parseInt(html.find('[name="other"]')[0].value);

                                    bonus += c.actor.data.data.abilities.quick.value;

                                    if (c.actor.data.data.harm.harm.one) {
                                        bonus--;
                                    }
                                    if (c.actor.data.data.harm.harm.two) {
                                        bonus--;
                                    }

                                    let rollString = `${diceAmount}d6`

                                    if (advAmount !== 0) {
                                        if (advAmount > 0) {
                                            rollString += `dl`;
                                        } else {
                                            rollString += `dh`;
                                        }
                                        rollString += `${Math.abs(advAmount)}`;
                                    }

                                    rollString += `+${bonus}`;

                                    let roll = new HWIRoll(rollString, c.actor.data.data,).evaluate();

                                    updates.push({ _id: id, initiative: roll.total });

                                    let label = `Rolling initiative (Cool)`;
                                    let chatData = roll.toMessage({
                                        speaker: ChatMessage.getSpeaker({ actor: c.actor }),
                                        flavor: label
                                    }, {rollType: "initiative"});

                                    if (i > 0) chatData.sound = null;

                                    return results;
                                },
                                [[], []]
                            );

                            if (!updates.length) return initiative;

                            // Update multiple combatants
                            await initiative.updateEmbeddedEntity("Combatant", updates);

                            // Ensure the turn order remains with the same combatant
                            if (updateTurn) {
                                await initiative.update({ turn: initiative.turns.findIndex((t) => t._id === currentId) });
                            }

                            resolve(initiative);
                        },
                    },

                    no: {
                        icon: "<i class='fas fa-times'></i>",
                        label: "Close",
                    },
                },
                default: "no",
            }).render(true);
        });

        return await promise;
    }

}