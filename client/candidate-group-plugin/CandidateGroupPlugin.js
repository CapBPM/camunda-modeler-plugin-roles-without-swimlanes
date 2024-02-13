class CandidateGroupPlugin {
  // Map<string, BadgeContent>
  overlays = new Map();
  isActive = false;

  constructor(eventBus, overlays, elementRegistry) {
    this.modelerOverlays = overlays;
    this.modelerEventBus = eventBus;
    this.modelerElementRegistry = elementRegistry;
    eventBus.on('element.changed', (event) => {
      if (this.isActive) {
        const userTasks = this.getUserTasks();
        this.showGroupInfo(userTasks, overlays);
      }
    });
    eventBus.on('plugin.toggle', ({ toggle }) => {
      this.isActive = toggle;
      if (!toggle) {
        this.clearOverlays(overlays);
      } else {
        const userTasks = this.getUserTasks();
        this.showGroupInfo(userTasks, overlays);
      }
    })
  }

  getUserTasks() {
    return this.modelerElementRegistry.filter((element) => element.type === 'bpmn:UserTask');
  }

  clearOverlays() {
    [...this.overlays.values()].forEach((badge) => {
      badge.destroy();
      this.modelerOverlays.remove(badge.overlayId);
    });
  }

  showGroupInfo(userTasks = [], overlays) {
    userTasks.forEach((taskEl) => {
      this.removeTaskOverlay(taskEl.id, overlays);
      const groups = this.getGroups(taskEl);
      if (groups?.length) {
        this.addBadge(taskEl, groups);
      }
    });
  }

  getGroups(taskEl) {
    const { businessObject } = taskEl;
    const groups = this.getGroupsC8(businessObject) || businessObject?.candidateGroups;
    if (!groups) return [];
    return groups.split(',').map((group) => group.trim());
  }

  getGroupsC8(businessObject) {
    const values = businessObject.extensionElements?.values;
    if (!values?.length) return null;
    return values.find((val) => !!val.candidateGroups)?.candidateGroups || null;
  }

  buildHtml(groups) {
    return `<div class="badge">
      <div class="badge-content">
        ${groups.map((group, i) => {
      const isLast = i === groups.length - 1;
      return `<div class="group-list-item">${group}${isLast ? '' : ','}</div>`;
    }).join('\n')}
      </div>
    </div>`;
  }

  addBadge(taskEl, groups) {
    const badgeContent = new BadgeContent(taskEl, groups, this.modelerOverlays);
    this.overlays.set(taskEl.id, badgeContent);
  }

  removeTaskOverlay(taskId) {
    const badge = this.overlays.get(taskId);
    if (!badge) return;
    badge.destroy();
    this.modelerOverlays.remove(badge.overlayId);
    this.overlays.delete(taskId);
  }
}

CandidateGroupPlugin.$inject = [
  'eventBus',
  'overlays',
  'elementRegistry',
];

class BadgeContent {
  badgeConteiner = null;
  badgeWidth = 0;
  badgeContentWidth = 0;
  overlayId = '';

  constructor(taskEl, groups, overlays) {
    this.groups = groups;
    this.taskEl = taskEl;
    this.badgeConteiner = this.addOverlay(overlays);
    this.badgeWidth = this.getBadgeWidth();
    this.addHoverListener();
    this.setJustifyContent(this.badgeWidth < 100 ? 'center' : 'start')
  }

  get badgeContent() {
    return this.badgeConteiner?.querySelector('.badge-content') || null;
  }

  destroy() {
    this.badgeConteiner.removeEventListener('mouseenter', this.onMouseenter)
    this.badgeConteiner.removeEventListener('mouseleave', this.onMouseleave)
  }

  addOverlay(overlays) {
    const position = { top: -40, left: 40 };
    this.overlayId = overlays.add(this.taskEl, { position, html: this.buildHtml() });
    return overlays.get(this.overlayId).htmlContainer.children.item(0).querySelector('.badge-container');
  }

  buildHtml() {
    return `<div class="badge">
      <div class="badge-container">
        <div class="badge-img"></div>
        <div class="badge-content">
          ${this.groups.map((group, i) => {
      const isLast = i === this.groups.length - 1;
      return `<div class="group-list-item">${group}${isLast ? '' : ','}</div>`;
    }).join('\n')}
        </div>
      </div>
    </div>`;
  }

  getBadgeWidth() {
    const badgeImgWidth = 20;
    const marginRight = 7;
    return this.badgeContent.scrollWidth + badgeImgWidth + marginRight;
  }

  addHoverListener() {
    this.badgeConteiner.addEventListener('mouseenter', this.onMouseenter)
    this.badgeConteiner.addEventListener('mouseleave', this.onMouseleave)
  }

  onMouseenter = () => {
    this.badgeConteiner.style.width = this.badgeWidth > 100 ? `${this.badgeWidth}px` : '100px';
  }

  onMouseleave = () => {
    this.badgeConteiner.style.width = `100px`;
  }

  setJustifyContent(position) {
    if (this.badgeContent) {
      this.badgeContent.style.justifyContent = position;
      this.badgeContent.style.width = '100%';
    }
  }
}

export default {
  __init__: ['CAMUNDA_MODELER_ROLES_WITHOUT_SWIMLANES_PLUGIN'],
  CAMUNDA_MODELER_ROLES_WITHOUT_SWIMLANES_PLUGIN: ['type', CandidateGroupPlugin]
};
