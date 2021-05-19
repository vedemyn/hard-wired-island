/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class HWIActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    const data = actorData.data;

    // Loop through ability scores and set their defense values based on them.
    for (let [key, ability] of Object.entries(data.abilities)) {
      ability.baseDefense = ability.value + 7;
    }
  }

  rollAbilityPopup(ability_name) {
    var content = `
    <h2>Roll ${ability_name}</h2>
    <form>
      <div class="form-group">
        <label>Advantage:</label>
        <input id="advantage" name="advantage" type="text" value="0" data-dtype="Number"/>
        <label>Disdvantage:</label>
        <input id="disadvantage" name="disadvantage" type="text" value="0" data-dtype="Number"/>
        <label>Boost:</label>
        <input id="boost" name="boost" type="text" value="0" data-dtype="Number"/>
        <label>Specialties:</label>
        <input id="specialties" name="specialties" type="text" value="0" data-dtype="Number"/>
        <label>Other Bonuses:</label>
        <input id="other" name="other" type="text" value="0" data-dtype="Number"/>
        <label>Target Number:</label>
        <input id="tn" name="tn" type="text" value="0" data-dtype="Number"/>
      </div>
    </form>`

    let d = new Dialog({
      title: `Roll ${ability_name}`,
      content: content,
      buttons: {
        yes: {
          icon: "<i class='fas fa-check'></i>",
          label: "Roll",
          callback: (html) => {

            let advAmount = parseInt(html.find('[name="advantage"]')[0].value) -
              parseInt(html.find('[name="disadvantage"]')[0].value);

            let diceAmount = 2 + parseInt(html.find('[name="boost"]')[0].value);
            if (this.data.data.harm.serious.one) {
              diceAmount--;
            }
            diceAmount += Math.abs(advAmount);
            if (diceAmount < 0) { diceAmount = 0; }

            let bonus = parseInt(html.find('[name="specialties"]')[0].value) +
              parseInt(html.find('[name="other"]')[0].value);
            if (ability_name === "cool") {
              bonus += this.data.data.abilities.cool.value;
            } else if (ability_name === "clever") {
              bonus += this.data.data.abilities.clever.value;
            } else if (ability_name === "tough") {
              bonus += this.data.data.abilities.tough.value;
            } else if (ability_name === "quick") {
              bonus += this.data.data.abilities.quick.value;
            }

            if (this.data.data.harm.harm.one) {
              bonus--;
            }
            if (this.data.data.harm.harm.two) {
              bonus--;
            }

            let tn = parseInt(html.find('[name="tn"]')[0].value);

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

            let roll = new Roll(rollString, this.data.data);
            let label = ability_name ? `Rolling ${ability_name}` : '';
            roll.roll().toMessage({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              flavor: label
            });
          }
        },

        no: {
          icon: "<i class='fas fa-times'></i>",
          label: "Close",
        },
      },
      default: "yes",
    });
    d.render(true);
  }

}