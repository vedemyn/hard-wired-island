/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class HWIItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    // const itemData = this.data;
    // const actorData = this.actor ? this.actor.data : {};
    // const data = itemData.data;
  }


  async addSpecialty() {
    var specs = this.data.data.specialties;
    let newIndex = Object.keys(specs).length;

    specs[newIndex] = { key: "Name", value: 1 };

    return await this.update({ 'data.specialties': specs });
  }

  async deleteSpecialty(deletionIndex) {
    var specs = this.data.data.specialties;
    let last = Object.keys(specs).length - 1;
    for (let index = 0; index < last; index++) {
      if (index >= deletionIndex) {
        specs[index] = specs[index+1];
      }
    }
    return await this.update({ 'data.specialties': specs , [`data.specialties.-=${last}`]: null});
  }

  // /*
  //  * Handle clickable rolls.
  //  * @param {Event} event   The originating click event
  //  * @private
  //  */
  // async roll() {
  //   // Basic template rendering data
  //   const token = this.actor.token;
  //   const item = this.data;
  //   const actorData = this.actor ? this.actor.data.data : {};
  //   const itemData = item.data;

  //   let roll = new Roll('d20+@abilities.str.mod', actorData);
  //   let label = `Rolling ${item.name}`;
  //   roll.roll().toMessage({
  //     speaker: ChatMessage.getSpeaker({ actor: this.actor }),
  //     flavor: label
  //   });
  // }
}
