/**
 * Icon component using Lucide icons
 * Clean, single-color SVG icons
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { BaseComponent } from './base-component';
import * as icons from 'lucide-static';

export type IconName = keyof typeof icons;
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';

@customElement('pm-icon')
export class PMIcon extends BaseComponent {
  @property({ type: String })
  name: IconName = 'Circle';

  @property({ type: String })
  size: IconSize = 'md';

  @property({ type: String })
  color = 'currentColor';

  static styles = [
    BaseComponent.styles,
    css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      svg {
        display: block;
      }

      .icon-sm svg {
        width: 16px;
        height: 16px;
      }

      .icon-md svg {
        width: 20px;
        height: 20px;
      }

      .icon-lg svg {
        width: 24px;
        height: 24px;
      }

      .icon-xl svg {
        width: 32px;
        height: 32px;
      }
    `
  ];

  render() {
    const iconSvg = icons[this.name];

    if (!iconSvg) {
      console.warn(`Icon "${this.name}" not found`);
      return html``;
    }

    // Replace fill and stroke colors
    const coloredSvg = iconSvg
      .replace(/stroke="[^"]*"/g, `stroke="${this.color}"`)
      .replace(/fill="[^"]*"/g, `fill="none"`);

    return html`
      <span class="icon-${this.size}">
        ${unsafeHTML(coloredSvg)}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-icon': PMIcon;
  }
}
