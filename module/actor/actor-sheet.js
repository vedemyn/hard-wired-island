/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HWIActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["hardwiredisland", "sheet", "actor"],
      template: "systems/hard-wired-island/templates/actor/actor-sheet.html",
      width: 600,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "specialties" }]
    });
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const data = super.getData();
    data.data.dtypes = ["String", "Number", "Boolean"];
    for (let attr of Object.values(data.data.data.attributes)) {
      attr.isCheckbox = attr.dtype === "Boolean";
    }

    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data.data);
    }

    return data.data;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */

  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.data;
    const assets = [];
    const talents = [];
    const augmentations = [];
    const specialties = [];
    const occupations = [];
    // const origin; //how to handle these....
    // const gigapp;

    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      if (i.type === 'asset') {
        assets.push(i);
      } else if (i.type === 'talent') {
        talents.push(i);
      } else if (i.type === 'augmentation') {
        augmentations.push(i);
      } else if (i.type === 'specialty') {
        specialties.push(i);
      } else if (i.type === 'occupation') {
        occupations.push(i);
      }
    }

    actorData.assets = assets;
    actorData.talents = talents;
    actorData.augmentations = augmentations;
    actorData.specialties = specialties;
    actorData.occupations = occupations;
  }

  _itemDisplayDescription(item, event) {
    event.preventDefault();
    let li = $(event.currentTarget),
      itemDescription = item.data.data.description;

    // Toggle summary
    if (li.hasClass("expanded")) {
      let descriptionElement = li.children(".item-description");
      descriptionElement.slideUp(200, () => descriptionElement.remove());
    } else {
      let div = $(`<div class="item-description">${itemDescription}</div>`);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.ability-button').click(this._onRoll.bind(this));

    // Toggle item details 
    html.find(".items-list .item").click(async (ev) => {
      const li = $(ev.currentTarget);
      let itemId = li.data("itemId");
      let item = this.actor.getOwnedItem(itemId);

      if (!item) {
        item = game.items.get(itemId);
      }
      this._itemDisplayDescription(item, ev);
    });

    // // Drag events for macros.
    // if (this.actor.owner) {
    //   let handler = ev => this._onDragStart(ev);
    //   html.find('li.item').each((i, li) => {
    //     if (li.classList.contains("inventory-header")) return;
    //     li.setAttribute("draggable", true);
    //     li.addEventListener("dragstart", handler, false);
    //   });
    // }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return this.actor.createOwnedItem(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async _onRoll(event) {
    const attribute_name = $(event.currentTarget).data("label");
    this.actor.rollAbilityPopup(attribute_name);
  }

}
