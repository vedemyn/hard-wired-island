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
      width: 720,
      height: 800,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "traits-gigapps" }]
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
    const occupations = [];
    const traits = [];
    const gigapps = [];

    let origin_item;

    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;

      if (i.type === 'asset') {
        assets.push(i);
      } else if (i.type === 'talent') {
        talents.push(i);
      } else if (i.type === 'augmentation') {
        augmentations.push(i);
      } else if (i.type === 'occupation') {
        occupations.push(i);
      } else if (i.type === 'trait') {
        traits.push(i);
      } else if (i.type === 'gigapp') {
        gigapps.push(i);
      } else if (i.type === 'origin') {
        if (origin_item) {
          this.actor.deleteOwnedItem(origin_item._id); //highlander
          origin_item = i;
        } else {
          origin_item = i;
        }
      } 
    }

    actorData.assets = assets;
    actorData.talents = talents;
    actorData.augmentations = augmentations;
    actorData.occupations = occupations;
    actorData.origin = origin_item;
    actorData.traits = traits;
    actorData.gigapps = gigapps;
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
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")]);
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.ability-button').click(this._onRoll.bind(this));

    // Toggle item details 
    html.find(".items-list .item").click(async (ev) => {
      const li = $(ev.currentTarget);
      let itemId = li.data("itemId");
      let item = this.actor.items.get(itemId);

      if (!item) {
        item = game.items.get(itemId);
      }
      this._itemDisplayDescription(item, ev);
    });

    html.find('.specialty-create').click(ev => {
      this.actor.addSpecialty("Name", 1);
    });

    html.find('.specialty-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".specialty");
      this.actor.deleteSpecialty(li.data("specialtyName"));
    });

    html.find('.specialty-decrease').click(ev => {
      const li = $(ev.currentTarget).parents(".specialty");
      this.actor.modifySpecialty(li.data("specialtyName"), -1);
    });

    html.find('.specialty-increase').click(ev => {
      const li = $(ev.currentTarget).parents(".specialty");
      this.actor.modifySpecialty(li.data("specialtyName"), 1);
    });

    html.find('.specialty-edit').click(ev => {
      $(ev.currentTarget).siblings().toggle();
      $(ev.currentTarget).toggle();
    });

    html.find('.specialty-rename').click(ev => {
      const oldname = $(ev.currentTarget).parents(".specialty").data("specialtyName");
      const newname = $(ev.currentTarget).siblings(".rename-field")[0].value;
      this.actor.renameSpecialty(oldname, newname);
      $(ev.currentTarget).siblings().toggle();
      $(ev.currentTarget).toggle();
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
  async _onItemCreate(event) {
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


    // Finally, create the item and render its sheet!
    return this.actor.createEmbeddedDocuments("Item", [itemData], { renderSheet: true });
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
