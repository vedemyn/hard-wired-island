import { HWIRoll } from "../roll/hwiRoll.js";

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

    //this works, no touch
    var specialties = {};
    actorData.items.forEach(element => {
      for (const key in element.data.data.specialties) {
        const specialty = element.data.data.specialties[key];
        if (specialties[specialty.key]) {
          specialties[specialty.key].value += specialty.value;
        } else {
          specialties[specialty.key] = { key: specialty.key, value: specialty.value };
        }
      }
    });

    for (const key in data.nonItemSpecialties) {
      const value = data.nonItemSpecialties[key].value;
      if (specialties[key]) {
        specialties[key].value += value;
      } else {
        specialties[key] = { key, value };
      }
    }

    data.specialties = specialties;

    for (let [key, ability] of Object.entries(data.abilities)) {
      ability.baseDefense = ability.value + 7;
    }
  }

  async addSpecialty(name, amount) {
    const specs = this.data.data.nonItemSpecialties;
    let newKey = name;
    for (let index = 1; index < 1000; index++) { //1000 just so it cant be infinite loop
      if (!(newKey in this.data.data.nonItemSpecialties)) {
        specs[newKey] = { key: newKey, value: amount };
        break;
      } else {
        newKey = `${name} (${index})`;
      }
    }

    return await this.update({ 'data.nonItemSpecialties': specs });
  }

  async deleteSpecialty(name) {
    const specs = this.data.data.nonItemSpecialties;
    if (name in specs) {
      const key = `data.nonItemSpecialties.-=${name}`;
      return await this.update({ [key]: null });
    }
    else {
      ui.notifications.error("Specialty provided by an Item, please delete the Item instead.");
    }
  }

  async modifySpecialty(name, amount) {
    const nonItemSpecialties = this.data.data.nonItemSpecialties;
    if (name in nonItemSpecialties) {

      let newValue = nonItemSpecialties[name].value + amount;
      if (newValue <= 0) {
        this.deleteSpecialty(name);
      } else {
        return await this.update({ [`data.nonItemSpecialties.${name}.value`]: newValue });
      }

    }
    else {
      if (amount > 0) {
        this.addSpecialty(name, amount);
      } else {
        ui.notifications.error("Specialty at least partially provided by an Item, please modify the specialty in the Item instead.");
      }
    }
  }

  async renameSpecialty(oldname, newname) {
    const nonItemSpecialties = this.data.data.nonItemSpecialties;
    const allSpecialties = this.data.data.specialties;

    if (oldname in nonItemSpecialties) {
      const value = nonItemSpecialties[oldname].value;
      this.deleteSpecialty(oldname);
      this.addSpecialty(newname, value);
      if (oldname in allSpecialties) {
        this.renameItemSpecialties(oldname, newname);
      }
    } else {
      if (oldname in allSpecialties) {
        this.renameItemSpecialties(oldname, newname);
      } else {
        ui.notifications.error("wtf how");
      }
    }
  }

  async renameItemSpecialties(oldname, newname) {
    const itemsWithSpecialty = this.items.filter(entry => 'specialties' in entry.data.data).filter(entry => {
      for (const key in entry.data.data.specialties) {
        if (Object.hasOwnProperty.call(entry.data.data.specialties, key)) {
          const element = entry.data.data.specialties[key];
          if (element.key === oldname) { return true; }
        }
      }
      return false;
    });

    itemsWithSpecialty.forEach(element => {
      element.renameSpecialty(oldname, newname);
    });
  }

  rollAbilityPopup(ability_name) {
    var content = `
    <h2>Roll ${ability_name}</h2>
    <form>
      <div class="form-group">
        <label>Advantage:</label>
        <input id="advantage" name="advantage" type="text" value="0" data-dtype="Number"/>
      </div>
      <div class="form-group">
        <label>Disdvantage:</label>
        <input id="disadvantage" name="disadvantage" type="text" value="0" data-dtype="Number"/>
      </div>
      <div class="form-group">
        <label>Boost:</label>
        <input id="boost" name="boost" type="text" value="0" data-dtype="Number"/>
      </div>
      <div class="form-group">
        <label>Specialties:</label>
        <input id="specialties" name="specialties" type="text" value="0" data-dtype="Number"/>
      </div>
      <div class="form-group">
        <label>Other Bonuses:</label>
        <input id="other" name="other" type="text" value="0" data-dtype="Number"/>
      </div>
      <div class="form-group">
        <label>Target Number:</label>
        <input id="tn" name="tn" type="text" value="0" data-dtype="Number"/>
      </div>
      <div class="form-group">
        <label>Notes:</label>
        <input id="notes" name="notes" type="text" value="" data-dtype="String"/>
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

            let notes = html.find('[name="notes"]')[0].value;

            let roll = new HWIRoll(rollString, this.data.data, tn, notes);
            let label = ability_name ? `Rolling ${ability_name}` : '';
            roll.evaluate().toMessage({
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